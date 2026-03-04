package com.example.rental.services;

import com.example.rental.dto.PaymentRequest;
import com.example.rental.dto.PaymentResponse;
import com.example.rental.entity.Payment;

import java.util.List;

public interface PaymentService {
    
    /**
     * Create a payment and generate PayOS payment link
     */
    PaymentResponse createPayment(PaymentRequest request) throws Exception;
    
    /**
     * Handle payment callback from PayOS
     */
    PaymentResponse handlePaymentCallback(String orderCode, String status, String transactionId) throws Exception;
    
    /**
     * Get payment by order code
     */
    Payment getPaymentByOrderCode(String orderCode);
    
    /**
     * Get all payments for a booking
     */
    List<PaymentResponse> getPaymentsByBookingId(Long bookingId);
    
    /**
     * Cancel a pending payment
     */
    PaymentResponse cancelPayment(String orderCode) throws Exception;
    
    /**
     * Verify payment status with PayOS
     */
    PaymentResponse verifyPayment(String orderCode) throws Exception;
}
