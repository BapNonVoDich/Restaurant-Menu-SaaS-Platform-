package com.restaurantsaas.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SubscriptionRequest {
    @NotBlank(message = "Plan type is required")
    private String planType;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;
}
