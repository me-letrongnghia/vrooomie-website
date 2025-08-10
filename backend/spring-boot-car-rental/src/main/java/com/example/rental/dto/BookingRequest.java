package com.example.rental.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

import com.example.rental.entity.Booking;

@Data
public class BookingRequest {
    @NotNull
    private Long carId;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    @NotNull private Booking.DeliveryMethod deliveryMethod;
    @NotNull private Booking.PaymentMethod paymentMethod;
}

