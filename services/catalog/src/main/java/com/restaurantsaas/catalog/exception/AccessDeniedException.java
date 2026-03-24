package com.restaurantsaas.catalog.exception;

import org.springframework.http.HttpStatus;

public class AccessDeniedException extends BaseException {
    public AccessDeniedException(String message) {
        super(message, HttpStatus.FORBIDDEN, "ACCESS_DENIED");
    }
}
