package com.restaurantsaas.catalog.dto;

import com.restaurantsaas.catalog.entity.StoreStaff;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StoreStaffResponse {
    private UUID id;
    private UUID storeId;
    private UUID userId;
    private StoreStaff.StaffRole role;
    private LocalDateTime createdAt;
}

