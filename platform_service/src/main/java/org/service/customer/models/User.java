package org.service.customer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.sql.Timestamp;

@Entity
@Data @ToString
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("password")
    private String password;

    @JsonProperty("email")
    private String email;

    @JsonProperty("registered_time")
    private Timestamp registeredTime;

    @JsonProperty("signed_time")
    private Timestamp signedTime;

    @JsonProperty("role")
    private String role;

    @JsonProperty("tenant_id")
    private String tenantId;
}

