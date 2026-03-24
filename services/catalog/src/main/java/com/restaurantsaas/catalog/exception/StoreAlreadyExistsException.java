package com.restaurantsaas.catalog.exception;

import org.springframework.http.HttpStatus;

public class StoreAlreadyExistsException extends BaseException {
    public StoreAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, "STORE_ALREADY_EXISTS");
    }
}
