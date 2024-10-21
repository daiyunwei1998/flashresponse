package org.service.customer.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class HandoverEvent{
    @JsonProperty("tenant_id")
    private String tenantId;
    @JsonProperty("customer_id")
    private String customerId;
    @JsonProperty("session_id")
    private String sessionId;

    private String agentId; // Optional
    private String estimatedWaitTime; // Optional
}
