package org.service.customer.controller.v1;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.chat.PickUpInfo;
import org.service.customer.dto.user.UserInfo;
import org.service.customer.models.ChatMessage;
import org.service.customer.models.SessionInfo;
import org.service.customer.service.ChatService;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.Objects;

@Slf4j
@Controller
public class ChatController {

    private final ChatService chatService;
    private final RabbitAdmin rabbitAdmin;
    private final TopicExchange topicExchange;

    public ChatController(ChatService chatService, RabbitAdmin rabbitAdmin, TopicExchange topicExchange) {
        this.chatService = chatService;
        this.rabbitAdmin = rabbitAdmin;
        this.topicExchange = topicExchange;
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        String tenantId = chatMessage.getTenantId();
        String userId = chatMessage.getSender();
        String userType = chatMessage.getUserType();
        String userName = chatMessage.getSenderName();

        if (tenantId == null || userId == null || userType == null) {
            log.error("Missing user information in chat message");
            return;
        }

        Queue newCustomerQueue = new Queue(tenantId + ".new_customer", true);
        rabbitAdmin.declareQueue(newCustomerQueue);


        // Bind queues to the 'amq.topic' exchange with appropriate routing keys
        Binding newCustomerBinding = BindingBuilder.bind(newCustomerQueue)
                .to(topicExchange)
                .with(tenantId + ".new_customer");
        rabbitAdmin.declareBinding(newCustomerBinding);

        chatMessage.setSessionId(headerAccessor.getSessionId());

        // Create and save SessionInfo
        SessionInfo sessionInfo = new SessionInfo();
        sessionInfo.setSessionId(chatMessage.getSessionId());
        sessionInfo.setUserId(userId);
        sessionInfo.setUserType(userType);
        sessionInfo.setTenantId(tenantId);
        sessionInfo.setUserName(userName);

        chatService.saveSessionInfo(sessionInfo);
        chatService.saveUserSessionMapping(tenantId, userId, chatMessage.getSessionId());
        chatService.saveSessionTenantMapping(chatMessage.getSessionId(), tenantId);

        log.info("User {} of type {} has joined with session ID {} under tenant {}", userId, userType, chatMessage.getSessionId(), tenantId);

        chatMessage.setTimestamp(Instant.now());
        chatMessage.setType(ChatMessage.MessageType.JOIN);

        // Delegate queue creation and binding to ChatService
        chatService.createAndBindTenantQueues(tenantId);

        if ("agent".equals(userType)) {
            chatService.addAgentToAvailableList(tenantId, userId);
            log.info("Agent {} is now available under tenant {}", userId, tenantId);
        }

        // Send a notification to all agents that a customer has joined
        if ("customer".equals(userType)) {
            chatService.notifyNewCustomerSession(tenantId, chatMessage);
            // Append to active customer list
            chatService.addUserToActiveList(tenantId, new UserInfo(userId, userName));
            log.info("Customer {} is now active under tenant {}", userId, tenantId);
        }


    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        String tenantId = chatMessage.getTenantId();
        String userId = chatMessage.getSender();
        String userType = chatMessage.getUserType();

        if (tenantId == null || userId == null || userType == null) {
            log.error("Missing user information in chat message");
            return;
        }

        String sessionId = headerAccessor.getSessionId();
        chatMessage.setSessionId(sessionId);
        chatMessage.setTimestamp(Instant.now());

        SessionInfo sessionInfo = chatService.getSessionInfo(tenantId, sessionId);
        if (sessionInfo == null) {
            log.warn("No session info found for session ID {} under tenant {}", sessionId, tenantId);
            return;
        }

        if ("customer".equals(sessionInfo.getUserType())) {
            chatMessage.setSource(ChatMessage.SourceType.USER);
            chatService.broadcastMessage(chatMessage);
            log.info("Broadcasted customer message from {} under tenant {}", userId, tenantId);
        } else if ("agent".equals(sessionInfo.getUserType())) {
            chatMessage.setSource(ChatMessage.SourceType.AGENT);
            // 'receiver' contains the customer's userId
            // Forward the message directly to the customer via SimpMessagingTemplate
            chatService.sendAgentMessageToCustomer(chatMessage);
            log.info("Sent agent {} message to customer {} under tenant {}", userId, chatMessage.getReceiver(), tenantId);
        }

        // Save the message
        chatService.saveMessage(chatMessage);
    }

    @MessageMapping("/chat.pickUp")
    public void handlePickUp(@Payload PickUpInfo pickUpInfo) {
        String tenantId = pickUpInfo.getTenantId();
        String userId = pickUpInfo.getCustomer();
        String type = pickUpInfo.getType();
        String sessionId = chatService.getSessionIdByUserId(tenantId, userId);
        log.info("Received pick up request:"+pickUpInfo);
        if (Objects.equals(type, "pickup")) {
            chatService.assignAgent(tenantId, sessionId, userId);
            log.info("Picking up customer: " + pickUpInfo);
        } else if (Objects.equals(type, "drop")) {
            chatService.releaseAgent(tenantId, sessionId);
            log.info("Releasing agent in: "+sessionId);
        }

    }

}
