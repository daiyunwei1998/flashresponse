package org.service.customer.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotBlank;

@Data
public class AdminLoginRequest {
    @NotBlank(message = "alias is required")
    private String alias;

    @JsonProperty("password")
    @NotBlank(message = "Password is required")
    private String password;

    @JsonProperty("email")
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;
}
