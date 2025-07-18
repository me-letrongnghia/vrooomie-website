package com.example.rental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CarRequest {
    @NotBlank
    private String brand;
    @NotBlank private String model;
    @NotBlank private String licensePlate;
    private String type;
    @NotNull
    private BigDecimal pricePerDay;
    private String imageUrl;
    private String address;
    private String description;
}
