package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarDto {
    private Long id;
    private Long ownerId;
    private String brand;
    private String model;
    private String licensePlate;
    private String type;
    private BigDecimal pricePerDay;
    private String status;
    private String imageUrl;
    private String description;
}
