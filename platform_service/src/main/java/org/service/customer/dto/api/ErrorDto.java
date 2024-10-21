package org.service.customer.dto.api;

import lombok.Data;

@Data
public class ErrorDto<T> {
    private T error;
    public ErrorDto(T error) {
        this.error = error;
    }
}
