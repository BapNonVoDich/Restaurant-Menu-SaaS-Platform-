package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.StoreStaffRequest;
import com.restaurantsaas.catalog.dto.StoreStaffResponse;
import com.restaurantsaas.catalog.service.StoreStaffService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/stores/{storeId}/staff")
@RequiredArgsConstructor
public class StoreStaffController {

    private final StoreStaffService storeStaffService;
    private final JwtExtractor jwtExtractor;

    @PostMapping
    public ResponseEntity<?> assignWaiter(
            @PathVariable UUID storeId,
            @Valid @RequestBody StoreStaffRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            StoreStaffResponse response = storeStaffService.assignWaiter(storeId, userId, request.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listStoreStaff(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            List<StoreStaffResponse> response = storeStaffService.listStoreStaff(storeId, userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{staffUserId}")
    public ResponseEntity<?> removeWaiter(
            @PathVariable UUID storeId,
            @PathVariable UUID staffUserId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            storeStaffService.removeWaiter(storeId, userId, staffUserId);
            return ResponseEntity.ok(Map.of("message", "Staff removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Internal/use-by-other-services endpoint
    @GetMapping("/access")
    public ResponseEntity<?> getAccessInfo(
            @PathVariable UUID storeId,
            @RequestParam UUID userId) {
        try {
            return ResponseEntity.ok(storeStaffService.getAccessInfo(storeId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

}

