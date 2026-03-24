package com.restaurantsaas.order.controller;

import com.restaurantsaas.order.dto.OrderRequest;
import com.restaurantsaas.order.dto.OrderResponse;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.service.OrderService;
import com.restaurantsaas.order.service.StoreAccessService;
import com.restaurantsaas.order.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final JwtExtractor jwtExtractor;
    private final StoreAccessService storeAccessService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestParam UUID storeId,
            @Valid @RequestBody OrderRequest request) {
        try {
            OrderResponse order = orderService.createOrder(storeId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable UUID orderId,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UUID storeId = orderService.getOrderEntity(orderId).getStoreId();
            if (!storeAccessService.checkAccess(storeId, userId).allowed()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            OrderResponse order = orderService.getOrder(orderId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/stores/{storeId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByStore(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String table,
            HttpServletRequest request) {
        try {
            if (!hasStoreAccess(storeId, request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<OrderResponse> orders = orderService.getOrdersByStore(storeId, table);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/stores/{storeId}/status/{status}")
    public ResponseEntity<List<OrderResponse>> getOrdersByStatus(
            @PathVariable UUID storeId,
            @PathVariable Order.OrderStatus status,
            @RequestParam(required = false) String table,
            HttpServletRequest request) {
        try {
            if (!hasStoreAccess(storeId, request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<OrderResponse> orders = orderService.getOrdersByStoreAndStatus(storeId, status, table);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam Order.OrderStatus status,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UUID storeId = orderService.getOrderEntity(orderId).getStoreId();
            StoreAccessService.AccessInfo accessInfo = storeAccessService.checkAccess(storeId, userId);
            if (!accessInfo.allowed()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            OrderResponse order = orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    private boolean hasStoreAccess(UUID storeId, HttpServletRequest request) {
        HttpServletRequest effectiveRequest = request;
        if (effectiveRequest == null) {
            return false;
        }
        UUID userId = jwtExtractor.extractUserId(effectiveRequest);
        if (userId == null) {
            return false;
        }
        return storeAccessService.checkAccess(storeId, userId).allowed();
    }
}
