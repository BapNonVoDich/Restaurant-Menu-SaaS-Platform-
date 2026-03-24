package com.restaurantsaas.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomDomainSetupResponse {
    private String customDomain;
    private boolean domainVerified;
    /** Shown once after save so the owner can create the correct TXT record. */
    private String verificationToken;
    /** Full TXT value to publish (e.g. restaurant-saas-verify=&lt;token&gt;). */
    private String dnsTxtRecordValue;
    private String instructions;
}
