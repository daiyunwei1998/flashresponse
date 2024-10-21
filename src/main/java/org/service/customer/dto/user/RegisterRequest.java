package org.service.customer.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotBlank;

@Data
public class RegisterRequest {
    @JsonProperty("tenant_id")
    @NotBlank(message = "tenant id is required")
    private String tenantId;

    @JsonProperty("name")
    @NotBlank(message = "Name is required")
    private String name;

    @JsonProperty("password")
    @NotBlank(message = "Password is required")
    private String password;

    @JsonProperty("email")
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @JsonProperty("role")
    @NotBlank(message = "Role is required")
    private String role;
}
