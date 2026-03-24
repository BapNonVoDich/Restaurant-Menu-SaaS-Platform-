package com.restaurantsaas.order.controller;

import com.restaurantsaas.order.dto.OrderStatsResponse;
import com.restaurantsaas.order.service.OrderStatsService;
import com.restaurantsaas.order.service.StoreAccessService;
import com.restaurantsaas.order.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderStatsController {

    private final OrderStatsService orderStatsService;
    private final JwtExtractor jwtExtractor;
    private final StoreAccessService storeAccessService;

    @GetMapping("/stores/{storeId}/stats")
    public ResponseEntity<OrderStatsResponse> getStats(@PathVariable UUID storeId, HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            if (!storeAccessService.checkAccess(storeId, userId).allowed()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(orderStatsService.getStatsByStore(storeId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

