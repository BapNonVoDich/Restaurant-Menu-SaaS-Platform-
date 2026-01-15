package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.StoreRequest;
import com.restaurantsaas.catalog.dto.StoreResponse;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.service.StoreService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final JwtExtractor jwtExtractor;

    @GetMapping("/my-store")
    public ResponseEntity<?> getMyStore(HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Missing or invalid token"));
            }

            StoreResponse store = storeService.getOrCreateStore(userId);
            return ResponseEntity.ok(store);
        } catch (RuntimeException e) {
            // If it's a "not found" type error, try to auto-create
            if (e.getMessage().contains("not found") || e.getMessage().contains("Store not found")) {
                try {
                    UUID userId = jwtExtractor.extractUserId(request);
                    if (userId != null) {
                        StoreResponse store = storeService.autoCreateStore(userId);
                        return ResponseEntity.ok(store);
                    }
                } catch (Exception createEx) {
                    // Fall through to return error
                }
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Unexpected errors - log and return 500 with error message
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(
            @Valid @RequestBody StoreRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            StoreResponse store = storeService.createStore(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(store);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<StoreResponse> getStoreBySlug(@PathVariable String slug) {
        try {
            StoreResponse store = storeService.getStoreBySlug(slug);
            return ResponseEntity.ok(store);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{storeId}/subscription-status")
    public ResponseEntity<?> updateSubscriptionStatus(
            @PathVariable UUID storeId,
            @RequestParam String status,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Validate ownership
            storeService.validateStoreOwnership(storeId, userId);

            // Parse status
            Store.SubscriptionStatus subscriptionStatus;
            try {
                subscriptionStatus = Store.SubscriptionStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid status: " + status));
            }

            // Update status (endDate can be set separately if needed)
            storeService.updateSubscriptionStatus(storeId, subscriptionStatus, null);
            return ResponseEntity.ok(Map.of("message", "Subscription status updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{storeId}/menu-html")
    public ResponseEntity<?> updateMenuHtml(
            @PathVariable UUID storeId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String menuHtml = request.get("menuHtml");
            storeService.updateMenuHtml(storeId, userId, menuHtml);
            return ResponseEntity.ok(Map.of("message", "Menu HTML updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{storeId}/regenerate-menu-html")
    public ResponseEntity<?> regenerateMenuHtml(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            storeService.updateMenuHtml(storeId, userId, null); // Clear HTML to trigger regeneration
            return ResponseEntity.ok(Map.of("message", "Menu HTML reset. Frontend should regenerate from data."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
