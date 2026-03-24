package com.restaurantsaas.payment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.TreeMap;

@Service
public class VnPayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.url}")
    private String vnpUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.ipn-url:}")
    private String ipnUrl;

    public String createPaymentUrl(String transactionRef, Long amountVnd, String orderInfo, String clientIp) {
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amountVnd * 100)); // VNPay: đơn vị x100
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", transactionRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", (clientIp != null && !clientIp.isBlank()) ? clientIp : "127.0.0.1");
        vnpParams.put("vnp_CreateDate", new java.text.SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
        if (ipnUrl != null && !ipnUrl.isBlank()) {
            vnpParams.put("vnp_IpnUrl", ipnUrl);
        }

        // Build query string
        StringBuilder queryString = new StringBuilder();
        for (Map.Entry<String, String> param : vnpParams.entrySet()) {
            if (!param.getValue().isEmpty()) {
                queryString.append(URLEncoder.encode(param.getKey(), StandardCharsets.UTF_8));
                queryString.append("=");
                queryString.append(URLEncoder.encode(param.getValue(), StandardCharsets.UTF_8));
                queryString.append("&");
            }
        }

        // Generate secure hash
        String vnpSecureHash = hmacSHA512(hashSecret, queryString.toString());
        vnpParams.put("vnp_SecureHash", vnpSecureHash);

        // Build final URL
        queryString = new StringBuilder();
        for (Map.Entry<String, String> param : vnpParams.entrySet()) {
            queryString.append(URLEncoder.encode(param.getKey(), StandardCharsets.UTF_8));
            queryString.append("=");
            queryString.append(URLEncoder.encode(param.getValue(), StandardCharsets.UTF_8));
            queryString.append("&");
        }
        queryString.setLength(queryString.length() - 1); // Remove last &

        return vnpUrl + "?" + queryString.toString();
    }

    /**
     * Xác thực chữ ký VNPay — không sửa map gốc (IPN/callback có thể tái sử dụng).
     */
    public boolean verifyPaymentCallback(Map<String, String> params) {
        Map<String, String> fields = new TreeMap<>(params);
        String vnpSecureHash = fields.remove("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.isEmpty()) {
            return false;
        }
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String k = e.getKey();
            String v = e.getValue();
            if (k != null && v != null && !v.isEmpty()) {
                hashData.append(k).append("=").append(v).append("&");
            }
        }
        if (!hashData.isEmpty()) {
            hashData.setLength(hashData.length() - 1);
        }
        String computedHash = hmacSHA512(hashSecret, hashData.toString());
        return computedHash.equalsIgnoreCase(vnpSecureHash);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error generating HMAC", e);
        }
    }
}
