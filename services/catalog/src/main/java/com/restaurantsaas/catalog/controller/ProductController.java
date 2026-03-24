package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.ProductRequest;
import com.restaurantsaas.catalog.dto.UpdateProductCategoriesRequest;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.exception.BaseException;
import com.restaurantsaas.catalog.service.CloudinaryService;
import com.restaurantsaas.catalog.service.ProductService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/stores/{storeId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final JwtExtractor jwtExtractor;
    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<?> createProduct(
            @PathVariable UUID storeId,
            @Valid @RequestBody ProductRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Product product = productService.createProduct(storeId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create product: " + e.getMessage()));
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

    @PutMapping("/{productId}")
    public ResponseEntity<?> updateProduct(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            @Valid @RequestBody ProductRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Product product = productService.updateProduct(productId, userId, request);
            return ResponseEntity.ok(product);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update product: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            productService.deleteProduct(productId, userId);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete product: " + e.getMessage()));
        }
    }

    @PostMapping("/{productId}/image")
    public ResponseEntity<?> uploadProductImage(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // Validate ownership
            productService.validateProductOwnership(productId, userId);

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid file type. Only images are allowed."));
            }

            // Validate file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "File size exceeds 10MB limit."));
            }

            // Upload to Cloudinary
            String imageUrl;
            try {
                if (cloudinaryService.isConfigured()) {
                    imageUrl = cloudinaryService.uploadFile(file, "product-images");
                } else {
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(Map.of("error", "Image upload service is not configured. Please configure Cloudinary."));
                }
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", e.getMessage()));
            }

            // Update product with image URL
            Product product = productService.getProduct(productId);
            ProductRequest updateRequest = new ProductRequest();
            updateRequest.setName(product.getName());
            updateRequest.setDescription(product.getDescription());
            updateRequest.setPrice(product.getPrice());
            updateRequest.setImageUrl(imageUrl);
            updateRequest.setIsAvailable(product.getIsAvailable());
            updateRequest.setSortOrder(product.getSortOrder());
            productService.updateProduct(productId, userId, updateRequest);

            return ResponseEntity.ok(Map.of(
                    "message", "Image uploaded successfully",
                    "imageUrl", imageUrl
            ));
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload product image: " + e.getMessage()));
        }
    }

    @PutMapping("/{productId}/categories")
    public ResponseEntity<?> updateProductCategories(
            @PathVariable UUID storeId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductCategoriesRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Product product = productService.updateProductCategories(productId, userId, request.getCategoryIds());
            return ResponseEntity.ok(product);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update product categories: " + e.getMessage()));
        }
    }
}
