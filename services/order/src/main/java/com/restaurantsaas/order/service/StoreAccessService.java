package com.restaurantsaas.order.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreAccessService {

    private final RestTemplate restTemplate;

    @Value("${services.catalog-url:http://localhost:8082}")
    private String catalogServiceUrl;

    public AccessInfo checkAccess(UUID storeId, UUID userId) {
        try {
            String url = String.format("%s/stores/%s/staff/access?userId=%s", catalogServiceUrl, storeId, userId);
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map body = response.getBody();
            if (body == null) {
                return new AccessInfo(false, false, false);
            }
            boolean allowed = Boolean.TRUE.equals(body.get("allowed"));
            boolean isOwner = Boolean.TRUE.equals(body.get("isOwner"));
            boolean isWaiter = Boolean.TRUE.equals(body.get("isWaiter"));
            return new AccessInfo(allowed, isOwner, isWaiter);
        } catch (Exception e) {
            return new AccessInfo(false, false, false);
        }
    }

    public record AccessInfo(boolean allowed, boolean owner, boolean waiter) {
    }
}

