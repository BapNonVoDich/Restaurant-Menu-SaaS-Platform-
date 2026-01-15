package com.restaurantsaas.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponse {
    private UUID storeId;
    private String storeName;
    private List<CategoryMenu> categories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryMenu {
        private UUID id;
        private String name;
        private Integer sortOrder;
        private List<ProductMenu> products;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductMenu {
        private UUID id;
        private String name;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private Boolean isAvailable;
    }
}
