package com.example.rental.mapper;

import com.example.rental.dto.PaymentResponse;
import com.example.rental.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {
    
    public PaymentResponse toDto(Payment payment) {
        if (payment == null) {
            return null;
        }
        
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking() != null ? payment.getBooking().getId() : null)
                .paymentType(payment.getPaymentType())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .amount(payment.getAmount())
                .orderCode(payment.getOrderCode())
                .transactionId(payment.getTransactionId())
                .description(payment.getDescription())
                .paymentUrl(payment.getPaymentUrl())
                .paidAt(payment.getPaidAt())
                .expiredAt(payment.getExpiredAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
