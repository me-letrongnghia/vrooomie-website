package com.example.rental.controller;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.User;
import com.example.rental.services.IBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final IBookingService iBookingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request,
                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(iBookingService.createBooking(request, user));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        iBookingService.confirmBooking(id, currentUser);
        return ResponseEntity.ok("Booking confirmed.");
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        iBookingService.cancelBooking(id, currentUser);
        return ResponseEntity.ok("Booking canceled.");
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(iBookingService.getBookingsByRenter(user));
    }

    @GetMapping("/owner/bookings")
    public ResponseEntity<?> getBookingsForOwnedCars(@AuthenticationPrincipal User owner) {
        List<BookingDto> bookings = iBookingService.getBookingsForOwnedCars(owner);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/owner")
    public ResponseEntity<?> getBookingsForOwner(@AuthenticationPrincipal User owner,
                                                 @RequestParam(required = false) String status) {
        List<BookingDto> bookings = iBookingService.getBookingsForOwnedCarsByStatus(owner, status);
        return ResponseEntity.ok(bookings);
    }
}
