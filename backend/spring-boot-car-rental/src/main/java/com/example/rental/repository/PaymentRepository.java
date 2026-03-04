package com.example.rental.repository;

import com.example.rental.entity.Payment;
import com.example.rental.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    List<Payment> findByBookingId(Long bookingId);
    
    Optional<Payment> findByOrderCode(String orderCode);
    
    Optional<Payment> findByTransactionId(String transactionId);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    List<Payment> findByBookingIdAndStatus(Long bookingId, PaymentStatus status);
}
