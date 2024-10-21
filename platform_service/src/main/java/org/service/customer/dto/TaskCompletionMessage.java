package org.service.customer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter @Setter
public class TaskCompletionMessage {
    private String tenantId;
    private String message;
    @JsonProperty("number_of_entries")
    private int numberOfEntries;
    private String file;
    private String status;
    private String error;

    // Default constructor (required for deserialization)
    public TaskCompletionMessage() {}
}

