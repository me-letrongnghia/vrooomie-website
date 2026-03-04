package com.example.rental.services.impl;

import com.example.rental.config.PayOSConfig;
import com.example.rental.dto.PaymentRequest;
import com.example.rental.dto.PaymentResponse;
import com.example.rental.entity.Booking;
import com.example.rental.entity.Payment;
import com.example.rental.enums.PaymentStatus;
import com.example.rental.enums.BookingStatus;
import com.example.rental.mapper.PaymentMapper;
import com.example.rental.repository.BookingRepository;
import com.example.rental.repository.PaymentRepository;
import com.example.rental.services.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentMapper paymentMapper;
    private final PayOSConfig payOSConfig;
    
    private PayOS getPayOS() {
        // Use environment variables PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY
        // or pass credentials directly
        return new PayOS(payOSConfig.getClientId(), payOSConfig.getApiKey(), payOSConfig.getChecksumKey());
    }
    
    @Override
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) throws Exception {
        log.info("Creating payment for booking ID: {}", request.getBookingId());
        
        // Validate booking exists
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Generate unique order code
        String orderCode = generateOrderCode(booking.getId());
        
        // Create payment entity
        Payment payment = Payment.builder()
                .booking(booking)
                .paymentType(request.getPaymentType())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .amount(request.getAmount())
                .orderCode(orderCode)
                .description(request.getDescription())
                .expiredAt(LocalDateTime.now().plusMinutes(payOSConfig.getPaymentLinkExpirationMinutes()))
                .build();
        
        // Save payment first to get ID
        payment = paymentRepository.save(payment);
        
        // Create PayOS payment link
        try {
            PayOS payOS = getPayOS();
            
            // Truncate description to max 25 characters (PayOS v2 limit)
            String shortDescription = truncateDescription(request.getDescription(), orderCode);
            
            // Prepare payment data for v2 API
            CreatePaymentLinkRequest paymentLinkRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(Long.parseLong(orderCode))
                    .amount(request.getAmount().longValue())
                    .description(shortDescription)
                    .returnUrl(payOSConfig.getReturnUrl())
                    .cancelUrl(payOSConfig.getCancelUrl())
                    .build();
            
            // Create payment link
            CreatePaymentLinkResponse paymentLinkResponse = payOS.paymentRequests().create(paymentLinkRequest);
            
            // Update payment with PayOS response
            payment.setPaymentUrl(paymentLinkResponse.getCheckoutUrl());
            payment = paymentRepository.save(payment);
            
            log.info("Payment link created successfully: {}", paymentLinkResponse.getCheckoutUrl());
            
        } catch (Exception e) {
            log.error("Error creating PayOS payment link", e);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Failed to create payment link: " + e.getMessage());
        }
        
        return paymentMapper.toDto(payment);
    }
    
    @Override
    @Transactional
    public PaymentResponse handlePaymentCallback(String orderCode, String status, String transactionId) throws Exception {
        log.info("Handling payment callback - OrderCode: {}, Status: {}, TransactionId: {}", 
                orderCode, status, transactionId);
        
        Payment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        // Update payment status based on PayOS callback
        if ("PAID".equalsIgnoreCase(status) || "00".equals(status)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionId(transactionId);
            
            // Update booking status
            Booking booking = payment.getBooking();
            if (booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(booking);
            }
            
            log.info("Payment successful for booking ID: {}", booking.getId());
            
        } else if ("CANCELLED".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.CANCELLED);
            log.info("Payment cancelled for order code: {}", orderCode);
            
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            log.warn("Payment failed for order code: {}", orderCode);
        }
        
        payment = paymentRepository.save(payment);
        return paymentMapper.toDto(payment);
    }
    
    @Override
    public Payment getPaymentByOrderCode(String orderCode) {
        return paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }
    
    @Override
    public List<PaymentResponse> getPaymentsByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId).stream()
                .map(paymentMapper::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public PaymentResponse cancelPayment(String orderCode) throws Exception {
        Payment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Cannot cancel payment with status: " + payment.getStatus());
        }
        
        try {
            PayOS payOS = getPayOS();
            // Cancel payment link
            payOS.paymentRequests().cancel(Long.parseLong(orderCode), "User cancelled");
            
            payment.setStatus(PaymentStatus.CANCELLED);
            payment = paymentRepository.save(payment);
            
            log.info("Payment cancelled successfully: {}", orderCode);
            
        } catch (Exception e) {
            log.error("Error cancelling payment", e);
            throw new RuntimeException("Failed to cancel payment: " + e.getMessage());
        }
        
        return paymentMapper.toDto(payment);
    }
    
    @Override
    public PaymentResponse verifyPayment(String orderCode) throws Exception {
        try {
            PayOS payOS = getPayOS();
            // Get payment info - returns dynamic object
            var paymentInfo = payOS.paymentRequests().get(Long.parseLong(orderCode));
            
            Payment payment = getPaymentByOrderCode(orderCode);
            
            // Update status based on PayOS response (getStatus() returns enum)
            String payosStatus = paymentInfo.getStatus().name();
            if ("PAID".equalsIgnoreCase(payosStatus)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                
                // Update booking status
                Booking booking = payment.getBooking();
                if (booking.getStatus() == BookingStatus.PENDING) {
                    booking.setStatus(BookingStatus.CONFIRMED);
                    bookingRepository.save(booking);
                }
            } else if ("CANCELLED".equalsIgnoreCase(payosStatus)) {
                payment.setStatus(PaymentStatus.CANCELLED);
            } else if ("EXPIRED".equalsIgnoreCase(payosStatus)) {
                payment.setStatus(PaymentStatus.EXPIRED);
            }
            
            payment = paymentRepository.save(payment);
            return paymentMapper.toDto(payment);
            
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            throw new RuntimeException("Failed to verify payment: " + e.getMessage());
        }
    }
    
    /**
     * Generate unique order code
     * Format: timestamp + bookingId (max 19 digits for PayOS)
     */
    private String generateOrderCode(Long bookingId) {
        long timestamp = System.currentTimeMillis() / 1000; // Unix timestamp
        String code = String.format("%d%05d", timestamp, bookingId % 100000);
        // Ensure it fits in Long (max 19 digits)
        if (code.length() > 19) {
            code = code.substring(code.length() - 19);
        }
        return code;
    }
    
    /**
     * Truncate description to max 25 characters (PayOS v2 API limit)
     * Format: "Deposit #[orderCode]" or truncated original description
     */
    private String truncateDescription(String description, String orderCode) {
        if (description == null || description.isEmpty()) {
            return "Deposit #" + orderCode.substring(Math.max(0, orderCode.length() - 10));
        }
        
        // If description is already short enough, return as is
        if (description.length() <= 25) {
            return description;
        }
        
        // Try to create a short version: "Deposit #[last 10 digits]"
        String shortForm = "Deposit #" + orderCode.substring(Math.max(0, orderCode.length() - 10));
        if (shortForm.length() <= 25) {
            return shortForm;
        }
        
        // Fallback: truncate to 25 chars
        return description.substring(0, 25);
    }
}
