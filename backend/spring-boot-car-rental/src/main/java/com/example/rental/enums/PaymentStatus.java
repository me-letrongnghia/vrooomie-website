package com.example.rental.enums;

public enum PaymentStatus {
    PENDING,    // Đang chờ thanh toán
    SUCCESS,    // Thanh toán thành công
    FAILED,     // Thanh toán thất bại
    CANCELLED,  // Đã hủy
    EXPIRED     // Hết hạn
}
