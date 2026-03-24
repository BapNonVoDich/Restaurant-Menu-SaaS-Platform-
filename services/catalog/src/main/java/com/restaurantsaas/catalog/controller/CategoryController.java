package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.CategoryRequest;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.exception.BaseException;
import com.restaurantsaas.catalog.service.CategoryService;
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
@RequestMapping("/stores/{storeId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final JwtExtractor jwtExtractor;

    @PostMapping
    public ResponseEntity<?> createCategory(
            @PathVariable UUID storeId,
            @Valid @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Category category = categoryService.createCategory(storeId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create category: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getCategories(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(categoryService.listSummariesForStore(storeId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<?> updateCategory(
            @PathVariable UUID storeId,
            @PathVariable UUID categoryId,
            @Valid @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Category category = categoryService.updateCategory(categoryId, userId, request);
            return ResponseEntity.ok(category);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update category: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable UUID storeId,
            @PathVariable UUID categoryId,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            categoryService.deleteCategory(categoryId, userId);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete category: " + e.getMessage()));
        }
    }
}
