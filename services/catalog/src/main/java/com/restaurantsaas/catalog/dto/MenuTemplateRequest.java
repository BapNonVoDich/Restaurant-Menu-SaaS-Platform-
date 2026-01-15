package com.restaurantsaas.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MenuTemplateRequest {
    @NotBlank(message = "Template name is required")
    private String name;

    @NotNull(message = "Template data is required")
    private String templateData; // JSON string
}
