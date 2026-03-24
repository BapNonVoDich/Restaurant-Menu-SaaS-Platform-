package com.restaurantsaas.order.controller;

import com.restaurantsaas.order.dto.BillResponse;
import com.restaurantsaas.order.entity.Bill;
import com.restaurantsaas.order.service.BillService;
import com.restaurantsaas.order.service.OrderService;
import com.restaurantsaas.order.service.StoreAccessService;
import com.restaurantsaas.order.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;
    private final OrderService orderService;
    private final StoreAccessService storeAccessService;
    private final JwtExtractor jwtExtractor;

    @PostMapping
    public ResponseEntity<BillResponse> exportBill(
            @RequestParam UUID orderId,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UUID storeId = orderService.getOrderEntity(orderId).getStoreId();
            if (!storeAccessService.checkAccess(storeId, userId).owner()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            BillResponse bill = billService.exportBill(orderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(bill);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/stores/{storeId}")
    public ResponseEntity<List<BillResponse>> getBillsByStore(
            @PathVariable UUID storeId,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            if (!storeAccessService.checkAccess(storeId, userId).allowed()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<BillResponse> bills = billService.getBillsByStore(storeId);
            return ResponseEntity.ok(bills);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{billId}/status")
    public ResponseEntity<BillResponse> updateBillStatus(
            @PathVariable UUID billId,
            @RequestParam @NotNull Bill.BillStatus status,
            HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UUID storeId = billService.getBillEntity(billId).getStoreId();
            if (!storeAccessService.checkAccess(storeId, userId).owner()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            BillResponse bill = billService.updateBillStatus(billId, status);
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

