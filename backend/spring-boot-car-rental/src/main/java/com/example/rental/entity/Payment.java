package com.example.rental.entity;

import com.example.rental.enums.PaymentMethod;
import com.example.rental.enums.PaymentStatus;
import com.example.rental.enums.PaymentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType; // DEPOSIT, FULL_PAYMENT, REFUND
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod; // PAYOS, CASH, BANK_TRANSFER
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; // PENDING, SUCCESS, FAILED, CANCELLED
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    
    @Column(length = 100)
    private String transactionId; // PayOS transaction ID
    
    @Column(length = 100)
    private String orderCode; // PayOS order code
    
    @Column(length = 500)
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String paymentUrl; // URL to redirect user to payment gateway
    
    @Column(columnDefinition = "TEXT")
    private String responseData; // Store callback response from PayOS
    
    @Column
    private LocalDateTime paidAt;
    
    @Column
    private LocalDateTime expiredAt; // Payment link expiration
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }
}
