package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.StoreStaffResponse;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.entity.StoreStaff;
import com.restaurantsaas.catalog.repository.StoreStaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreStaffService {

    private final StoreService storeService;
    private final StoreStaffRepository storeStaffRepository;
    private final RestTemplate restTemplate;

    @Value("${services.identity-url:http://localhost:8081}")
    private String identityServiceUrl;

    @Transactional
    public StoreStaffResponse assignWaiter(UUID storeId, UUID ownerId, UUID staffUserId) {
        Store store = storeService.getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
        if (store.getOwnerId().equals(staffUserId)) {
            throw new RuntimeException("Owner cannot be assigned as waiter");
        }
        if (!isIdentityUserExists(staffUserId)) {
            throw new RuntimeException("User does not exist in identity service");
        }

        StoreStaff staff = storeStaffRepository.findByStoreIdAndUserId(storeId, staffUserId)
                .orElse(StoreStaff.builder()
                        .storeId(storeId)
                        .userId(staffUserId)
                        .role(StoreStaff.StaffRole.WAITER)
                        .build());

        staff.setRole(StoreStaff.StaffRole.WAITER);
        return mapToResponse(storeStaffRepository.save(staff));
    }

    public List<StoreStaffResponse> listStoreStaff(UUID storeId, UUID ownerId) {
        Store store = storeService.getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
        return storeStaffRepository.findByStoreId(storeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeWaiter(UUID storeId, UUID ownerId, UUID staffUserId) {
        Store store = storeService.getStoreEntity(storeId);
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }
        storeStaffRepository.deleteByStoreIdAndUserId(storeId, staffUserId);
    }

    public Map<String, Object> getAccessInfo(UUID storeId, UUID userId) {
        Store store = storeService.getStoreEntity(storeId);
        boolean isOwner = store.getOwnerId().equals(userId);
        boolean isWaiter = storeStaffRepository.findByStoreIdAndUserId(storeId, userId)
                .map(staff -> staff.getRole() == StoreStaff.StaffRole.WAITER)
                .orElse(false);

        String role = isOwner ? "OWNER" : (isWaiter ? "WAITER" : "NONE");
        return Map.of(
                "allowed", isOwner || isWaiter,
                "isOwner", isOwner,
                "isWaiter", isWaiter,
                "role", role
        );
    }

    public Map<String, Object> getMyStaffStore(UUID userId) {
        List<StoreStaff> staffRecords = storeStaffRepository.findByUserId(userId);
        if (staffRecords.isEmpty()) {
            throw new RuntimeException("No store assignment found for this staff user");
        }
        Store store = storeService.getStoreEntity(staffRecords.get(0).getStoreId());
        return Map.of(
                "id", store.getId(),
                "name", store.getName(),
                "slug", store.getSlug()
        );
    }

    private boolean isIdentityUserExists(UUID userId) {
        try {
            String url = identityServiceUrl + "/users/" + userId + "/exists";
            ExistsResponse response = restTemplate.getForObject(url, ExistsResponse.class);
            return response != null && Boolean.TRUE.equals(response.exists());
        } catch (Exception ex) {
            return false;
        }
    }

    private record ExistsResponse(Boolean exists) {}

    private StoreStaffResponse mapToResponse(StoreStaff storeStaff) {
        return StoreStaffResponse.builder()
                .id(storeStaff.getId())
                .storeId(storeStaff.getStoreId())
                .userId(storeStaff.getUserId())
                .role(storeStaff.getRole())
                .createdAt(storeStaff.getCreatedAt())
                .build();
    }
}

