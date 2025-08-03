package com.example.rental.services;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.User;

import java.util.List;

public interface IBookingService {
    BookingDto createBooking(BookingRequest request, User renter);
    void confirmBooking(Long bookingId, User currentUser);
    void cancelBooking(Long bookingId, User currentUser);
    List<BookingDto> getBookingsByRenter(User renter);
    List<BookingDto> getBookingsForOwnedCars(User owner);
    List<BookingDto> getBookingsForOwnedCarsByStatus(User owner, String status);
    List<BookingDto> getBookingsForCar(Long carId);
}
