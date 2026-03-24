package com.restaurantsaas.identity.exception;

import org.springframework.http.HttpStatus;

public class UserDisabledException extends BaseException {
    public UserDisabledException(String message) {
        super(message, HttpStatus.FORBIDDEN, "USER_DISABLED");
    }
}
