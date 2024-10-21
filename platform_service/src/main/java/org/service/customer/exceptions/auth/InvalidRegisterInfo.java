package org.service.customer.exceptions.auth;

public class InvalidRegisterInfo extends RuntimeException {

    public InvalidRegisterInfo(String message) {
        super(message);
    }

    public InvalidRegisterInfo(String message, Throwable cause) {
        super(message, cause);
    }
}

