package org.service.customer.config;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.user.UserInfo;
import org.service.customer.models.SessionInfo;
import org.service.customer.service.ChatService;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
public class WebSocketEventListener {
    private final RabbitAdmin rabbitAdmin;
    private final ChatService chatService;

    public WebSocketEventListener(RabbitAdmin rabbitAdmin, ChatService chatService) {
        this.rabbitAdmin = rabbitAdmin;
        this.chatService = chatService;
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();

        String tenantId = chatService.getTenantIdBySessionId(sessionId);
        if (tenantId == null) {
            log.warn("No tenantId found for disconnected session ID {}", sessionId);
            return;
        }

        SessionInfo sessionInfo = chatService.getSessionInfo(tenantId, sessionId);

        if (sessionInfo != null) {
            String userId = sessionInfo.getUserId();
            String userType = sessionInfo.getUserType();

            // Remove userId to sessionId mapping
            chatService.deleteUserSessionMapping(tenantId, userId);

            // Delete session info
            chatService.deleteSessionInfo(tenantId, sessionId);

            log.info("User {} of type {} has disconnected and session data cleaned up under tenant {}", userId, userType, tenantId);

            // Remove the chat history from Redis
            String redisKey = "tenant:" + tenantId + ":chat:customer_messages:" + sessionId;
            chatService.deleteRedisKey(redisKey);
            log.info("Deleted chat history from Redis with key: {}", redisKey);


            if ("agent".equals(userType)) {
                // Remove agent from available list
                chatService.removeAgentFromAvailableList(tenantId, userId);
                return;
            }

            // remove customer from active list
            if ("customer".equals(userType)) {
                // Remove agent from available list
                chatService.removeUserFromActiveList(tenantId, new UserInfo(userId, sessionInfo.getUserName()));
                return;
            }

            String queueName = "messages-user" + sessionId;
            rabbitAdmin.deleteQueue(queueName);
            log.info("Deleted queue: " + queueName);
        } else {
            log.warn("No session info found for disconnected session ID {} under tenant {}", sessionId, tenantId);
        }
    }
}
