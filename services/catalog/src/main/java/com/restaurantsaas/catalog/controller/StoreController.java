package com.restaurantsaas.catalog.controller;

import com.restaurantsaas.catalog.dto.CategorySummaryResponse;
import com.restaurantsaas.catalog.dto.CustomDomainRequest;
import com.restaurantsaas.catalog.dto.CustomDomainSetupResponse;
import com.restaurantsaas.catalog.dto.StoreHostResolveResponse;
import com.restaurantsaas.catalog.dto.StoreRequest;
import com.restaurantsaas.catalog.dto.StoreResponse;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.exception.BaseException;
import com.restaurantsaas.catalog.service.CategoryService;
import com.restaurantsaas.catalog.service.StoreService;
import com.restaurantsaas.catalog.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import com.restaurantsaas.catalog.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/stores")
public class StoreController {

    private final StoreService storeService;
    private final CategoryService categoryService;
    private final JwtExtractor jwtExtractor;
    private final CloudinaryService cloudinaryService;
    private final String internalSubscriptionKey;

    public StoreController(
            StoreService storeService,
            CategoryService categoryService,
            JwtExtractor jwtExtractor,
            CloudinaryService cloudinaryService,
            @org.springframework.beans.factory.annotation.Value("${internal.subscription-key:}") String internalSubscriptionKey) {
        this.storeService = storeService;
        this.categoryService = categoryService;
        this.jwtExtractor = jwtExtractor;
        this.cloudinaryService = cloudinaryService;
        this.internalSubscriptionKey = internalSubscriptionKey;
    }

    /**
     * Public: map verified custom Host header to menu slug (used by Next.js middleware).
     */
    @GetMapping("/resolve-host")
    public ResponseEntity<?> resolveHost(@RequestParam String host) {
        try {
            Optional<String> slug = storeService.resolveSlugForVerifiedHost(host);
            if (slug.isPresent()) {
                return ResponseEntity.ok(new StoreHostResolveResponse(slug.get()));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No verified store for this host"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-store/categories")
    public ResponseEntity<?> getMyStoreCategories(HttpServletRequest request) {
        try {
            UUID userId = jwtExtractor.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Unauthorized: Missing or invalid token"));
            }
            List<CategorySummaryResponse> summaries = categoryService.listSummariesForMyStore(userId);
            return ResponseEntity.ok(summaries);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus())
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

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
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus())
                    .body(Map.of(
                            "error", e.getMessage(),
                            "message", e.getMessage(),
                            "errorCode", e.getErrorCode()));
        } catch (RuntimeException e) {
            return resolveGetMyStoreRuntime(request, e);
        }
    }

    /**
     * Legacy fallback: only auto-create on generic "not found" - never for staff-only accounts.
     */
    private ResponseEntity<?> resolveGetMyStoreRuntime(HttpServletRequest request, RuntimeException e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("not found") || msg.contains("Store not found")) {
            try {
                UUID uid = jwtExtractor.extractUserId(request);
                if (uid != null) {
                    StoreResponse store = storeService.autoCreateStore(uid);
                    return ResponseEntity.ok(store);
                }
            } catch (Exception createEx) {
                // Fall through
            }
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", msg.isEmpty() ? "Unexpected error" : msg));
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

    @PutMapping("/{storeId}/custom-domain")
    public ResponseEntity<?> updateCustomDomain(
            @PathVariable UUID storeId,
            @RequestBody CustomDomainRequest body,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        try {
            CustomDomainSetupResponse res = storeService.updateCustomDomain(userId, storeId,
                    body != null ? body.getDomain() : null);
            return ResponseEntity.ok(res);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{storeId}/custom-domain/verify")
    public ResponseEntity<?> verifyCustomDomain(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        try {
            CustomDomainSetupResponse res = storeService.verifyCustomDomain(userId, storeId);
            return ResponseEntity.ok(res);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{storeId}")
    public ResponseEntity<?> updateStore(
            @PathVariable UUID storeId,
            @Valid @RequestBody StoreRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = jwtExtractor.extractUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            StoreResponse store = storeService.updateStore(userId, storeId, request);
            return ResponseEntity.ok(store);
        } catch (BaseException e) {
            return ResponseEntity.status(e.getHttpStatus()).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update store: " + e.getMessage()));
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

    @PutMapping("/{storeId}/menu-data")
    public ResponseEntity<?> updateMenuData(
            @PathVariable UUID storeId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Convert request body to JSON string
            Object menuDataObj = request.get("menuData");
            String menuData;
            if (menuDataObj instanceof String) {
                menuData = (String) menuDataObj;
            } else {
                // If it's a Map, convert to JSON string
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                menuData = mapper.writeValueAsString(menuDataObj);
            }

            storeService.updateMenuData(storeId, userId, menuData);
            return ResponseEntity.ok(Map.of("message", "Menu data updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update menu data: " + e.getMessage()));
        }
    }

    @GetMapping("/{storeId}/menu-data")
    public ResponseEntity<?> getMenuData(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String menuData = storeService.getMenuData(storeId, userId);
            if (menuData == null || menuData.isEmpty()) {
                return ResponseEntity.ok(Map.of("menuData", "{}"));
            }

            // Parse JSON string to return as JSON object
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Object menuDataObj = mapper.readValue(menuData, Object.class);
            return ResponseEntity.ok(Map.of("menuData", menuDataObj));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get menu data: " + e.getMessage()));
        }
    }

    @PutMapping("/{storeId}/menu-template-key")
    public ResponseEntity<?> updateMenuTemplateKey(
            @PathVariable UUID storeId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String menuTemplateKey = request.get("menuTemplateKey");
            storeService.updateMenuTemplateKey(storeId, userId, menuTemplateKey);
            return ResponseEntity.ok(Map.of("message", "Menu template key updated"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update menu template key: " + e.getMessage()));
        }
    }

    @PostMapping("/{storeId}/menu-file")
    public ResponseEntity<?> uploadMenuFile(
            @PathVariable UUID storeId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Validate ownership
            storeService.validateStoreOwnership(storeId, userId);

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || 
                (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid file type. Only images and PDF files are allowed."));
            }

            // Validate file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "File size exceeds 10MB limit."));
            }

            // Upload to Cloudinary
            String fileUrl;
            try {
                if (cloudinaryService.isConfigured()) {
                    // Upload to Cloudinary
                    fileUrl = cloudinaryService.uploadFile(file, "menu-files");
                } else {
                    // Fallback to local storage if Cloudinary is not configured
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "File upload service is not configured. Please configure Cloudinary."));
                }
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
            } catch (IllegalStateException e) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
            }

            // Update store with file URL
            storeService.updateMenuFileUrl(storeId, userId, fileUrl);

            return ResponseEntity.ok(Map.of(
                "message", "File uploaded successfully",
                "fileUrl", fileUrl
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{storeId}/menu-file")
    public ResponseEntity<?> deleteMenuFile(
            @PathVariable UUID storeId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Validate ownership
            storeService.validateStoreOwnership(storeId, userId);

            // Get store to find file URL
            Store store = storeService.getStoreEntity(storeId);
            String fileUrl = store.getMenuFileUrl();

            // Delete file from Cloudinary if exists
            if (fileUrl != null && !fileUrl.isEmpty()) {
                if (cloudinaryService.isConfigured()) {
                    cloudinaryService.deleteFile(fileUrl);
                } else {
                    // If Cloudinary is not configured, just log a warning
                    // The file might be stored locally or elsewhere
                    System.err.println("Cloudinary is not configured, cannot delete file from Cloudinary");
                }
            }

            // Clear file URL in database
            storeService.updateMenuFileUrl(storeId, userId, null);

            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{storeId}/upload-image")
    public ResponseEntity<?> uploadImage(
            @PathVariable UUID storeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "product-images") String folder,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = jwtExtractor.extractUserId(httpRequest);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Validate ownership
            storeService.validateStoreOwnership(storeId, userId);

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
                    imageUrl = cloudinaryService.uploadFile(file, folder);
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

            return ResponseEntity.ok(Map.of(
                "message", "Image uploaded successfully",
                "imageUrl", imageUrl,
                "url", imageUrl
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Gọi nội bộ từ payment-service sau VNPay IPN — bắt buộc header X-Internal-Key khớp cấu hình.
     */
    @PutMapping("/internal/subscription-active/{storeId}")
    public ResponseEntity<?> internalSubscriptionActive(
            @PathVariable UUID storeId,
            @RequestHeader(value = "X-Internal-Key", required = false) String key,
            @RequestParam(required = false) String subEndDate) {
        if (internalSubscriptionKey == null || internalSubscriptionKey.isBlank()
                || key == null || !internalSubscriptionKey.equals(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid internal key"));
        }
        try {
            java.time.LocalDateTime end = (subEndDate != null && !subEndDate.isBlank())
                    ? java.time.LocalDateTime.parse(subEndDate)
                    : null;
            storeService.updateSubscriptionStatus(storeId, Store.SubscriptionStatus.ACTIVE, end);
            return ResponseEntity.ok(Map.of("message", "Store subscription activated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
