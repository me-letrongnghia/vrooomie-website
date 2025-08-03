package com.example.rental.services.impl;

import com.example.rental.dto.BookingDto;
import com.example.rental.dto.BookingRequest;
import com.example.rental.entity.Booking;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;
import com.example.rental.mapper.BookingMapper;
import com.example.rental.repository.BookingRepository;
import com.example.rental.repository.CarRepository;
import com.example.rental.services.IBookingService;
import com.example.rental.services.IEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements IBookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final IEmailService iEmailService;

    @Override
    public BookingDto createBooking(BookingRequest request, User renter) {
        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("Car not found"));

        // Kiểm tra trùng thời gian
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
                request.getCarId(), request.getStartDate(), request.getEndDate());

        if (!overlapping.isEmpty()) {
            throw new RuntimeException("This car is already booked in the selected time range.");
        }

        Booking booking = Booking.builder()
                .car(car)
                .renter(renter)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(calculateTotal(car.getPricePerDay(), request.getStartDate(), request.getEndDate()))
                .status(Booking.BookingStatus.PENDING)
                .build();

        bookingRepository.save(booking);

        // Optionally: Gửi email thông báo cho chủ xe
        iEmailService.sendBookingStatusNotification(
                car.getOwner(),
                booking,
                "Có booking mới cho xe bạn!",
                "Một người dùng vừa đặt xe của bạn. Vui lòng xem xét và duyệt/hủy booking."
        );

        return BookingMapper.toDto(booking);
    }

    private BigDecimal calculateTotal(BigDecimal pricePerDay, LocalDate start, LocalDate end) {
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return pricePerDay.multiply(BigDecimal.valueOf(days));
    }

    @Override
    public void confirmBooking(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus().equals(Booking.BookingStatus.CANCELED)) {
            throw new RuntimeException("This booking has been canceled and cannot be confirmed");
        }

        if (!booking.getCar().getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not the owner of this car");
        }

        if (!booking.getStatus().equals(Booking.BookingStatus.PENDING)) {
            throw new RuntimeException("Only pending bookings can be confirmed");
        }

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Optionally: Gửi email thông báo cho người thuê
        iEmailService.sendBookingStatusNotification(
                booking.getRenter(),
                booking,
                "Booking của bạn đã được duyệt!",
                "Chủ xe đã chấp nhận booking. Hãy chuẩn bị cho chuyến đi nhé!"
        );
    }

    @Override
    public void cancelBooking(Long bookingId, User currentUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus().equals(Booking.BookingStatus.CONFIRMED)) {
            throw new RuntimeException("This booking has been confirmed and cannot be canceled");
        }

        if (!booking.getCar().getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You are not the owner of this car");
        }

        if (booking.getStatus().equals(Booking.BookingStatus.CANCELED)) {
            throw new RuntimeException("Booking is already canceled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELED);
        bookingRepository.save(booking);

        // Optionally: Gửi email thông báo cho người thuê
        iEmailService.sendBookingStatusNotification(
                booking.getRenter(),
                booking,
                "Booking của bạn đã bị hủy",
                "Rất tiếc, chủ xe đã hủy booking của bạn. Vui lòng thử đặt xe khác."
        );
    }

    @Override
    public List<BookingDto> getBookingsByRenter(User renter) {
        List<Booking> bookings = bookingRepository.findByRenter(renter);
        return bookings.stream()
                .map(BookingMapper::toDto)
                .toList();
    }

    @Override
    public List<BookingDto> getBookingsForOwnedCars(User owner) {
        List<Booking> bookings = bookingRepository.findByCarOwner(owner);
        return bookings.stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getBookingsForOwnedCarsByStatus(User owner, String status) {

        List<Booking> bookings;

        if (status == null || status.isBlank()) {
            bookings = bookingRepository.findByCarOwner(owner);
        } else {
            Booking.BookingStatus bookingStatus;
            try {
                bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid booking status: " + status);
            }
            bookings = bookingRepository.findByCarOwnerAndStatus(owner, bookingStatus);
        }

        return bookings.stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingDto> getBookingsForCar(Long carId) {
        List<Booking> bookings = bookingRepository.findByCarId(carId);
        return bookings.stream()
                .map(BookingMapper::toDto)
                .collect(Collectors.toList());
    }
}
