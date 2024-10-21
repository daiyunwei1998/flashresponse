package org.service.customer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class HandoverRequest {
    @JsonProperty("customer_id")
    private String customerId;
    private String summary;
    @JsonProperty("session_id")
    private String sessionId;  // TODO might be removable
    @JsonProperty("tenant_id")
    private String tenantId;
}
