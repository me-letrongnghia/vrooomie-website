package com.example.rental.services.impl;

import com.example.rental.config.PayOSConfig;
import com.example.rental.dto.PaymentRequest;
import com.example.rental.dto.PaymentResponse;
import com.example.rental.entity.Booking;
import com.example.rental.entity.Payment;
import com.example.rental.entity.User;
import com.example.rental.enums.PaymentStatus;
import com.example.rental.enums.BookingStatus;
import com.example.rental.mapper.PaymentMapper;
import com.example.rental.repository.BookingRepository;
import com.example.rental.repository.PaymentRepository;
import com.example.rental.services.PaymentService;
import com.example.rental.services.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final IEmailService emailService;
    
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
            
            // 📧 Send deposit confirmation emails to both owner and renter
            sendDepositSuccessEmails(payment, booking);
            
            log.info("Payment successful for booking ID: {}", booking.getId());
            
        } else if ("CANCELLED".equalsIgnoreCase(status)) {
            payment.setStatus(PaymentStatus.CANCELLED);
            
            // Auto-cancel booking when payment is cancelled
            Booking booking = payment.getBooking();
            if (booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.CANCELED);
                bookingRepository.save(booking);
                log.info("Booking {} automatically cancelled due to payment cancellation", booking.getId());
                
                // 📧 Send cancellation notification emails to both owner and renter
                sendBookingCancellationEmails(payment, booking);
            }
            
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
            PaymentStatus oldStatus = payment.getStatus();
            
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
                
                // 📧 Send emails only if status changed from non-SUCCESS to SUCCESS
                if (oldStatus != PaymentStatus.SUCCESS) {
                    sendDepositSuccessEmails(payment, booking);
                }
            } else if ("CANCELLED".equalsIgnoreCase(payosStatus)) {
                payment.setStatus(PaymentStatus.CANCELLED);
                
                // Auto-cancel booking when payment is cancelled
                Booking booking = payment.getBooking();
                if (booking.getStatus() == BookingStatus.PENDING) {
                    booking.setStatus(BookingStatus.CANCELED);
                    bookingRepository.save(booking);
                    log.info("Booking {} automatically cancelled due to payment cancellation", booking.getId());
                    
                    // 📧 Send cancellation notification emails to both owner and renter
                    sendBookingCancellationEmails(payment, booking);
                }
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
    
    /**
     * Send deposit success confirmation emails to both car owner and renter
     */
    private void sendDepositSuccessEmails(Payment payment, Booking booking) {
        try {
            User owner = booking.getCar().getOwner();
            User renter = booking.getRenter();
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            
            String carInfo = booking.getCar().getBrand() + " " + booking.getCar().getModel();
            String bookingPeriod = booking.getStartDate().format(dateFormatter) + " - " + 
                                   booking.getEndDate().format(dateFormatter);
            String depositAmount = String.format("%,d VNĐ", payment.getAmount().longValue());
            String paidTime = payment.getPaidAt().format(timeFormatter);
            
            // 📧 Email for CAR OWNER
            String ownerSubject = "✅ Xác nhận đặt cọc thành công - " + carInfo;
            String ownerMessage = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #5fcf86;">🎉 Có khách đặt cọc xe của bạn!</h2>
                    
                    <p>Xin chào <strong>%s</strong>,</p>
                    
                    <p>Xe <strong>%s</strong> của bạn vừa được đặt cọc thành công!</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">📋 Thông tin đặt xe:</h3>
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Khách thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Số điện thoại:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr style="background: #e8f5e9;">
                                <td style="padding: 8px 0;"><strong>Số tiền cọc (30%%):</strong></td>
                                <td style="padding: 8px 0; color: #4CAF50; font-size: 18px;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian thanh toán:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
                        <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
                        <ul style="margin: 10px 0;">
                            <li>Khách hàng đã đặt cọc 30%%, bạn cần chuẩn bị xe đúng hẹn</li>
                            <li>Hãy liên hệ với khách hàng để xác nhận địa điểm giao xe</li>
                            <li>Kiểm tra kỹ xe trước khi giao (nhiên liệu, ngoại thất, nội thất)</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        <a href="%s/car-management/%d" 
                           style="background: #5fcf86; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            📊 Xem chi tiết booking
                        </a>
                    </p>
                    
                    <p style="color: #666; margin-top: 30px;">Trân trọng,<br><strong>Vrooomie Team</strong></p>
                </div>
                """,
                owner.getFullName(),
                carInfo,
                renter.getFullName(),
                renter.getPhoneNumber() != null ? renter.getPhoneNumber() : "Chưa cập nhật",
                renter.getEmail(),
                bookingPeriod,
                depositAmount,
                paidTime,
                "http://localhost:4200", // TODO: Replace with actual frontend URL
                booking.getCar().getId()
            );
            
            emailService.sendHtmlEmail(owner.getEmail(), ownerSubject, ownerMessage);
            log.info("✅ Sent deposit confirmation email to car owner: {}", owner.getEmail());
            
            // 📧 Email for RENTER
            String renterSubject = "✅ Xác nhận đặt cọc thành công - " + carInfo;
            String renterMessage = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #5fcf86;">🎉 Đặt cọc thành công!</h2>
                    
                    <p>Xin chào <strong>%s</strong>,</p>
                    
                    <p>Bạn đã đặt cọc thành công cho xe <strong>%s</strong>. Chuyến đi của bạn đã được xác nhận!</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">📋 Thông tin chuyến đi:</h3>
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Xe:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Biển số:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Chủ xe:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr style="background: #e8f5e9;">
                                <td style="padding: 8px 0;"><strong>Đã thanh toán (30%%):</strong></td>
                                <td style="padding: 8px 0; color: #4CAF50; font-size: 18px;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Trạng thái:</strong></td>
                                <td style="padding: 8px 0;"><span style="background: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px;">✅ Đã xác nhận</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                        <p style="margin: 0;"><strong>ℹ️ Điều khoản thanh toán:</strong></p>
                        <ul style="margin: 10px 0;">
                            <li>Bạn đã thanh toán 30%% tiền cọc</li>
                            <li>70%% còn lại sẽ thanh toán khi nhận xe</li>
                            <li>Chủ xe sẽ liên hệ với bạn để xác nhận địa điểm giao xe</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        <a href="%s/my-trip" 
                           style="background: #5fcf86; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            🚗 Xem chuyến đi của tôi
                        </a>
                    </p>
                    
                    <p style="color: #666; margin-top: 30px;">Chúc bạn có chuyến đi vui vẻ!<br><strong>Vrooomie Team</strong></p>
                </div>
                """,
                renter.getFullName(),
                carInfo,
                carInfo,
                booking.getCar().getLicensePlate(),
                owner.getFullName(),
                bookingPeriod,
                depositAmount,
                "http://localhost:4200" // TODO: Replace with actual frontend URL
            );
            
            emailService.sendHtmlEmail(renter.getEmail(), renterSubject, renterMessage);
            log.info("✅ Sent deposit confirmation email to renter: {}", renter.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Failed to send deposit confirmation emails", e);
            // Don't throw exception - payment already succeeded, email is secondary
        }
    }
    
    /**
     * Send booking cancellation notification emails to both car owner and renter
     */
    private void sendBookingCancellationEmails(Payment payment, Booking booking) {
        try {
            User owner = booking.getCar().getOwner();
            User renter = booking.getRenter();
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            
            String carInfo = booking.getCar().getBrand() + " " + booking.getCar().getModel();
            String bookingPeriod = booking.getStartDate().format(dateFormatter) + " - " + 
                                   booking.getEndDate().format(dateFormatter);
            String depositAmount = String.format("%,d VNĐ", payment.getAmount().longValue());
            String cancelledTime = LocalDateTime.now().format(timeFormatter);
            
            // 📧 Email for CAR OWNER
            String ownerSubject = "❌ Booking đã bị hủy - " + carInfo;
            String ownerMessage = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #f44336;">⚠️ Booking đã bị hủy</h2>
                    
                    <p>Xin chào <strong>%s</strong>,</p>
                    
                    <p>Rất tiếc, booking cho xe <strong>%s</strong> của bạn đã bị hủy do khách hàng chưa hoàn tất thanh toán.</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">📋 Thông tin booking:</h3>
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Khách thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr style="background: #ffebee;">
                                <td style="padding: 8px 0;"><strong>Số tiền cọc:</strong></td>
                                <td style="padding: 8px 0; color: #f44336; font-size: 18px;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian hủy:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Trạng thái:</strong></td>
                                <td style="padding: 8px 0;"><span style="background: #f44336; color: white; padding: 4px 12px; border-radius: 12px;">❌ Đã hủy</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <p style="margin: 0;"><strong>✅ Tin tốt:</strong></p>
                        <ul style="margin: 10px 0;">
                            <li>Xe của bạn đã sẵn sàng cho booking mới</li>
                            <li>Không ảnh hưởng đến lịch cho thuê hoặc đánh giá của bạn</li>
                            <li>Bạn có thể tiếp tục nhận booking từ khách hàng khác</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        <a href="%s/user-profile?tab=my-cars" 
                           style="background: #5fcf86; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            🚗 Quản lý xe của tôi
                        </a>
                    </p>
                    
                    <p style="color: #666; margin-top: 30px;">Trân trọng,<br><strong>Vrooomie Team</strong></p>
                </div>
                """,
                owner.getFullName(),
                carInfo,
                renter.getFullName(),
                bookingPeriod,
                depositAmount,
                cancelledTime,
                "http://localhost:4200" // TODO: Replace with actual frontend URL
            );
            
            emailService.sendHtmlEmail(owner.getEmail(), ownerSubject, ownerMessage);
            log.info("✅ Sent cancellation notification email to car owner: {}", owner.getEmail());
            
            // 📧 Email for RENTER
            String renterSubject = "❌ Booking đã bị hủy - " + carInfo;
            String renterMessage = String.format("""
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #f44336;">⚠️ Booking đã bị hủy</h2>
                    
                    <p>Xin chào <strong>%s</strong>,</p>
                    
                    <p>Booking cho xe <strong>%s</strong> của bạn đã bị hủy do chưa hoàn tất thanh toán.</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">📋 Thông tin booking:</h3>
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Xe:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Biển số:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Chủ xe:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Thời gian thuê:</strong></td>
                                <td style="padding: 8px 0;">%s</td>
                            </tr>
                            <tr style="background: #ffebee;">
                                <td style="padding: 8px 0;"><strong>Số tiền cọc:</strong></td>
                                <td style="padding: 8px 0; color: #f44336; font-size: 18px;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Trạng thái:</strong></td>
                                <td style="padding: 8px 0;"><span style="background: #f44336; color: white; padding: 4px 12px; border-radius: 12px;">❌ Đã hủy</span></td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
                        <p style="margin: 0;"><strong>💡 Muốn thuê lại?</strong></p>
                        <p style="margin: 10px 0;">Bạn vẫn có thể đặt lại xe này hoặc tìm xe khác phù hợp với nhu cầu của mình.</p>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        <a href="%s/car-detail/%d" 
                           style="background: #5fcf86; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-right: 10px;">
                            🚗 Đặt lại xe này
                        </a>
                        <a href="%s" 
                           style="background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            🔍 Tìm xe khác
                        </a>
                    </p>
                    
                    <p style="color: #666; margin-top: 30px;">Cảm ơn bạn đã sử dụng dịch vụ!<br><strong>Vrooomie Team</strong></p>
                </div>
                """,
                renter.getFullName(),
                carInfo,
                carInfo,
                booking.getCar().getLicensePlate(),
                owner.getFullName(),
                bookingPeriod,
                depositAmount,
                "http://localhost:4200", // TODO: Replace with actual frontend URL
                booking.getCar().getId(),
                "http://localhost:4200" // TODO: Replace with actual frontend URL
            );
            
            emailService.sendHtmlEmail(renter.getEmail(), renterSubject, renterMessage);
            log.info("✅ Sent cancellation notification email to renter: {}", renter.getEmail());
            
        } catch (Exception e) {
            log.error("❌ Failed to send cancellation notification emails", e);
            // Don't throw exception - booking already cancelled, email is secondary
        }
    }
}

