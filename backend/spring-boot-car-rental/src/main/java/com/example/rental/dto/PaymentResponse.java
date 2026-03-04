package com.example.rental.dto;

import com.example.rental.enums.PaymentMethod;
import com.example.rental.enums.PaymentStatus;
import com.example.rental.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private Long id;
    private Long bookingId;
    private PaymentType paymentType;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private BigDecimal amount;
    private String orderCode;
    private String transactionId;
    private String description;
    private String paymentUrl;
    private LocalDateTime paidAt;
    private LocalDateTime expiredAt;
    private LocalDateTime createdAt;
}
