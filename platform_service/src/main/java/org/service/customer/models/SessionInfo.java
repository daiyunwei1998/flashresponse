package org.service.customer.models;

import lombok.Data;
import java.io.Serializable;

@Data
public class SessionInfo implements Serializable {
    private String sessionId;
    private String userId;
    private String userName;
    private String userType; // "customer" or "agent"
    private String assignedTo; // For customers, the assigned agent ID; for agents, list of customer IDs; null will be handle by AI
    private String tenantId; // Add tenantId to session info
}
