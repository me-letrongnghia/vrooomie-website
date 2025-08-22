package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse implements Serializable {
    private static final long serialVersionUID = 1L;
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
    private String email;
    private String role;
    private int points;
    private LocalDateTime createdAt;
}
