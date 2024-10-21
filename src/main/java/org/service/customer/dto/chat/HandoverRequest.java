package org.service.customer.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class HandoverRequest {
    @JsonProperty("session_id")
    private String sessionId;
    @JsonProperty("customer_id")
    private String customerId;
    @JsonProperty("tenant_id")
    private String tenantId;
    private String summary;
    private String reason;
}
