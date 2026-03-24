package com.restaurantsaas.order.dto;

import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private UUID id;
    private UUID storeId;
    private UUID orderId;

    private String customerName;
    private String customerPhone;

    private BigDecimal totalAmount;

    private Bill.BillStatus status;
    private Order.PaymentMethod paymentMethod;
    private Order.PaymentStatus paymentStatus;

    private LocalDateTime exportedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<BillItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillItemResponse {
        private UUID id;
        private UUID productId;
        private String productName;
        private Integer quantity;
        private BigDecimal priceAtTime;
        private String notes;
    }
}

