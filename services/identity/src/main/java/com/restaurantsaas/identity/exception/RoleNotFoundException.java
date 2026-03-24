package com.restaurantsaas.identity.exception;

import org.springframework.http.HttpStatus;

public class RoleNotFoundException extends BaseException {
    public RoleNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "ROLE_NOT_FOUND");
    }
}
