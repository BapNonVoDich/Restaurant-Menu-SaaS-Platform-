package com.restaurantsaas.catalog.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateProductCategoriesRequest {
    private List<UUID> categoryIds;
}
