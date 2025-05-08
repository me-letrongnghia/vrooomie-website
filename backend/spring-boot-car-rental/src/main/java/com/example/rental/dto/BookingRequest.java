package com.example.rental.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull
    private Long carId;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
}

