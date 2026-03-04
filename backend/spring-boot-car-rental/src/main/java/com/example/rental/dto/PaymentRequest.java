package com.example.rental.dto;

import com.example.rental.enums.PaymentMethod;
import com.example.rental.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    
    private Long bookingId;
    private PaymentType paymentType;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String description;
    private String returnUrl;
    private String cancelUrl;
}
