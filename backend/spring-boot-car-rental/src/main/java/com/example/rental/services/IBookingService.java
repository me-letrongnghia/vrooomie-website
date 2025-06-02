package com.example.rental.services;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.User;

public interface IBookingService {
    BookingDto createBooking(BookingRequest request, User renter);
    void confirmBooking(Long bookingId, User currentUser);
    void cancelBooking(Long bookingId, User currentUser);
}
