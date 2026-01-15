package com.restaurantsaas.payment.controller;

import com.restaurantsaas.payment.dto.PaymentUrlResponse;
import com.restaurantsaas.payment.dto.SubscriptionRequest;
import com.restaurantsaas.payment.service.SubscriptionService;
import com.restaurantsaas.payment.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final JwtExtractor jwtExtractor;

    @PostMapping("/pay")
    public ResponseEntity<PaymentUrlResponse> createSubscriptionPayment(
            @RequestParam UUID storeId,
            @Valid @RequestBody SubscriptionRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            PaymentUrlResponse response = subscriptionService.createSubscriptionPayment(storeId, userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
