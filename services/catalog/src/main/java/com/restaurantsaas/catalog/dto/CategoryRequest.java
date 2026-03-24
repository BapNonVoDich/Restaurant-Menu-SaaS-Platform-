package com.restaurantsaas.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    private String name;
    private Integer sortOrder = 0;

    // JSON string describing how this category card/section should look on the menu
    private String styleJson;
}
