package com.restaurantsaas.payment.service;

import com.restaurantsaas.payment.client.CatalogSubscriptionClient;
import com.restaurantsaas.payment.dto.PaymentUrlResponse;
import com.restaurantsaas.payment.dto.SubscriptionRequest;
import com.restaurantsaas.payment.entity.Subscription;
import com.restaurantsaas.payment.entity.PaymentTransaction;
import com.restaurantsaas.payment.repository.PaymentTransactionRepository;
import com.restaurantsaas.payment.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VnPayService vnPayService;
    private final CatalogSubscriptionClient catalogSubscriptionClient;

    @Transactional
    public PaymentUrlResponse createSubscriptionPayment(UUID storeId, UUID userId, SubscriptionRequest request, String clientIp) {
        // Find or create subscription
        Subscription subscription = subscriptionRepository.findByStoreId(storeId)
                .orElseGet(() -> {
                    Subscription newSubscription = Subscription.builder()
                            .storeId(storeId)
                            .planType(request.getPlanType())
                            .amount(request.getAmount())
                            .status(Subscription.SubscriptionStatus.TRIAL)
                            .startDate(LocalDateTime.now())
                            .build();
                    return subscriptionRepository.save(newSubscription);
                });

        // Create payment transaction
        String transactionRef = "SUB_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .transactionRef(transactionRef)
                .subscriptionId(subscription.getId())
                .storeId(storeId)
                .amount(request.getAmount())
                .currency("VND")
                .paymentMethod(PaymentTransaction.PaymentMethod.VNPAY)
                .status(PaymentTransaction.TransactionStatus.PENDING)
                .build();
        transaction = paymentTransactionRepository.save(transaction);

        // Create VNPay payment URL
        String orderInfo = "Subscription payment for store: " + storeId;
        Long amount = request.getAmount().longValue();
        String paymentUrl = vnPayService.createPaymentUrl(transactionRef, amount, orderInfo, clientIp);

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .transactionRef(transactionRef)
                .build();
    }

    @Transactional
    public void processPaymentCallback(Map<String, String> params) {
        Map<String, String> verifyCopy = new HashMap<>(params);
        if (!vnPayService.verifyPaymentCallback(verifyCopy)) {
            throw new RuntimeException("Invalid payment callback");
        }

        String transactionRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String vnpayTransactionId = params.get("vnp_TransactionNo");

        PaymentTransaction transaction = paymentTransactionRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if ("00".equals(responseCode)) {
            if (transaction.getStatus() == PaymentTransaction.TransactionStatus.SUCCESS) {
                log.debug("VNPay callback idempotent for ref {}", transactionRef);
                return;
            }
            transaction.setStatus(PaymentTransaction.TransactionStatus.SUCCESS);
            transaction.setVnpayTransactionId(vnpayTransactionId);
            transaction.setVnpayResponseCode(responseCode);

            LocalDateTime subEnd = LocalDateTime.now().plusMonths(1);
            if (transaction.getSubscriptionId() != null) {
                Subscription subscription = subscriptionRepository.findById(transaction.getSubscriptionId())
                        .orElseThrow(() -> new RuntimeException("Subscription not found"));
                subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                subscription.setPaymentTransactionId(vnpayTransactionId);
                subscription.setStartDate(LocalDateTime.now());
                subscription.setEndDate(subEnd);
                subscriptionRepository.save(subscription);
            }
            paymentTransactionRepository.save(transaction);
            catalogSubscriptionClient.activateStoreSubscription(transaction.getStoreId(), subEnd);
        } else {
            transaction.setStatus(PaymentTransaction.TransactionStatus.FAILED);
            transaction.setVnpayResponseCode(responseCode);
            transaction.setFailureReason("Payment failed: " + responseCode);
            paymentTransactionRepository.save(transaction);
        }
    }
}
