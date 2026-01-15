package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.MenuTemplateRequest;
import com.restaurantsaas.catalog.dto.MenuTemplateResponse;
import com.restaurantsaas.catalog.service.MenuTemplateService;
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
@RequestMapping("/stores/{storeId}/menu-templates")
@RequiredArgsConstructor
public class MenuTemplateController {

    private final MenuTemplateService templateService;
    private final JwtExtractor jwtExtractor;

    @GetMapping
    public ResponseEntity<?> getTemplates(
        @PathVariable UUID storeId,
        HttpServletRequest request
    ) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
            }

            List<MenuTemplateResponse> templates = templateService.getTemplatesByStoreId(storeId);
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<?> getTemplate(
        @PathVariable UUID storeId,
        @PathVariable UUID templateId,
        HttpServletRequest request
    ) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
            }

            MenuTemplateResponse template = templateService.getTemplateById(templateId, storeId);
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTemplate(
        @PathVariable UUID storeId,
        @Valid @RequestBody MenuTemplateRequest request,
        HttpServletRequest httpRequest
    ) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
            }

            MenuTemplateResponse template = templateService.createTemplate(storeId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(template);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<?> deleteTemplate(
        @PathVariable UUID storeId,
        @PathVariable UUID templateId,
        HttpServletRequest request
    ) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
            }

            templateService.deleteTemplate(templateId, storeId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
