package com.restaurantsaas.order.service;

import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.entity.Order;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private BillRepository billRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void updateOrderStatus_shouldRejectTransitionFromDone() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .storeId(UUID.randomUUID())
                .status(Order.OrderStatus.DONE)
                .totalAmount(BigDecimal.TEN)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(RuntimeException.class,
                () -> orderService.updateOrderStatus(orderId, Order.OrderStatus.CONFIRMED));
    }

    @Test
    void updateOrderStatus_done_shouldSyncBillCompleted() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .storeId(UUID.randomUUID())
                .status(Order.OrderStatus.CONFIRMED)
                .totalAmount(BigDecimal.TEN)
                .build();

        Bill bill = Bill.builder()
                .id(UUID.randomUUID())
                .storeId(order.getStoreId())
                .orderId(orderId)
                .status(Bill.BillStatus.EXPORTED)
                .totalAmount(BigDecimal.TEN)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(billRepository.findByOrderId(orderId)).thenReturn(Optional.of(bill));
        when(billRepository.save(any(Bill.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus(orderId, Order.OrderStatus.DONE);

        assertEquals(Bill.BillStatus.COMPLETED, bill.getStatus());
        verify(billRepository).save(any(Bill.class));
    }

    @Test
    void updateOrderStatus_confirmed_shouldNotTouchBill() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .storeId(UUID.randomUUID())
                .status(Order.OrderStatus.PENDING)
                .totalAmount(BigDecimal.TEN)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.updateOrderStatus(orderId, Order.OrderStatus.CONFIRMED);

        verify(billRepository, never()).save(any(Bill.class));
    }
}

