package com.auction.auction_system.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;

    // ✅ nullable = true (mặc định của @Pattern) nhưng cần thêm cho phép null
    // Dùng regexp cho phép chuỗi rỗng HOẶC đúng định dạng SĐT Việt Nam
    @Pattern(
        regexp = "^$|^(0[35789][0-9]{8})$",
        message = "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 số (VD: 0901234567)"
    )
    private String phone;

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String address;
}