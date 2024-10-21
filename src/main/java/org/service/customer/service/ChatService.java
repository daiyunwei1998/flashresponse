package org.service.customer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.chat.HandoverEvent;
import org.service.customer.dto.chat.PickUpInfo;
import org.service.customer.dto.user.UserInfo;
import org.service.customer.models.ChatMessage;
import org.service.customer.models.SessionInfo;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ChatService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MongoTemplate mongoTemplate;
    private final RabbitAdmin rabbitAdmin;

    private final TopicExchange topicExchange;
    private final SimpMessagingTemplate messagingTemplate;

    // To track which session is handled by which agent
    private final Map<String, String> sessionAgentMap = new ConcurrentHashMap<>();

    private String AI_AGENT_QUEUE = "/";

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule()) // Register the module for Java 8 time
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Disable timestamps to get ISO-8601 format

    public ChatService(RedisTemplate<String, Object> redisTemplate,
                       MongoTemplate mongoTemplate,
                       RabbitAdmin rabbitAdmin,
                       TopicExchange topicExchange, SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.mongoTemplate = mongoTemplate;
        this.rabbitAdmin = rabbitAdmin;
        this.topicExchange = topicExchange;
        this.messagingTemplate = messagingTemplate;
    }

    // ------------------- Session Management -------------------

    // Save session information to Redis
    public void saveSessionInfo(SessionInfo sessionInfo) {
        String key = "tenant:" + sessionInfo.getTenantId() + ":session:" + sessionInfo.getSessionId();
        redisTemplate.opsForValue().set(key, sessionInfo, Duration.ofHours(1));
        log.info("Saved session info for user {} with session ID {} under tenant {}",
                sessionInfo.getUserId(),
                sessionInfo.getSessionId(),
                sessionInfo.getTenantId());
    }

    // assign agent to customer
    public void assignAgent(String tenantId, String sessionId, String agentId) {
        String key = "tenant:" + tenantId + ":session:" + sessionId;
        SessionInfo sessionInfo = (SessionInfo) redisTemplate.opsForValue().get(key);
        sessionInfo.setAssignedTo(agentId);
        redisTemplate.opsForValue().set(key, sessionInfo, Duration.ofHours(1));
        log.info("Assigned agent {} to session {} under tenant {}", agentId, sessionId, tenantId);
    }

    // assign agent to customer
    public void releaseAgent(String tenantId, String sessionId) {
        String key = "tenant:" + tenantId + ":session:" + sessionId;
        SessionInfo sessionInfo = (SessionInfo) redisTemplate.opsForValue().get(key);
        sessionInfo.setAssignedTo(null);
        redisTemplate.opsForValue().set(key, sessionInfo, Duration.ofHours(1));
        log.info("Releasing agent from session {}", sessionInfo);
    }

    // Retrieve session information from Redis
    public SessionInfo getSessionInfo(String tenantId, String sessionId) {
        String key = "tenant:" + tenantId + ":session:" + sessionId;
        return (SessionInfo) redisTemplate.opsForValue().get(key);
    }

    // Save session to user mapping
    public void saveUserSessionMapping(String tenantId, String userId, String sessionId) {
        String key = "tenant:" + tenantId + ":user_session:" + userId;
        redisTemplate.opsForValue().set(key, sessionId, Duration.ofHours(1));
        log.info("Saved user-session mapping: tenant={}, user={}, session={}", tenantId, userId, sessionId);
    }

    // Map session to tenant
    public void saveSessionTenantMapping(String sessionId, String tenantId) {
        String key = "session_tenant_mapping:" + sessionId;
        redisTemplate.opsForValue().set(key, tenantId, Duration.ofHours(1));
        log.info("Mapped session {} to tenant {}", sessionId, tenantId);
    }

    // Retrieve tenant ID by session ID
    public String getTenantIdBySessionId(String sessionId) {
        String key = "session_tenant_mapping:" + sessionId;
        return (String) redisTemplate.opsForValue().get(key);
    }

    // Delete user-session mapping
    public void deleteUserSessionMapping(String tenantId, String userId) {
        String key = "tenant:" + tenantId + ":user_session:" + userId;
        redisTemplate.delete(key);
        log.info("Deleted user-session mapping for tenant={}, user={}", tenantId, userId);
    }

    // Delete session info
    public void deleteSessionInfo(String tenantId, String sessionId) {
        String key = "tenant:" + tenantId + ":session:" + sessionId;
        redisTemplate.delete(key);
        log.info("Deleted session info for session ID {} under tenant {}", sessionId, tenantId);
    }

    // Retrieve session ID by userId and tenantId
    public String getSessionIdByUserId(String tenantId, String userId) {
        String key = "tenant:" + tenantId + ":user_session:" + userId;
        String sessionId = (String) redisTemplate.opsForValue().get(key);
        if (sessionId != null) {
            log.info("Retrieved session ID {} for user {} under tenant {}", sessionId, userId, tenantId);
        } else {
            log.warn("No session found for user {} under tenant {}", userId, tenantId);
        }
        return sessionId;
    }

    // Save customer to active list
    public void addUserToActiveList(String tenantId, UserInfo userInfo) {
        String key = "tenant:" + tenantId + ":active_customers";
        redisTemplate.opsForList().rightPush(key, userInfo);

        log.info("Added user to active list: tenant={}, user={}", tenantId, userInfo.getUserId());
    }

    // Get the list of users
    @SuppressWarnings("unchecked")
    public List<UserInfo> getActiveUsers(String tenantId) {
        String key = "tenant:" + tenantId + ":active_customers";

        // Retrieve the list from Redis and cast it to List<UserInfo>
        List<Object> rawList = redisTemplate.opsForList().range(key, 0, -1);

        // Cast the list to List<UserInfo>
        List<UserInfo> activeUsers = (List<UserInfo>) (List<?>) rawList;

        log.info("Retrieved active user list: tenant={}", tenantId);

        return activeUsers;
    }

    // Remove a specific user from the list
    public void removeUserFromActiveList(String tenantId, UserInfo userInfo) {
        String key = "tenant:" + tenantId + ":active_customers";

        // This will remove one instance of the userInfo object from the list
        redisTemplate.opsForList().remove(key, 1, userInfo);

        log.info("Removed user from active list: tenant={}, user={}", tenantId, userInfo.getUserId());
    }


    // ------------------- Agent Management -------------------

    // Add an agent to the available list for a tenant
    public void addAgentToAvailableList(String tenantId, String agentId) {
        String key = "tenant:" + tenantId + ":available_agents";
        redisTemplate.opsForList().rightPush(key, agentId);
        log.info("Added agent {} to available list under tenant {}", agentId, tenantId);
    }

    // Get available agents for a tenant
    public List<String> getAvailableAgents(String tenantId) {
        String key = "tenant:" + tenantId + ":available_agents";
        List<Object> agents = redisTemplate.opsForList().range(key, 0, -1);

        if (agents == null) {
            return Collections.emptyList();
        }

        // Convert List<Object> to List<String>
        List<String> agentIds = agents.stream()
                .filter(Objects::nonNull)
                .map(Object::toString)
                .collect(Collectors.toList());

        log.info("Available agents for tenant {}: {}", tenantId, agentIds);
        return agentIds;
    }

    // Remove an agent from the available list for a tenant
    public void removeAgentFromAvailableList(String tenantId, String agentId) {
        String key = "tenant:" + tenantId + ":available_agents";
        redisTemplate.opsForList().remove(key, 1, agentId);
        log.info("Removed agent {} from available list under tenant {}", agentId, tenantId);
    }

    // ------------------- Queue Management -------------------

    // Dynamically create and bind queues for tenant
    public void createAndBindTenantQueues(String tenantId) {
        String stompExchange = topicExchange.getName(); // Using injected TopicExchange

        // Create tenant-specific queues
        Queue newCustomerQueue = new Queue(tenantId + ".new_customer", true);
        Queue customerMessageQueue = new Queue(tenantId + ".customer_message", true);
        Queue aiMessageQueue = new Queue("ai_message", true);
        Queue customerWaitingQueue = new Queue(tenantId + ".customer_waiting", true);
        rabbitAdmin.declareQueue(newCustomerQueue);
        rabbitAdmin.declareQueue(customerMessageQueue);
        rabbitAdmin.declareQueue(aiMessageQueue);
        rabbitAdmin.declareQueue(customerWaitingQueue);

        // Bind queues to the 'amq.topic' exchange with appropriate routing keys
        Binding newCustomerBinding = BindingBuilder.bind(newCustomerQueue)
                .to(topicExchange)
                .with(tenantId + ".new_customer");
        rabbitAdmin.declareBinding(newCustomerBinding);

        Binding customerMessageBinding = BindingBuilder.bind(customerMessageQueue)
                .to(topicExchange)
                .with(tenantId + ".customer_message");
        rabbitAdmin.declareBinding(customerMessageBinding);

        Binding aiMessageBinding = BindingBuilder.bind(aiMessageQueue)
                .to(topicExchange)
                .with("ai_message");
        rabbitAdmin.declareBinding(aiMessageBinding);

        Binding customerWaitingBinding = BindingBuilder.bind(customerWaitingQueue)
                .to(topicExchange)
                .with(tenantId + ".customer_waiting");
        rabbitAdmin.declareBinding(customerWaitingBinding);

        log.info("Queues {} and {} bound to exchange {} with routing keys {} and {}",
                newCustomerQueue.getName(),
                customerMessageQueue.getName(),
                stompExchange,
                tenantId + ".new_customer",
                tenantId + ".customer_message");
    }

    // ------------------- Message Handling -------------------

    public void sendAgentMessageToCustomer(ChatMessage chatMessage) {
        String customerId = chatMessage.getReceiver();
        if (customerId == null) {
            log.error("Agent {} attempted to send message without specifying a receiver.", chatMessage.getSender());
            return;
        }

        // Send the message directly to the customer's queue
        String destination = "/queue/messages";
        messagingTemplate.convertAndSendToUser(customerId, destination, chatMessage);
        log.info("Sent agent {} message to customer {} under tenant {}",
                chatMessage.getSender(),
                customerId,
                chatMessage.getTenantId());
    }

    // Save chat message to both Redis and MongoDB
    public void saveMessage(ChatMessage chatMessage) {
        saveMessageToRedis(chatMessage);
        saveMessageToMongo(chatMessage);
    }

    public void deleteRedisKey(String key) {
        redisTemplate.delete(key);
    }

    // Save message to Redis
    private void saveMessageToRedis(ChatMessage chatMessage) {
        String key = "tenant:" + chatMessage.getTenantId() + ":chat:customer_messages:" + chatMessage.getSessionId();
        redisTemplate.opsForList().rightPush(key, chatMessage);
        log.info("Saved message to Redis under key: {}", key);
    }

    // Save message to MongoDB
    private void saveMessageToMongo(ChatMessage chatMessage) {
        String collectionName = "chat_messages_" + chatMessage.getTenantId();
        mongoTemplate.save(chatMessage, collectionName);
        log.info("Saved message to MongoDB under collection: {}", collectionName);
    }

    // Load message for specific session
    public List<ChatMessage> loadMessageHistoryFromRedis(String tenantId, String customerId) {
        String sessionId = getSessionIdByUserId(tenantId, customerId);
        String key = "tenant:" + tenantId + ":chat:customer_messages:" + sessionId;
        log.info("Loading message history from Redis for key: {}", key);
        // Retrieve the entire message list from Redis as List<Object>
        List<Object> rawMessageHistory = redisTemplate.opsForList().range(key, 0, -1);  // Get all elements in the list

        // Deserialize the list of objects into List<ChatMessage>
        List<ChatMessage> messageHistory = rawMessageHistory.stream()
                .map(object -> objectMapper.convertValue(object, ChatMessage.class))
                .collect(Collectors.toList());

        log.info("Loaded message history from Redis for key: {} \n {}", messageHistory);

        return messageHistory;  // Return the message history
    }


    public void notifyNewCustomerSession(String tenantId, ChatMessage chatMessage) {
        messagingTemplate.convertAndSend("/topic/" + tenantId + ".new_customer", chatMessage);
    }

    // Broadcast customer message to all available agents or AI agent if no agents are available
    public void broadcastMessage(ChatMessage chatMessage) {
        String tenantId = chatMessage.getTenantId();
        String sessionId = chatMessage.getSessionId();
        SessionInfo sessionInfo = getSessionInfo(tenantId, sessionId);

        if (sessionInfo.getAssignedTo() == null) {
            //  forward to AI agent
            forwardMessageToAiAgent(tenantId, chatMessage);
        } else {
            // Broadcast message to all available human agents
            String routingKey = tenantId + ".customer_message";
            try {
                String messageBody = convertChatMessageToJson(chatMessage);
                messagingTemplate.convertAndSend("/topic/" + tenantId + ".customer_message", chatMessage);
                log.info("Broadcasted customer message from {} to all agents under tenant {}",
                        chatMessage.getSender(),
                        tenantId);
            } catch (Exception e) {
                log.error("Failed to broadcast message: {}", e.getMessage());
            }
        }
    }

    // Convert ChatMessage to JSON string
    private String convertChatMessageToJson(ChatMessage chatMessage) {
        try {
            return objectMapper.writeValueAsString(chatMessage);
        } catch (JsonProcessingException e) {
            log.error("Error converting ChatMessage to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    private String convertPickUpInfoToJson(PickUpInfo pickUpInfo) {
        try {
            return objectMapper.writeValueAsString(pickUpInfo);
        } catch (JsonProcessingException e) {
            log.error("Error converting pickUpInfo to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    // Forward the message to an AI agent if no human agent is available
    public void forwardMessageToAiAgent(String tenantId, ChatMessage chatMessage) {
        log.info("Forwarding message from {} to AI agent for tenant {}", chatMessage.getSender(), chatMessage.getTenantId());

        String messageBody = convertChatMessageToJson(chatMessage);

        try {
            messagingTemplate.convertAndSend("/topic/" + "ai_message", messageBody);
            log.info("Forwarded message to AI agent ");
        } catch (Exception e) {
            log.error("Failed to forward message to AI agent: {}", e.getMessage());
        }
    }


    // notify new customer in waiting queue
    public void publishCustomerWaiting(HandoverEvent event) {
        String tenantId = event.getTenantId();
        try {
            String eventBody = objectMapper.writeValueAsString(event);
            messagingTemplate.convertAndSend("/topic/" + tenantId + ".customer_waiting", event);
            log.info("notify customer waiting to {}", "/topic/" + tenantId + ".customer_waiting");
    }   catch (JsonProcessingException e) {
            log.error("Error converting ChatMessage to JSON: {}", e.getMessage());
        }
        catch (Exception e) {
            log.error("Failed to forward message to AI agent: {}", e.getMessage());
        }
    }

    // ------------------- Session-Agent Mapping -------------------

    // Assign an agent to a session
    public void assignAgentToSession(String sessionId, String agentId) {
        sessionAgentMap.put(sessionId, agentId);
        log.info("Assigned agent {} to session {}", agentId, sessionId);
    }

    // Get the assigned agent for a session
    public String getAgentForSession(String sessionId) {
        return sessionAgentMap.get(sessionId);
    }

    // Remove agent assignment from a session
    public void removeAgentFromSession(String sessionId) {
        String agentId = sessionAgentMap.remove(sessionId);
        if (agentId != null) {
            log.info("Removed agent {} from session {}", agentId, sessionId);
        }
    }

    // ------------------- Handling Responses -------------------

    /**
     * This method should be called when a response is received from an agent (human or AI).
     * It acknowledges the message in RabbitMQ to prevent reprocessing.
     */
    public void handleResponse(ChatMessage responseMessage) {
        // Acknowledge the original customer message
        acknowledgeMessage(responseMessage.getSessionId());

        // If response is from a human agent, map the session to the agent
        if ("agent".equals(responseMessage.getUserType())) {
            assignAgentToSession(responseMessage.getSessionId(), responseMessage.getSender());
        }

        log.info("Handled response from {} for session {}", responseMessage.getSender(), responseMessage.getSessionId());
    }

    /**
     * Acknowledge the message in RabbitMQ.
     * Note: Actual acknowledgment is handled by the consumer (listener).
     * This method can be used to perform any additional acknowledgment logic if needed.
     */
    public void acknowledgeMessage(String sessionId) {
        // TODO
        log.info("Acknowledged message for session ID {}", sessionId);
    }

    // ------------------- Utility Methods -------------------

    /**
     * Retrieve all tenant-specific customer message queues.
     * This can be used by RabbitListeners to subscribe to these queues.
     */
    public List<String> getCustomerMessageQueueNames() {
        // For demonstration, assuming tenant1. In a real application, fetch dynamically.
        return Arrays.asList("tenant1.customer_message");
    }
}
