package com.restaurantsaas.payment.controller;

import com.restaurantsaas.payment.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/vnpay")
@RequiredArgsConstructor
public class VnPayController {

    private final SubscriptionService subscriptionService;

    /**
     * VNPay redirect (browser) — có thể trùng với IPN; xử lý idempotent trong service.
     * Khuyến nghị đặt vnp_ReturnUrl trỏ thẳng frontend; endpoint này dùng khi return URL trỏ về API.
     */
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

    /**
     * VNPay IPN (server) — application/x-www-form-urlencoded.
     */
    @PostMapping(value = "/ipn", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> ipn(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((k, v) -> {
            if (v != null && v.length > 0) {
                params.put(k, v[0]);
            }
        });
        try {
            subscriptionService.processPaymentCallback(params);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}");
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage().replace("\"", "'") : "error";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"RspCode\":\"99\",\"Message\":\"" + msg + "\"}");
        }
    }
}
