package com.auction.auction_system.service;

import com.auction.auction_system.util.VNPayUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    public String createPaymentUrl(String txnRef, long amountVnd, String orderInfo, String ipAddress) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddress);

        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        params.put("vnp_CreateDate", formatter.format(cal.getTime()));
        cal.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", formatter.format(cal.getTime()));

        Map<String, String> sorted = VNPayUtil.sortMap(params);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try {
            for (Map.Entry<String, String> entry : sorted.entrySet()) {
                String fieldName = entry.getKey();
                String fieldValue = entry.getValue();
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                         .append('=')
                         .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    hashData.append('&');
                    query.append('&');
                }
            }
            hashData.setLength(hashData.length() - 1);
            query.setLength(query.length() - 1);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo URL thanh toán VNPay", e);
        }

        String secureHash = VNPayUtil.hmacSHA512(hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return payUrl + "?" + query;
    }

    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        Map<String, String> filtered = new HashMap<>(params);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        Map<String, String> sorted = VNPayUtil.sortMap(filtered);

        StringBuilder hashData = new StringBuilder();
        try {
            for (Map.Entry<String, String> entry : sorted.entrySet()) {
                String fieldValue = entry.getValue();
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(entry.getKey()).append('=')
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    hashData.append('&');
                }
            }
            hashData.setLength(hashData.length() - 1);
        } catch (Exception e) {
            return false;
        }

        String calculatedHash = VNPayUtil.hmacSHA512(hashSecret, hashData.toString());
        return calculatedHash.equalsIgnoreCase(receivedHash);
    }
}