import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService, BookingResponse } from '../../services/booking.service';

@Component({
  selector: 'app-my-trips',
  standalone: false,
  templateUrl: './my-trips.component.html',
  styleUrl: './my-trips.component.css'
})
export class MyTripsComponent implements OnInit {
  // User's bookings
  userBookings: BookingResponse[] = [];
  filteredUserBookings: BookingResponse[] = [];
  selectedBookingStatus: string = 'ALL';
  bookingsLoading: boolean = false;
  bookingsError: string | null = null;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserBookings();
  }

  loadUserBookings(): void {
    this.bookingsLoading = true;
    this.bookingsError = null;

    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.userBookings = bookings;
        this.filterBookingsByStatus();
        this.bookingsLoading = false;
        console.log('User bookings loaded:', bookings);
      },
      error: (error) => {
        console.error('Error loading user bookings:', error);
        this.bookingsLoading = false;
        
        if (error.status === 401) {
          this.bookingsError = 'Bạn không có quyền xem danh sách chuyến đi này.';
        } else if (error.status === 500) {
          this.bookingsError = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.status === 0) {
          this.bookingsError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else {
          this.bookingsError = 'Có lỗi xảy ra khi tải danh sách chuyến đi. Vui lòng thử lại sau.';
        }
      }
    });
  }

  // Booking filter methods
  onBookingStatusFilterChange(status: string): void {
    this.selectedBookingStatus = status;
    this.filterBookingsByStatus();
  }

  filterBookingsByStatus(): void {
    if (this.selectedBookingStatus === 'ALL') {
      this.filteredUserBookings = this.userBookings;
    } else if (this.selectedBookingStatus === 'CANCELED') {
      this.filteredUserBookings = this.userBookings.filter(b => b.status === 'CANCELED' || b.status === 'CANCELLED');
    } else {
      this.filteredUserBookings = this.userBookings.filter(b => b.status === this.selectedBookingStatus);
    }
  }

  getBookingCountByStatus(status: string): number {
    if (status === 'ALL') {
      return this.userBookings.length;
    } else if (status === 'CANCELED') {
      return this.userBookings.filter(b => b.status === 'CANCELED' || b.status === 'CANCELLED').length;
    } else {
      return this.userBookings.filter(b => b.status === status).length;
    }
  }

  // Booking display methods
  getBookingStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'booking-status-pending';
      case 'CONFIRMED': return 'booking-status-confirmed';
      case 'COMPLETED': return 'booking-status-completed';
      case 'CANCELLED': return 'booking-status-cancelled';
      case 'CANCELED': return 'booking-status-cancelled';
      default: return 'booking-status-unknown';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'SUCCESS': return 'Đã thanh toán';
      case 'CANCELLED': return 'Đã hủy';
      case 'FAILED': return 'Thất bại';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'payment-status-pending';
      case 'SUCCESS': return 'payment-status-success';
      case 'CANCELLED': return 'payment-status-cancelled';
      case 'FAILED': return 'payment-status-failed';
      case 'EXPIRED': return 'payment-status-expired';
      default: return 'payment-status-unknown';
    }
  }

  formatBookingDate(dateString: string): string {
    if (!dateString) return '--/--/----';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '--/--/----';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  onViewBooking(bookingId: number): void {
    console.log('View booking:', bookingId);
    // Navigate to booking detail or show modal
  }
}
