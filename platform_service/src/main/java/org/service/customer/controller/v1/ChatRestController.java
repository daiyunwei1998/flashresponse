package org.service.customer.controller.v1;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.HandoverRequest;
import org.service.customer.dto.chat.HandoverEvent;
import org.service.customer.models.ChatMessage;
import org.service.customer.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/v1/chats")
public class ChatRestController {

    private final ChatService chatService;

    public ChatRestController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/handover")
    public ResponseEntity<?> handoverToAgent(@RequestBody HandoverRequest handoverRequest) {
        String sessionId = handoverRequest.getSessionId();
        String customerId = handoverRequest.getCustomerId();
        String tenantId = handoverRequest.getTenantId();

        HandoverEvent event = new HandoverEvent();
        event.setCustomerId(customerId);
        event.setTenantId(tenantId);
        event.setSessionId(sessionId);

        // Only publish that the customer is waiting
        chatService.publishCustomerWaiting(event);

        return new ResponseEntity<>(HttpStatus.ACCEPTED);
    }

    @PostMapping("/history")
    public List<ChatMessage> getHistory(@RequestBody Map<String, Object> requestBody) {
        // Extract tenantId and sessionId from the request body
        String tenantId = (String) requestBody.get("tenant_id");
        String customerId = (String) requestBody.get("customer_id");

        // Call the chatService's getHistory method
        return chatService.loadMessageHistoryFromRedis(tenantId, customerId);
    }

}
