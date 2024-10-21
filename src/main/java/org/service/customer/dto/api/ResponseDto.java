package org.service.customer.dto.api;

import lombok.Data;

@Data
public class ResponseDto<T> {
    private T data;

    public ResponseDto(T data) {
        this.data = data;
    }
}
