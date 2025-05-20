package com.example.rental.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cars")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    private String brand;
    private String model;

    @Column(unique = true)
    private String licensePlate;

    private String type; // SUV, Sedan, v.v.

    private BigDecimal pricePerDay;

    @Enumerated(EnumType.STRING)
    private CarStatus status = CarStatus.AVAILABLE;

    private String imageUrl;

    @Column(length = 2000)
    private String description;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum CarStatus {
        AVAILABLE,
        BOOKED,
        UNAVAILABLE,
        INACTIVE
    }
}

