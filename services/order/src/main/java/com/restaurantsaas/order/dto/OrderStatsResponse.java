package com.restaurantsaas.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatsResponse {
    private long pendingOrdersCount;
    private long completedBillsTodayCount;
    private BigDecimal revenueToday;
    private BigDecimal revenueTotal;
}

