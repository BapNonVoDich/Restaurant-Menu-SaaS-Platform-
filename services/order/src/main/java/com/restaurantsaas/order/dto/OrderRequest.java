package com.restaurantsaas.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class OrderRequest {
    private String customerName;
    private String customerPhone;

    /** Mã / tên bàn khi cửa hàng bật đặt món theo bàn */
    private String tableLabel;

    @NotEmpty(message = "Order items are required")
    @Valid
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private UUID productId;
        
        @NotEmpty(message = "Product name is required")
        private String productName;
        
        private Integer quantity = 1;
        private java.math.BigDecimal priceAtTime;
        private String notes;
    }
}
