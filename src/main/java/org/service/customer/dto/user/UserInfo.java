package org.service.customer.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {
    @JsonProperty("user_id")
    private String userId;
    @JsonProperty("user_name")
    private String userName;
}
