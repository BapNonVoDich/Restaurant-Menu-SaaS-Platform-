package com.restaurantsaas.catalog.dto;

import com.restaurantsaas.catalog.entity.Store;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private UUID id;
    private UUID ownerId;
    private String name;
    private String slug;
    private String description;
    private Store.SubscriptionStatus subStatus;
    private LocalDateTime subEndDate;
    private LocalDateTime trialStartDate;
    private LocalDateTime trialEndDate;
    private String menuHtml;
    private String menuData;
    private String menuFileUrl;
    private String menuTemplateKey;
    private Boolean tableOrderingEnabled;
    private String customDomain;
    private Boolean domainVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
