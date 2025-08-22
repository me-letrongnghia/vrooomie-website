package com.example.rental.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    private String avatarUrl;

    private String phoneNumber;

    private String address;

    private String birthDate;

    private String gender;

    private String driverLicense;

    private String driverLicenseExpiryDate;

    private String driverLicenseImage;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role; // RENTER, OWNER, ADMIN

    private boolean enabled = false;

    private String verificationCode;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;

    @Column(name = "otp_generated_at")
    private LocalDateTime otpGeneratedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private int points;

    // OAuth2 fields
    private String provider; // GOOGLE, FACEBOOK, LOCAL
    
    private String providerId; // OAuth2 provider user ID

    public enum Role {
        RENTER,
        OWNER,
        ADMIN
    }

    public enum Provider {
        LOCAL, GOOGLE, FACEBOOK
    }
}

