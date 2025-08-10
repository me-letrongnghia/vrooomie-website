package com.example.rental.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "car_id")
    private Car car;

    @ManyToOne(optional = false)
    @JoinColumn(name = "renter_id")
    private User renter;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        CANCELED,
        COMPLETED
    }

    private BigDecimal totalPrice;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    public enum PaymentMethod {
        CASH,
        CREDIT_CARD,
        PAYPAL,
        ZALO_PAY,
        MOMO,
        VNPAY
    }

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED
    }

    @Enumerated(EnumType.STRING)
    private DeliveryMethod deliveryMethod;

    public enum DeliveryMethod {
        DELIVERY,
        PICKUP
    }
}
