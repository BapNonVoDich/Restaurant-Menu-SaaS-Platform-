package com.restaurantsaas.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Đồng bộ trạng thái xuất bản cửa hàng (ACTIVE) sang catalog sau thanh toán VNPay.
 */
@Component
@Slf4j
public class CatalogSubscriptionClient {

    private final RestTemplate restTemplate;

    @Value("${catalog.base-url:http://localhost:8082}")
    private String catalogBaseUrl;

    @Value("${internal.subscription-key:}")
    private String internalSubscriptionKey;

    public CatalogSubscriptionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void activateStoreSubscription(UUID storeId, LocalDateTime subEndDate) {
        if (internalSubscriptionKey == null || internalSubscriptionKey.isBlank()) {
            log.warn("internal.subscription-key is not set; skipping catalog subscription sync for store {}", storeId);
            return;
        }
        String base = catalogBaseUrl.endsWith("/") ? catalogBaseUrl.substring(0, catalogBaseUrl.length() - 1) : catalogBaseUrl;
        UriComponentsBuilder uri = UriComponentsBuilder
                .fromHttpUrl(base + "/stores/internal/subscription-active/" + storeId);
        if (subEndDate != null) {
            uri.queryParam("subEndDate", subEndDate.toString());
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Key", internalSubscriptionKey);
        try {
            restTemplate.exchange(uri.toUriString(), HttpMethod.PUT, new HttpEntity<>(headers), Void.class);
            log.info("Catalog store {} marked ACTIVE (subscription sync)", storeId);
        } catch (Exception e) {
            log.error("Failed to sync subscription to catalog for store {}: {}", storeId, e.getMessage());
        }
    }
}
