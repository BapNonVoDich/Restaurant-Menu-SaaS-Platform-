package com.restaurantsaas.order.service;

import com.restaurantsaas.order.dto.OrderRequest;
import com.restaurantsaas.order.dto.OrderResponse;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.entity.OrderItem;
import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.repository.BillRepository;
import com.restaurantsaas.order.repository.OrderItemRepository;
import com.restaurantsaas.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BillRepository billRepository;

    @Transactional
    public OrderResponse createOrder(UUID storeId, OrderRequest request) {
        String tableLabel = null;
        if (request.getTableLabel() != null) {
            String t = request.getTableLabel().trim();
            if (!t.isEmpty()) {
                tableLabel = t.length() > 50 ? t.substring(0, 50) : t;
            }
        }

        Order order = Order.builder()
                .storeId(storeId)
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .tableLabel(tableLabel)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        // Calculate total and create items
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        
        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            BigDecimal itemTotal = itemRequest.getPriceAtTime()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem item = OrderItem.builder()
                    .productId(itemRequest.getProductId())
                    .productName(itemRequest.getProductName())
                    .quantity(itemRequest.getQuantity())
                    .priceAtTime(itemRequest.getPriceAtTime())
                    .notes(itemRequest.getNotes())
                    .build();
            items.add(item);
        }

        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);

        // Save items with order reference
        for (OrderItem item : items) {
            item.setOrderId(order.getId());
            orderItemRepository.save(item);
        }

        return mapToResponse(order);
    }

    public OrderResponse getOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByStore(UUID storeId, String tableFilter) {
        List<Order> orders;
        if (tableFilter != null && !tableFilter.trim().isEmpty()) {
            String t = tableFilter.trim();
            if (t.length() > 50) {
                t = t.substring(0, 50);
            }
            orders = orderRepository.findByStoreIdAndTableLabelOrderByCreatedAtDesc(storeId, t);
        } else {
            orders = orderRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
        }
        return orders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByStoreAndStatus(UUID storeId, Order.OrderStatus status, String tableFilter) {
        List<Order> orders;
        if (tableFilter != null && !tableFilter.trim().isEmpty()) {
            String t = tableFilter.trim();
            if (t.length() > 50) {
                t = t.substring(0, 50);
            }
            orders = orderRepository.findByStoreIdAndStatusAndTableLabelOrderByCreatedAtDesc(storeId, status, t);
        } else {
            orders = orderRepository.findByStoreIdAndStatusOrderByCreatedAtDesc(storeId, status);
        }
        return orders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        validateTransition(order.getStatus(), status);
        order.setStatus(status);
        order = orderRepository.save(order);

        if (status == Order.OrderStatus.DONE || status == Order.OrderStatus.CANCELLED) {
            billRepository.findByOrderId(orderId).ifPresent(bill -> {
                if (status == Order.OrderStatus.DONE && bill.getStatus() != Bill.BillStatus.COMPLETED) {
                    bill.setStatus(Bill.BillStatus.COMPLETED);
                    bill.setCompletedAt(java.time.LocalDateTime.now());
                    billRepository.save(bill);
                } else if (status == Order.OrderStatus.CANCELLED && bill.getStatus() != Bill.BillStatus.CANCELLED) {
                    bill.setStatus(Bill.BillStatus.CANCELLED);
                    bill.setCancelledAt(java.time.LocalDateTime.now());
                    billRepository.save(bill);
                }
            });
        }

        return mapToResponse(order);
    }

    public Order getOrderEntity(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Transactional
    public OrderResponse updatePaymentStatus(UUID orderId, Order.PaymentStatus paymentStatus, Order.PaymentMethod paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus(paymentStatus);
        if (paymentMethod != null) {
            order.setPaymentMethod(paymentMethod);
        }
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        
        return OrderResponse.builder()
                .id(order.getId())
                .storeId(order.getStoreId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .tableLabel(order.getTableLabel())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .items(items.stream()
                        .map(item -> OrderResponse.OrderItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProductId())
                                .productName(item.getProductName())
                                .quantity(item.getQuantity())
                                .priceAtTime(item.getPriceAtTime())
                                .notes(item.getNotes())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private void validateTransition(Order.OrderStatus current, Order.OrderStatus target) {
        if (current == target) {
            return;
        }
        if (current == Order.OrderStatus.DONE || current == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Finalized order cannot be updated");
        }
        if (current == Order.OrderStatus.PENDING &&
                target != Order.OrderStatus.CONFIRMED &&
                target != Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Invalid status transition from PENDING");
        }
        if (current == Order.OrderStatus.CONFIRMED &&
                target != Order.OrderStatus.DONE &&
                target != Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Invalid status transition from CONFIRMED");
        }
    }
}
