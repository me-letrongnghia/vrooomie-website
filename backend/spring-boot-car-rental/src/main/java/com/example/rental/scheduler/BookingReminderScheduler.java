package com.example.rental.scheduler;

import com.example.rental.entity.Booking;
import com.example.rental.entity.User;
import com.example.rental.enums.BookingStatus;
import com.example.rental.repository.BookingRepository;
import com.example.rental.services.IBookingService;
import com.example.rental.services.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingReminderScheduler {

    private final BookingRepository bookingRepository;
    private final IEmailService emailService;
    private final IBookingService bookingService;

    // Chạy mỗi 30 phút để check bookings
    @Scheduled(fixedRate = 1800000) // 30 phút = 1800000ms
    @Transactional
    public void processBookingReminders() {
        log.info("Starting booking reminder check...");

        // Lấy tất cả bookings PENDING
        List<Booking> pendingBookings = bookingRepository.findByStatus(BookingStatus.PENDING);
        
        LocalDateTime now = LocalDateTime.now();
        
        for (Booking booking : pendingBookings) {
            LocalDateTime createdAt = booking.getCreatedAt();
            long hoursSinceCreated = Duration.between(createdAt, now).toHours();
            
            User owner = booking.getCar().getOwner();
            User renter = booking.getRenter();
            
            // Gửi Reminder sau 12h
            if (hoursSinceCreated >= 12 && !Boolean.TRUE.equals(booking.getReminderSent())) {
                sendReminderToOwner(booking, owner);
                booking.setReminderSent(true);
                bookingRepository.save(booking);
                log.info("Sent 12h reminder for booking #{}", booking.getId());
            }
            
            // Gửi Warning sau 18h
            else if (hoursSinceCreated >= 18 && !Boolean.TRUE.equals(booking.getWarningSent())) {
                sendWarningToOwner(booking, owner);
                booking.setWarningSent(true);
                bookingRepository.save(booking);
                log.info("Sent 18h warning for booking #{}", booking.getId());
            }
            
            // Auto-cancel sau 24h
            else if (hoursSinceCreated >= 24) {
                autoCancelBooking(booking, owner, renter);
                log.info("Auto-canceled booking #{} after 24h", booking.getId());
            }
        }
        
        log.info("Booking reminder check completed.");
    }

    /**
     * Gửi Reminder lần 1 cho chủ xe (sau 12h)
     */
    private void sendReminderToOwner(Booking booking, User owner) {
        String subject = "Nhắc nhở: Bạn có yêu cầu thuê xe chưa xác nhận";
        String message = String.format("""
            Bạn có một yêu cầu thuê xe đang chờ xác nhận từ <strong>%s</strong>.
            <br><br>
            <strong style="color: #ff9800;">Lưu ý:</strong> Nếu không xác nhận trong vòng <strong>12 giờ nữa</strong>, yêu cầu sẽ tự động hủy.
            <br><br>
            Vui lòng đăng nhập để xác nhận hoặc từ chối yêu cầu.
            """,
            booking.getRenter().getFullName()
        );
        
        emailService.sendBookingStatusNotification(owner, booking, subject, message);
    }

    /**
     * Gửi Warning cho chủ xe (sau 18h)
     */
    private void sendWarningToOwner(Booking booking, User owner) {
        String subject = "CẢNH BÁO: Yêu cầu thuê xe sắp tự động hủy";
        String message = String.format("""
            <strong style="color: #f44336;">CẢNH BÁO CUỐI CÙNG!</strong>
            <br><br>
            Yêu cầu thuê xe từ <strong>%s</strong> sẽ tự động hủy trong <strong>6 giờ nữa</strong> nếu bạn không xác nhận.
            <br><br>
            <strong>Thời gian còn lại:</strong> Khoảng <strong style="color: #f44336;">6 giờ</strong>
            <br><br>
            Hãy đăng nhập và xác nhận ngay!
            """,
            booking.getRenter().getFullName()
        );
        
        emailService.sendBookingStatusNotification(owner, booking, subject, message);
    }

    /**
     * Auto-cancel booking sau 24h và thông báo cho cả 2 bên
     */
    private void autoCancelBooking(Booking booking, User owner, User renter) {
        // Cập nhật status
        booking.setStatus(BookingStatus.CANCELED);
        bookingRepository.save(booking);
        
        // Thông báo cho chủ xe
        String ownerSubject = "Yêu cầu thuê xe đã tự động hủy";
        String ownerMessage = String.format("""
            Yêu cầu thuê xe từ <strong>%s</strong> đã tự động hủy do không được xác nhận trong 24 giờ.
            <br><br>
            <strong style="color: #999;">Lưu ý:</strong> Việc không phản hồi kịp thời có thể ảnh hưởng đến uy tín của bạn.
            """,
            renter.getFullName()
        );
        emailService.sendBookingStatusNotification(owner, booking, ownerSubject, ownerMessage);
        
        // Thông báo cho người thuê
        String renterSubject = "Yêu cầu thuê xe đã bị hủy";
        String renterMessage = """
            Rất tiếc! Yêu cầu thuê xe của bạn đã tự động hủy do chủ xe không phản hồi trong 24 giờ.
            <br><br>
            <strong>Tiền của bạn sẽ được hoàn lại trong vòng 3-5 ngày làm việc.</strong>
            <br><br>
            Bạn có thể tìm xe khác tại trang chủ của chúng tôi.
            """;
        emailService.sendBookingStatusNotification(renter, booking, renterSubject, renterMessage);
    }

    /**
     * Tự động hoàn thành các booking đã hết hạn
     * Chạy mỗi ngày lúc 2:00 sáng
     */
    @Scheduled(cron = "0 0 2 * * *") // Chạy lúc 2:00 AM mỗi ngày
    @Transactional
    public void autoCompleteExpiredBookings() {
        log.info("Starting auto-complete expired bookings check...");
        
        try {
            bookingService.autoCompleteExpiredBookings();
            log.info("Auto-complete expired bookings completed successfully.");
        } catch (Exception e) {
            log.error("Error during auto-complete expired bookings: {}", e.getMessage(), e);
        }
    }
}
