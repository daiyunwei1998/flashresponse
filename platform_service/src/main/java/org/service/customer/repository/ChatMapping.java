package org.service.customer.repository;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import lombok.Data;

@Data
@RedisHash("ChatMapping")
public class ChatMapping {

    @Id
    private String customerId;
    private String agentId;

}
