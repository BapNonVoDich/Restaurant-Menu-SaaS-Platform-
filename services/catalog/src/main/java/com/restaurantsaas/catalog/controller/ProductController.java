package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.ProductRequest;
import com.restaurantsaas.catalog.dto.UpdateProductCategoriesRequest;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.service.ProductService;
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
@RequestMapping("/stores/{storeId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final JwtExtractor jwtExtractor;

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @PathVariable UUID storeId,
            @Valid @RequestBody ProductRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Product product = productService.createProduct(storeId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(@PathVariable UUID storeId) {
        try {
            List<Product> products = productService.getProductsByStore(storeId);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{productId}/categories")
    public ResponseEntity<Product> updateProductCategories(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductCategoriesRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Product product = productService.updateProductCategories(productId, userId, request.getCategoryIds());
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
