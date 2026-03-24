package com.restaurantsaas.order.service;

import com.restaurantsaas.order.dto.OrderStatsResponse;
import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.repository.BillRepository;
import com.restaurantsaas.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderStatsService {

    private final OrderRepository orderRepository;
    private final BillRepository billRepository;

    public OrderStatsResponse getStatsByStore(UUID storeId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        long pendingOrdersCount = orderRepository.countByStoreIdAndStatus(storeId, Order.OrderStatus.PENDING);
        long completedBillsTodayCount = billRepository.countByStoreIdAndStatusAndCompletedAtBetween(
                storeId, Bill.BillStatus.COMPLETED, startOfDay, endOfDay);

        BigDecimal revenueToday = billRepository.sumTotalAmountByStoreIdAndStatusAndCompletedAtBetween(
                storeId, Bill.BillStatus.COMPLETED, startOfDay, endOfDay);

        BigDecimal revenueTotal = billRepository.sumTotalAmountByStoreIdAndStatus(
                storeId, Bill.BillStatus.COMPLETED);

        return OrderStatsResponse.builder()
                .pendingOrdersCount(pendingOrdersCount)
                .completedBillsTodayCount(completedBillsTodayCount)
                .revenueToday(revenueToday)
                .revenueTotal(revenueTotal)
                .build();
    }
}

