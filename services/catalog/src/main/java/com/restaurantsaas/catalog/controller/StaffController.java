package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.service.StoreStaffService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StoreStaffService storeStaffService;
    private final JwtExtractor jwtExtractor;

    @GetMapping("/my-store")
    public ResponseEntity<?> getMyStore(HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            return ResponseEntity.ok(storeStaffService.getMyStaffStore(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
