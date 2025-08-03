package com.example.rental.repository;

import com.example.rental.entity.Booking;
import com.example.rental.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRenterId(Long renterId);
    List<Booking> findByCarId(Long carId);

    @Query("""
    SELECT b FROM Booking b
    WHERE b.car.id = :carId
    AND b.status IN ('PENDING', 'CONFIRMED')
    AND (
            (:startDate BETWEEN b.startDate AND b.endDate)
            OR (:endDate BETWEEN b.startDate AND b.endDate)
            OR (b.startDate BETWEEN :startDate AND :endDate)
            OR (:startDate = b.endDate)
            OR (:endDate = b.startDate)
        )
    """)
    List<Booking> findOverlappingBookings(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<Booking> findByRenter(User renter);
    List<Booking> findByCarOwner(User owner);
    List<Booking> findByCarOwnerAndStatus(User owner, Booking.BookingStatus status);
}

