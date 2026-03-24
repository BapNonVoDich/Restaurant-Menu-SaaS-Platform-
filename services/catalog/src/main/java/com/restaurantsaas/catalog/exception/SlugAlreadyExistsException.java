package com.restaurantsaas.catalog.exception;

import org.springframework.http.HttpStatus;

public class SlugAlreadyExistsException extends BaseException {
    public SlugAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, "SLUG_ALREADY_EXISTS");
    }
}
