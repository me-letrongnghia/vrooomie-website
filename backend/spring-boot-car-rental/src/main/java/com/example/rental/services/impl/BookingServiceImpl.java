package com.example.rental.services.impl;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.Booking;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;
import com.example.rental.mapper.BookingMapper;
import com.example.rental.repository.BookingRepository;
import com.example.rental.repository.CarRepository;
import com.example.rental.repository.UserRepository;
import com.example.rental.services.IBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements IBookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;

    @Override
    public BookingDto createBooking(BookingRequest request, User renter) {
        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("Car not found"));

        BigDecimal totalPrice = car.getPricePerDay()
                .multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate())));

        Booking booking = Booking.builder()
                .car(car)
                .renter(renter)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(totalPrice)
                .status(Booking.BookingStatus.PENDING)
                .build();

        bookingRepository.save(booking);
        return BookingMapper.toDto(booking);
    }
}
