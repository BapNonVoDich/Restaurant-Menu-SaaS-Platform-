package com.restaurantsaas.catalog.dto;

import java.util.UUID;

/**
 * Danh mục tóm tắt cho dashboard — không kèm danh sách sản phẩm.
 */
public record CategorySummaryResponse(
        UUID id,
        String name,
        Integer sortOrder,
        String styleJson,
        Long productCount
) {
}
