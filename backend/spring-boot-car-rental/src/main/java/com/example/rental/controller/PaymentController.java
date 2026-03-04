package com.example.rental.controller;

import com.example.rental.dto.PaymentRequest;
import com.example.rental.dto.PaymentResponse;
import com.example.rental.services.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    /**
     * Create a new payment
     */
    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody PaymentRequest request) {
        try {
            log.info("Creating payment for booking: {}", request.getBookingId());
            PaymentResponse payment = paymentService.createPayment(request);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error creating payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get payments by booking ID
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPaymentsByBookingId(@PathVariable Long bookingId) {
        try {
            List<PaymentResponse> payments = paymentService.getPaymentsByBookingId(bookingId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error fetching payments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get payment by order code
     */
    @GetMapping("/order/{orderCode}")
    public ResponseEntity<?> getPaymentByOrderCode(@PathVariable String orderCode) {
        try {
            PaymentResponse payment = paymentService.verifyPayment(orderCode);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error fetching payment", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Payment not found"));
        }
    }
    
    /**
     * PayOS Webhook callback
     * PayOS will call this endpoint after payment completion
     */
    @PostMapping("/payos-webhook")
    public ResponseEntity<?> handlePayOSWebhook(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Received PayOS webhook: {}", payload);
            
            String orderCode = payload.get("orderCode").toString();
            String status = payload.get("code").toString();
            String transactionId = payload.getOrDefault("id", "").toString();
            
            PaymentResponse payment = paymentService.handlePaymentCallback(orderCode, status, transactionId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment processed successfully",
                "payment", payment
            ));
            
        } catch (Exception e) {
            log.error("Error processing PayOS webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Payment return callback (when user is redirected back from PayOS)
     */
    @GetMapping("/callback")
    public ResponseEntity<?> handlePaymentCallback(
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cancel) {
        try {
            log.info("Payment callback - OrderCode: {}, Status: {}, Cancel: {}", 
                    orderCode, status, cancel);
            
            if ("true".equals(cancel)) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Payment was cancelled by user",
                    "orderCode", orderCode
                ));
            }
            
            PaymentResponse payment = paymentService.verifyPayment(orderCode);
            
            return ResponseEntity.ok(Map.of(
                "success", payment.getStatus().toString().equals("SUCCESS"),
                "message", "Payment status retrieved",
                "payment", payment
            ));
            
        } catch (Exception e) {
            log.error("Error processing payment callback", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Cancel a payment
     */
    @PostMapping("/{orderCode}/cancel")
    public ResponseEntity<?> cancelPayment(@PathVariable String orderCode) {
        try {
            PaymentResponse payment = paymentService.cancelPayment(orderCode);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment cancelled successfully",
                "payment", payment
            ));
        } catch (Exception e) {
            log.error("Error cancelling payment", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Verify payment status
     */
    @GetMapping("/{orderCode}/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable String orderCode) {
        try {
            PaymentResponse payment = paymentService.verifyPayment(orderCode);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "payment", payment
            ));
        } catch (Exception e) {
            log.error("Error verifying payment", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
