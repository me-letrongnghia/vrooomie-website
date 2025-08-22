package com.example.rental.services;

import com.example.rental.dto.BookingResponse;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.User;

import java.util.List;

public interface IBookingService {
    BookingResponse createBooking(BookingRequest request, User renter);
    void confirmBooking(Long bookingId, User currentUser);
    void cancelBooking(Long bookingId, User currentUser);
    List<BookingResponse> getBookingsByRenter(User renter);
    List<BookingResponse> getBookingsForOwnedCars(User owner);
    List<BookingResponse> getBookingsForOwnedCarsByStatus(User owner, String status);
    List<BookingResponse> getBookingsForCar(Long carId);
}
