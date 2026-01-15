package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.CategoryRequest;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.service.CategoryService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/stores/{storeId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final JwtExtractor jwtExtractor;

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @PathVariable UUID storeId,
            @Valid @RequestBody CategoryRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Category category = categoryService.createCategory(storeId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Category>> getCategories(@PathVariable UUID storeId) {
        try {
            List<Category> categories = categoryService.getCategoriesByStore(storeId);
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
