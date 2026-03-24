package com.restaurantsaas.order.service;

import com.restaurantsaas.order.dto.BillResponse;
import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.entity.BillItem;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.entity.OrderItem;
import com.restaurantsaas.order.repository.BillItemRepository;
import com.restaurantsaas.order.repository.BillRepository;
import com.restaurantsaas.order.repository.OrderItemRepository;
import com.restaurantsaas.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;

    @Transactional
    public BillResponse exportBill(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (billRepository.findByOrderId(orderId).isPresent()) {
            throw new RuntimeException("Bill already exists for this order");
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        LocalDateTime now = LocalDateTime.now();

        Bill bill = Bill.builder()
                .storeId(order.getStoreId())
                .orderId(order.getId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .totalAmount(order.getTotalAmount())
                .status(Bill.BillStatus.EXPORTED)
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .exportedAt(now)
                .build();

        Bill saved = billRepository.save(bill);

        for (OrderItem item : orderItems) {
            BillItem billItem = BillItem.builder()
                    .billId(saved.getId())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .quantity(item.getQuantity())
                    .priceAtTime(item.getPriceAtTime())
                    .notes(item.getNotes())
                    .build();
            billItemRepository.save(billItem);
        }

        return mapToResponse(saved);
    }

    public List<BillResponse> getBillsByStore(UUID storeId) {
        List<Bill> bills = billRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
        return bills.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillResponse updateBillStatus(UUID billId, Bill.BillStatus status) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        LocalDateTime now = LocalDateTime.now();
        bill.setStatus(status);

        // Todo 5: update order.status when bill is completed/cancelled.
        if (status == Bill.BillStatus.EXPORTED) {
            bill.setExportedAt(now);
        } else if (status == Bill.BillStatus.COMPLETED) {
            bill.setCompletedAt(now);
        } else if (status == Bill.BillStatus.CANCELLED) {
            bill.setCancelledAt(now);
        }

        // Keep order state in sync with bill lifecycle.
        // - Completed bill => order DONE
        // - Cancelled bill => order CANCELLED
        if (status == Bill.BillStatus.COMPLETED || status == Bill.BillStatus.CANCELLED) {
            Order order = orderRepository.findById(bill.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found for bill"));
            if (status == Bill.BillStatus.COMPLETED) {
                if (order.getStatus() != Order.OrderStatus.DONE) {
                    order.setStatus(Order.OrderStatus.DONE);
                }
            } else {
                if (order.getStatus() != Order.OrderStatus.CANCELLED) {
                    order.setStatus(Order.OrderStatus.CANCELLED);
                }
            }
            orderRepository.save(order);
        }

        bill = billRepository.save(bill);
        return mapToResponse(bill);
    }

    private BillResponse mapToResponse(Bill bill) {
        List<BillItem> items = billItemRepository.findByBillId(bill.getId());

        return BillResponse.builder()
                .id(bill.getId())
                .storeId(bill.getStoreId())
                .orderId(bill.getOrderId())
                .customerName(bill.getCustomerName())
                .customerPhone(bill.getCustomerPhone())
                .totalAmount(bill.getTotalAmount())
                .status(bill.getStatus())
                .paymentMethod(bill.getPaymentMethod())
                .paymentStatus(bill.getPaymentStatus())
                .exportedAt(bill.getExportedAt())
                .completedAt(bill.getCompletedAt())
                .cancelledAt(bill.getCancelledAt())
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .items(items.stream()
                        .map(item -> BillResponse.BillItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProductId())
                                .productName(item.getProductName())
                                .quantity(item.getQuantity())
                                .priceAtTime(item.getPriceAtTime())
                                .notes(item.getNotes())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public Bill getBillEntity(UUID billId) {
        return billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
    }
}

