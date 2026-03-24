package com.restaurantsaas.order.service;

import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.repository.BillItemRepository;
import com.restaurantsaas.order.repository.BillRepository;
import com.restaurantsaas.order.repository.OrderItemRepository;
import com.restaurantsaas.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private BillRepository billRepository;
    @Mock
    private BillItemRepository billItemRepository;

    @InjectMocks
    private BillService billService;

    @Test
    void updateBillStatus_completed_shouldSyncOrderDone() {
        UUID orderId = UUID.randomUUID();
        UUID billId = UUID.randomUUID();

        Bill bill = Bill.builder()
                .id(billId)
                .orderId(orderId)
                .storeId(UUID.randomUUID())
                .status(Bill.BillStatus.EXPORTED)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .totalAmount(BigDecimal.TEN)
                .build();

        Order order = Order.builder()
                .id(orderId)
                .storeId(bill.getStoreId())
                .status(Order.OrderStatus.CONFIRMED)
                .totalAmount(BigDecimal.TEN)
                .build();

        when(billRepository.findById(billId)).thenReturn(Optional.of(bill));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(billItemRepository.findByBillId(billId)).thenReturn(java.util.List.of());

        billService.updateBillStatus(billId, Bill.BillStatus.COMPLETED);

        assertEquals(Order.OrderStatus.DONE, order.getStatus());
    }
}

