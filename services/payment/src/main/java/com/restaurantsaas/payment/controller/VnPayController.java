package com.restaurantsaas.payment.controller;

import com.restaurantsaas.payment.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/vnpay")
@RequiredArgsConstructor
public class VnPayController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> paymentCallback(@RequestParam Map<String, String> params) {
        try {
            subscriptionService.processPaymentCallback(new HashMap<>(params));
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Payment processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
}
