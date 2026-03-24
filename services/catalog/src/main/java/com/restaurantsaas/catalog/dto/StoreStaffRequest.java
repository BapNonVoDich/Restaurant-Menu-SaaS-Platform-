package com.restaurantsaas.catalog.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class StoreStaffRequest {
    @NotNull
    private UUID userId;
}

