package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.CustomDomainSetupResponse;
import com.restaurantsaas.catalog.dto.StoreRequest;
import com.restaurantsaas.catalog.dto.StoreResponse;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.exception.AccessDeniedException;
import com.restaurantsaas.catalog.exception.SlugAlreadyExistsException;
import com.restaurantsaas.catalog.exception.StoreAlreadyExistsException;
import com.restaurantsaas.catalog.exception.StoreNotFoundException;
import com.restaurantsaas.catalog.repository.StoreRepository;
import com.restaurantsaas.catalog.repository.StoreStaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class StoreService {

    public static final String DOMAIN_TXT_PREFIX = "restaurant-saas-verify=";

    private static final Pattern DOMAIN_PATTERN = Pattern.compile(
            "^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$",
            Pattern.CASE_INSENSITIVE);

    private final StoreRepository storeRepository;
    private final StoreStaffRepository storeStaffRepository;
    private final DnsTxtLookupService dnsTxtLookupService;

    public StoreService(
            StoreRepository storeRepository,
            StoreStaffRepository storeStaffRepository,
            DnsTxtLookupService dnsTxtLookupService) {
        this.storeRepository = storeRepository;
        this.storeStaffRepository = storeStaffRepository;
        this.dnsTxtLookupService = dnsTxtLookupService;
    }

    /**
     * Auto-create a default store for a new user during registration.
     * Store starts with INACTIVE status (unpublished) - user can edit menu but it's not public.
     */
    @Transactional
    public StoreResponse autoCreateStore(UUID ownerId) {
        // Check if owner already has a store
        if (storeRepository.findByOwnerId(ownerId).isPresent()) {
            throw new StoreAlreadyExistsException("Store already exists for this owner");
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
                .menuTemplateKey("A")
                .subEndDate(null)  // No subscription end date until payment
                .trialStartDate(trialStart)  // Start trial period
                .trialEndDate(trialEnd)  // 7 days trial
                .tableOrderingEnabled(false)
                .domainVerified(false)
                .build();

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse createStore(UUID ownerId, StoreRequest request) {
        if (storeRepository.existsBySlug(request.getSlug())) {
            throw new SlugAlreadyExistsException("Slug already exists: " + request.getSlug());
        }

        // Check if owner already has a store
        if (storeRepository.findByOwnerId(ownerId).isPresent()) {
            throw new StoreAlreadyExistsException("Store already exists for this owner");
        }

        Store store = Store.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .subStatus(Store.SubscriptionStatus.INACTIVE)  // Start as inactive (unpublished)
                .menuTemplateKey("A")
                .subEndDate(null)  // No end date until subscription is paid
                .tableOrderingEnabled(false)
                .domainVerified(false)
                .build();

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse updateStore(UUID ownerId, UUID storeId, StoreRequest request) {
        Store store = getStoreEntity(storeId);
        
        // Validate ownership
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }

        // Check slug uniqueness if changed
        if (!store.getSlug().equals(request.getSlug()) && storeRepository.existsBySlug(request.getSlug())) {
            throw new SlugAlreadyExistsException("Slug already exists: " + request.getSlug());
        }

        store.setName(request.getName());
        store.setSlug(request.getSlug());
        store.setDescription(request.getDescription());
        if (request.getTableOrderingEnabled() != null) {
            store.setTableOrderingEnabled(request.getTableOrderingEnabled());
        }
        store.setUpdatedAt(LocalDateTime.now());

        store = storeRepository.save(store);
        return mapToResponse(store);
    }

    public StoreResponse getStoreByOwnerId(UUID ownerId) {
        Store store = storeRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new StoreNotFoundException("Store not found for owner: " + ownerId));
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
                .orElseGet(() -> {
                    if (!storeStaffRepository.findByUserId(ownerId).isEmpty()) {
                        throw new StoreNotFoundException(
                                "No owner store for this account. Staff must use GET /catalog/staff/my-store");
                    }
                    return autoCreateStore(ownerId);
                });
    }

    public StoreResponse getStoreBySlug(String slug) {
        Store store = storeRepository.findBySlug(slug)
                .orElseThrow(() -> new StoreNotFoundException("Store not found with slug: " + slug));
        return mapToResponse(store);
    }

    public Store getStoreEntity(UUID storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException("Store not found with ID: " + storeId));
    }

    public void validateStoreOwnership(UUID storeId, UUID ownerId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
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
                .menuData(store.getMenuData())
                .menuFileUrl(store.getMenuFileUrl())
                .menuTemplateKey(store.getMenuTemplateKey())
                .tableOrderingEnabled(Boolean.TRUE.equals(store.getTableOrderingEnabled()))
                .customDomain(store.getCustomDomain())
                .domainVerified(Boolean.TRUE.equals(store.getDomainVerified()))
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
    
    @Transactional
    public void updateMenuHtml(UUID storeId, UUID ownerId, String menuHtml) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }
        store.setMenuHtml(menuHtml);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }
    
    @Transactional
    public void updateMenuData(UUID storeId, UUID ownerId, String menuData) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }
        store.setMenuData(menuData);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }
    
    public String getMenuData(UUID storeId, UUID ownerId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }
        return store.getMenuData();
    }
    
    @Transactional
    public void updateMenuFileUrl(UUID storeId, UUID ownerId, String fileUrl) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }
        store.setMenuFileUrl(fileUrl);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }
    
    @Transactional
    public String regenerateMenuHtml(UUID storeId, UUID ownerId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
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

    @Transactional
    public void updateMenuTemplateKey(UUID storeId, UUID ownerId, String menuTemplateKey) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }

        if (menuTemplateKey == null || menuTemplateKey.isBlank()) {
            throw new IllegalArgumentException("Invalid menuTemplateKey");
        }

        String normalized = menuTemplateKey.trim().toUpperCase();
        if (!("A".equals(normalized) || "B".equals(normalized) || "C".equals(normalized))) {
            throw new IllegalArgumentException("menuTemplateKey must be one of: A, B, C");
        }

        store.setMenuTemplateKey(normalized);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);
    }

    /**
     * Owner sets or clears custom domain. Returns TXT instructions when a domain is set.
     */
    @Transactional
    public CustomDomainSetupResponse updateCustomDomain(UUID ownerId, UUID storeId, String domainRaw) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }

        if (domainRaw == null || domainRaw.isBlank()) {
            store.setCustomDomain(null);
            store.setDomainVerified(false);
            store.setDomainVerificationToken(null);
            store.setUpdatedAt(LocalDateTime.now());
            storeRepository.save(store);
            return CustomDomainSetupResponse.builder()
                    .customDomain(null)
                    .domainVerified(false)
                    .verificationToken(null)
                    .dnsTxtRecordValue(null)
                    .instructions("Đã xoá tên miền tùy chỉnh.")
                    .build();
        }

        String normalized = normalizeHost(domainRaw);
        if (!DOMAIN_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid domain hostname");
        }

        Optional<Store> other = storeRepository.findByCustomDomainIgnoreCase(normalized);
        if (other.isPresent() && !other.get().getId().equals(storeId)) {
            throw new IllegalArgumentException("Domain already registered to another store");
        }

        if (normalized.equalsIgnoreCase(store.getCustomDomain()) && Boolean.TRUE.equals(store.getDomainVerified())) {
            String token = store.getDomainVerificationToken();
            String full = token != null ? DOMAIN_TXT_PREFIX + token : null;
            return CustomDomainSetupResponse.builder()
                    .customDomain(store.getCustomDomain())
                    .domainVerified(true)
                    .verificationToken(token)
                    .dnsTxtRecordValue(full)
                    .instructions("Tên miền đã được xác minh.")
                    .build();
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        store.setCustomDomain(normalized);
        store.setDomainVerified(false);
        store.setDomainVerificationToken(token);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.save(store);

        String full = DOMAIN_TXT_PREFIX + token;
        return CustomDomainSetupResponse.builder()
                .customDomain(normalized)
                .domainVerified(false)
                .verificationToken(token)
                .dnsTxtRecordValue(full)
                .instructions("Thêm bản ghi TXT cho máy chủ tên \"" + normalized + "\" với giá trị: " + full)
                .build();
    }

    /**
     * Check DNS TXT and mark domain verified when token matches.
     */
    @Transactional
    public CustomDomainSetupResponse verifyCustomDomain(UUID ownerId, UUID storeId) {
        Store store = getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Not the store owner");
        }
        if (store.getCustomDomain() == null || store.getCustomDomain().isBlank()) {
            return CustomDomainSetupResponse.builder()
                    .instructions("Chưa cấu hình tên miền.")
                    .build();
        }
        String token = store.getDomainVerificationToken();
        if (token == null || token.isBlank()) {
            token = UUID.randomUUID().toString().replace("-", "");
            store.setDomainVerificationToken(token);
            store.setDomainVerified(false);
            store.setUpdatedAt(LocalDateTime.now());
            storeRepository.save(store);
        }
        String needle = DOMAIN_TXT_PREFIX + token;
        boolean ok = dnsTxtLookupService.txtRecordsContain(store.getCustomDomain(), needle);
        if (ok) {
            store.setDomainVerified(true);
            store.setUpdatedAt(LocalDateTime.now());
            storeRepository.save(store);
        }
        String full = DOMAIN_TXT_PREFIX + token;
        return CustomDomainSetupResponse.builder()
                .customDomain(store.getCustomDomain())
                .domainVerified(Boolean.TRUE.equals(store.getDomainVerified()))
                .verificationToken(token)
                .dnsTxtRecordValue(full)
                .instructions(ok
                        ? "Xác minh thành công. Trỏ hostname về IP/load balancer của nền tảng và bật TLS."
                        : "Không tìm thấy TXT hợp lệ. Giá trị cần có: " + full)
                .build();
    }

    public Optional<String> resolveSlugForVerifiedHost(String hostHeader) {
        if (hostHeader == null || hostHeader.isBlank()) {
            return Optional.empty();
        }
        String host = normalizeHost(hostHeader);
        return storeRepository.findByCustomDomainIgnoreCaseAndDomainVerifiedTrue(host)
                .map(Store::getSlug);
    }

    private static String normalizeHost(String raw) {
        String s = raw.trim().toLowerCase();
        int slash = s.indexOf('/');
        if (slash >= 0) {
            s = s.substring(0, slash);
        }
        if (s.startsWith("http://")) {
            s = s.substring("http://".length());
        } else if (s.startsWith("https://")) {
            s = s.substring("https://".length());
        }
        int colon = s.indexOf(':');
        if (colon > 0) {
            s = s.substring(0, colon);
        }
        while (s.endsWith(".")) {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }
}
