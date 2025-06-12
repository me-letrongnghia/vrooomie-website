package com.example.rental.mapper;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.Booking;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;

import java.math.BigDecimal;

public class BookingMapper {

    public static BookingDto toDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .carId(booking.getCar().getId())
                .carBrand(booking.getCar().getBrand())
                .carModel(booking.getCar().getModel())
                .carLicensePlate(booking.getCar().getLicensePlate())

                .renterId(booking.getRenter().getId())
                .renterName(booking.getRenter().getFullName())
                .renterEmail(booking.getRenter().getEmail())

                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .status(booking.getStatus().name())
                .totalPrice(booking.getTotalPrice())
                .build();
    }

    public static Booking toEntity(BookingRequest req, Car car, User renter, BigDecimal totalPrice) {
        return Booking.builder()
                .car(car)
                .renter(renter)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(Booking.BookingStatus.PENDING)
                .totalPrice(totalPrice)
                .build();
    }
}

