package com.restaurantsaas.catalog.dto;

import lombok.Data;

/**
 * Body for PUT /stores/{id}/custom-domain. Empty or blank domain clears the custom domain.
 */
@Data
public class CustomDomainRequest {
    private String domain;
}
