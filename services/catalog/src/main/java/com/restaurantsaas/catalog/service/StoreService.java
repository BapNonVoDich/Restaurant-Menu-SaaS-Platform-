package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.StoreRequest;
import com.restaurantsaas.catalog.dto.StoreResponse;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    /**
     * Auto-create a default store for a new user during registration.
     * Store starts with INACTIVE status (unpublished) - user can edit menu but it's not public.
     */
    @Transactional
    public StoreResponse autoCreateStore(UUID ownerId) {
        // Check if owner already has a store
        if (storeRepository.findByOwnerId(ownerId).isPresent()) {
            throw new RuntimeException("Store already exists for this owner");
        }

        // Generate a unique slug based on owner ID
        String defaultSlug = "store-" + ownerId.toString().substring(0, 8);
        int counter = 1;
        while (storeRepository.existsBySlug(defaultSlug)) {
            defaultSlug = "store-" + ownerId.toString().substring(0, 8) + "-" + counter;
            counter++;
        }

        // Set trial period: 7 days from now
        LocalDateTime trialStart = LocalDateTime.now();
        LocalDateTime trialEnd = trialStart.plusDays(7);
        
        Store store = Store.builder()
                .ownerId(ownerId)
                .name("My Restaurant")  // Default name, user can update later
                .slug(defaultSlug)
                .description("")  // Empty description
                .subStatus(Store.SubscriptionStatus.INACTIVE)  // Unpublished by default
                .subEndDate(null)  // No subscription end date until payment
                .trialStartDate(trialStart)  // Start trial period
                .trialEndDate(trialEnd)  // 7 days trial
                .build();

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse createStore(UUID ownerId, StoreRequest request) {
        if (storeRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug already exists");
        }

        // Check if owner already has a store
        if (storeRepository.findByOwnerId(ownerId).isPresent()) {
            throw new RuntimeException("Store already exists for this owner");
        }

        Store store = Store.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .subStatus(Store.SubscriptionStatus.INACTIVE)  // Start as inactive (unpublished)
                .subEndDate(null)  // No end date until subscription is paid
                .build();

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse updateStore(UUID ownerId, UUID storeId, StoreRequest request) {
        Store store = getStoreEntity(storeId);
        
        // Validate ownership
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }

        // Check slug uniqueness if changed
        if (!store.getSlug().equals(request.getSlug()) && storeRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Slug already exists");
        }

        store.setName(request.getName());
        store.setSlug(request.getSlug());
        store.setDescription(request.getDescription());
        store.setUpdatedAt(LocalDateTime.now());

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    public StoreResponse getStoreByOwnerId(UUID ownerId) {
        Store store = storeRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
        return mapToResponse(store);
    }

    /**
     * Get existing store or auto-create one if it doesn't exist.
     * Used when user first accesses their dashboard.
     */
    @Transactional
    public StoreResponse getOrCreateStore(UUID ownerId) {
        return storeRepository.findByOwnerId(ownerId)
                .map(this::mapToResponse)
                .orElseGet(() -> autoCreateStore(ownerId));
    }

    public StoreResponse getStoreBySlug(String slug) {
        Store store = storeRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Store not found"));
        return mapToResponse(store);
    }

    public Store getStoreEntity(UUID storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
    }

    public void validateStoreOwnership(UUID storeId, UUID ownerId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
    }

    @Transactional
    public void updateSubscriptionStatus(UUID storeId, Store.SubscriptionStatus status, LocalDateTime endDate) {
        Store store = getStoreEntity(storeId);
        store.setSubStatus(status);
        store.setSubEndDate(endDate);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }

    private StoreResponse mapToResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .ownerId(store.getOwnerId())
                .name(store.getName())
                .slug(store.getSlug())
                .description(store.getDescription())
                .subStatus(store.getSubStatus())
                .subEndDate(store.getSubEndDate())
                .trialStartDate(store.getTrialStartDate())
                .trialEndDate(store.getTrialEndDate())
                .menuHtml(store.getMenuHtml())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
    
    @Transactional
    public void updateMenuHtml(UUID storeId, UUID ownerId, String menuHtml) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
        store.setMenuHtml(menuHtml);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }
    
    @Transactional
    public String regenerateMenuHtml(UUID storeId, UUID ownerId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
        
        // Generate HTML from menu data
        // This will be called from the frontend, which will generate the HTML
        // For now, return empty string - frontend will handle generation
        return "";
    }
    
    /**
     * Check if store has active trial period (within 7 days of creation and not expired)
     */
    public boolean isTrialActive(Store store) {
        if (store.getTrialStartDate() == null || store.getTrialEndDate() == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(store.getTrialStartDate()) && !now.isAfter(store.getTrialEndDate());
    }
    
    /**
     * Check if store can access subscription functions (either TRIAL status or ACTIVE subscription)
     */
    public boolean canAccessSubscriptionFunctions(Store store) {
        // Check if trial is active OR subscription is ACTIVE
        return isTrialActive(store) || store.getSubStatus() == Store.SubscriptionStatus.ACTIVE;
    }
}
