package com.restaurantsaas.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponse {
    private UUID storeId;
    private String storeName;
    private String backgroundUrl;
    private String menuTemplateKey;
    private Boolean tableOrderingEnabled;
    private Map<String, Object> customization;
    private List<CategoryMenu> categories;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryMenu {
        private UUID id;
        private String name;
        private Integer sortOrder;
        private Map<String, Object> style;
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
        private Integer sortOrder;
        private List<UUID> categoryIds;
        private Map<String, Object> style;
    }
}
