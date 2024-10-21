package org.service.customer.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.Instant;

@Data
public class PickUpInfo {
    private String agent;
    private String customer;
    private String type;
    @JsonProperty("tenant_id")
    private String tenantId;
    private Instant timestamp;
}

