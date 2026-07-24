package com.auction.auction_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class SmsService {

    @Value("${textbee.api-key}")
    private String apiKey;

    @Value("${textbee.device-id}")
    private String deviceId;

    private static final String API_URL = "https://api.textbee.dev/api/v1/gateway/devices/%s/send-sms";

    public void sendOtp(String phone, String otp) {
        try {
            // TextBee yêu cầu số quốc tế: 0901234567 → +84901234567
            String normalizedPhone = normalizePhone(phone);

            String payload = "{"
                    + "\"recipients\":[\""  + normalizedPhone + "\"],"
                    + "\"message\":\"[AuctionApp] Ma OTP cua ban la: " + otp
                    + ". Het han sau 5 phut. Khong chia se ma nay.\""
                    + "}";

            String urlStr = String.format(API_URL, deviceId);
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("x-api-key", apiKey); 
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201) {
                System.out.println("TextBee OTP sent to " + normalizedPhone);
            } else {
                System.err.println("TextBee error: HTTP " + responseCode);
            }

        } catch (Exception e) {
            System.err.println("TextBee send failed: " + e.getMessage());
        }
    }

    /**
     * Chuẩn hóa số điện thoại VN sang định dạng quốc tế
     * 0901234567 → +84901234567
     */
    private String normalizePhone(String phone) {
        if (phone == null) return "";
        phone = phone.replaceAll("\\s+", "");
        if (phone.startsWith("0")) return "+84" + phone.substring(1);
        if (phone.startsWith("84")) return "+" + phone;
        return phone;
    }
}