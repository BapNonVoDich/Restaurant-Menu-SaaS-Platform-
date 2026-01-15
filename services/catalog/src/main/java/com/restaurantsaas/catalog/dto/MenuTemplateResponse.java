package com.restaurantsaas.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuTemplateResponse {
    private UUID id;
    private UUID storeId;
    private String name;
    private String templateData; // JSON string
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
