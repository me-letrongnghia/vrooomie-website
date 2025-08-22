package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private Long carId;
    private String carBrand;
    private String carModel;
    private String carLicensePlate;

    private Long renterId;
    private String renterName;
    private String renterEmail;

    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal totalPrice;

    private String paymentMethod;
    private String deliveryMethod;
    private String paymentStatus;
}
