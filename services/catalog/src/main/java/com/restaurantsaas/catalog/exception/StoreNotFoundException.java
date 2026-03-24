package com.restaurantsaas.catalog.exception;

import org.springframework.http.HttpStatus;

public class StoreNotFoundException extends BaseException {
    public StoreNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "STORE_NOT_FOUND");
    }
}
