package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.MenuResponse;
import com.restaurantsaas.catalog.service.MenuService;
import com.restaurantsaas.catalog.service.StoreService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final StoreService storeService;
    private final JwtExtractor jwtExtractor;

    /**
     * Public menu endpoint - only works if store is ACTIVE (published).
     * Used for QR code/public access.
     */
    @GetMapping("/{storeId}/menu")
    public ResponseEntity<MenuResponse> getMenu(@PathVariable UUID storeId) {
        try {
            MenuResponse menu = menuService.getMenuByStoreId(storeId);
            return ResponseEntity.ok(menu);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Owner menu endpoint - allows store owner to view/edit their menu
     * regardless of subscription status. Used in dashboard.
     */
    @GetMapping("/my-store/menu")
    public ResponseEntity<?> getMyStoreMenu(HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Get store for this owner
            var storeResponse = storeService.getOrCreateStore(userId);
            UUID storeId = storeResponse.getId();

            // Get menu for owner (doesn't check subscription status)
            MenuResponse menu = menuService.getMenuForOwner(storeId, userId);
            return ResponseEntity.ok(menu);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
