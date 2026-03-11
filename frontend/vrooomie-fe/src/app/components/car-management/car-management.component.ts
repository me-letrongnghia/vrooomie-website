import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { BookingService, BookingResponse } from '../../services/booking.service';
import { BookingCountdownService, CountdownInfo } from '../../services/booking-countdown.service';
import { Car } from '../../models/car.interface';
import { Subscription, interval } from 'rxjs';

interface CarStats {
  totalRevenue: number;
  totalDays: number;
  averageRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  occupancyRate: number;
  rating: number;
  totalReviews: number;
}

@Component({
  selector: 'app-car-management',
  standalone: false,
  templateUrl: './car-management.component.html',
  styleUrl: './car-management.component.css'
})
export class CarManagementComponent implements OnInit, OnDestroy {
  carId: number = 0;
  car: Car | null = null;
  loading: boolean = true;
  error: string | null = null;

  // Active tab
  activeTab: 'overview' | 'calendar' | 'bookings' | 'settings' | 'info' | 'gps' | 'contract' = 'overview';

  // Car statistics
  carStats: CarStats = {
    totalRevenue: 0,
    totalDays: 0,
    averageRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    occupancyRate: 0,
    rating: 4.8,
    totalReviews: 0
  };

  // Bookings
  allBookings: BookingResponse[] = [];
  pendingBookings: BookingResponse[] = [];
  confirmedBookings: BookingResponse[] = [];
  completedBookings: BookingResponse[] = [];
  cancelledBookings: BookingResponse[] = [];
  bookingsLoading: boolean = false;

  // Bookings filter
  bookingFilter: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' = 'all';
  filteredBookings: BookingResponse[] = [];

  // Calendar
  currentMonth: Date = new Date();
  calendarDays: any[] = [];

  // Settings form
  isEditingBasicInfo: boolean = false;
  isEditingPricing: boolean = false;
  isEditingStatus: boolean = false;

  // Modal/Dialog properties
  showConfirmModal: boolean = false;
  confirmModalData: {
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    showCancel: boolean;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null = null;

  showNotificationModal: boolean = false;
  notificationModalData: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null = null;

  // Urgent bookings tracking
  urgentBookings: BookingResponse[] = []; // Bookings that need immediate attention
  dangerBookings: BookingResponse[] = []; // < 6h remaining
  warningBookings: BookingResponse[] = []; // < 12h remaining
  countdownMap: Map<number, CountdownInfo> = new Map();

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    private bookingService: BookingService,
    private countdownService: BookingCountdownService
  ) {}

  ngOnInit(): void {
    // Get car ID from route
    this.route.params.subscribe(params => {
      this.carId = +params['id'];
      if (this.carId) {
        this.loadCarDetails();
        this.loadCarBookings();
        
        // Auto-refresh every minute to update countdowns and check status
        const refreshSub = interval(60000).subscribe(() => {
          this.updateUrgentBookings();
          this.loadCarBookings(); // Refresh to detect auto-cancellations
        });
        this.subscriptions.push(refreshSub);
      } else {
        this.error = 'ID xe không hợp lệ';
        this.loading = false;
      }
    });

    // Check for query params to set active tab
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as 'overview' | 'calendar' | 'bookings' | 'settings';
      }
    });

    // Initialize calendar
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCarDetails(): void {
    this.loading = true;
    this.error = null;

    const sub = this.carService.getCarById(this.carId).subscribe({
      next: (car) => {
        this.car = car;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải thông tin xe';
        this.loading = false;
        console.error('Error loading car:', err);
      }
    });

    this.subscriptions.push(sub);
  }

  loadCarBookings(): void {
    this.bookingsLoading = true;

    const sub = this.bookingService.getCarBookings(this.carId).subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.categorizeBookings(bookings);
        this.calculateStats(bookings);
        this.updateCalendarWithBookings(bookings);
        this.applyBookingFilter();
        this.bookingsLoading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.bookingsLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  categorizeBookings(bookings: BookingResponse[]): void {
    this.pendingBookings = bookings.filter(b => b.status === 'PENDING');
    this.confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    this.completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    this.cancelledBookings = bookings.filter(b => b.status === 'CANCELED' || b.status === 'CANCELLED');
    
    // Track urgent bookings (PENDING with countdown)
    this.updateUrgentBookings();
  }

  updateUrgentBookings(): void {
    this.dangerBookings = [];
    this.warningBookings = [];
    this.urgentBookings = [];
    
    this.pendingBookings.forEach(booking => {
      if (booking.createdAt) {
        const countdown = this.countdownService.calculateCountdown(
          booking.createdAt,
          booking.reminderSent,
          booking.warningSent
        );
        
        this.countdownMap.set(booking.id, countdown);
        
        if (countdown.hoursRemaining <= 6 && !countdown.isExpired) {
          this.dangerBookings.push(booking);
        } else if (countdown.hoursRemaining <= 12 && !countdown.isExpired) {
          this.warningBookings.push(booking);
        }
      }
    });
    
    this.urgentBookings = [...this.dangerBookings, ...this.warningBookings];
  }

  calculateStats(bookings: BookingResponse[]): void {
    this.carStats.totalBookings = bookings.length;
    this.carStats.pendingBookings = this.pendingBookings.length;
    this.carStats.completedBookings = this.completedBookings.length;
    this.carStats.cancelledBookings = this.cancelledBookings.length;

    // Calculate total revenue from completed bookings
    this.carStats.totalRevenue = this.completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Calculate total days
    this.carStats.totalDays = this.completedBookings.reduce((sum, b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    // Calculate average revenue per booking
    if (this.carStats.completedBookings > 0) {
      this.carStats.averageRevenue = this.carStats.totalRevenue / this.carStats.completedBookings;
    }

    // Calculate occupancy rate (simplified)
    const totalDaysInPeriod = 180; // Last 6 months
    this.carStats.occupancyRate = (this.carStats.totalDays / totalDaysInPeriod) * 100;
  }

  // Tab navigation
  switchTab(tab: 'overview' | 'calendar' | 'bookings' | 'settings' | 'info' | 'gps' | 'contract'): void {
    this.activeTab = tab;
  }

  // Calendar methods
  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    this.calendarDays = [];

    // Add empty days for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      this.calendarDays.push({ date: null, status: 'empty' });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({
        date: date,
        day: day,
        status: 'available', // Will be updated with booking data
        bookings: []
      });
    }
  }

  updateCalendarWithBookings(bookings: BookingResponse[]): void {
    this.calendarDays.forEach(dayObj => {
      if (dayObj.date) {
        const dayBookings = bookings.filter(booking => {
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          const current = dayObj.date;
          
          return current >= start && current <= end && 
                 (booking.status === 'CONFIRMED' || booking.status === 'PENDING');
        });

        if (dayBookings.length > 0) {
          dayObj.bookings = dayBookings;
          const hasConfirmed = dayBookings.some(b => b.status === 'CONFIRMED');
          dayObj.status = hasConfirmed ? 'booked' : 'pending';
        }
      }
    });
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendar();
    this.updateCalendarWithBookings(this.allBookings);
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendar();
    this.updateCalendarWithBookings(this.allBookings);
  }

  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }

  // Booking filter methods
  applyBookingFilter(): void {
    switch (this.bookingFilter) {
      case 'pending':
        this.filteredBookings = this.pendingBookings;
        break;
      case 'confirmed':
        this.filteredBookings = this.confirmedBookings;
        break;
      case 'completed':
        this.filteredBookings = this.completedBookings;
        break;
      case 'cancelled':
        this.filteredBookings = this.cancelledBookings;
        break;
      default:
        this.filteredBookings = this.allBookings;
    }
  }

  setBookingFilter(filter: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'): void {
    this.bookingFilter = filter;
    this.applyBookingFilter();
  }

  // Booking actions
  approveBooking(bookingId: number): void {
    this.bookingService.confirmBooking(bookingId).subscribe({
      next: (response) => {
        this.loadCarBookings();
        alert(response.message || 'Đã chấp nhận booking');
      },
      error: (err) => {
        console.error('Error approving booking:', err);
        const errorMsg = err.error?.message || 'Có lỗi xảy ra khi chấp nhận booking';
        alert(errorMsg);
      }
    });
  }

  rejectBooking(bookingId: number): void {
    if (confirm('Bạn có chắc muốn từ chối booking này?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (response) => {
          this.loadCarBookings();
          alert(response.message || 'Đã từ chối booking');
        },
        error: (err) => {
          console.error('Error rejecting booking:', err);
          const errorMsg = err.error?.message || 'Có lỗi xảy ra khi từ chối booking';
          alert(errorMsg);
        }
      });
    }
  }

  completeBooking(bookingId: number): void {
    const booking = this.allBookings.find(b => b.id === bookingId);
    if (!booking) return;

    if (!this.canCompleteBooking(booking)) {
      alert('Chỉ có thể hoàn thành booking đã xác nhận và đã qua ngày kết thúc');
      return;
    }

    if (confirm('Xác nhận hoàn thành chuyến đi này?')) {
      this.bookingService.completeBooking(bookingId).subscribe({
        next: (response) => {
          this.loadCarBookings();
          alert(response.message || 'Đã hoàn thành chuyến đi');
        },
        error: (err) => {
          console.error('Error completing booking:', err);
          const errorMsg = err.error?.message || 'Có lỗi xảy ra khi hoàn thành booking';
          alert(errorMsg);
        }
      });
    }
  }

  canCompleteBooking(booking: BookingResponse): boolean {
    if (booking.status !== 'CONFIRMED') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    return today >= endDate;
  }

  // Settings methods
  toggleEditBasicInfo(): void {
    this.isEditingBasicInfo = !this.isEditingBasicInfo;
  }

  toggleEditPricing(): void {
    this.isEditingPricing = !this.isEditingPricing;
  }

  toggleEditStatus(): void {
    this.isEditingStatus = !this.isEditingStatus;
  }

  saveBasicInfo(): void {
    // TODO: Implement save basic info
    console.log('Saving basic info...');
    this.isEditingBasicInfo = false;
  }

  savePricing(): void {
    // TODO: Implement save pricing
    console.log('Saving pricing...');
    this.isEditingPricing = false;
  }

  saveStatus(): void {
    // TODO: Implement save status
    console.log('Saving status...');
    this.isEditingStatus = false;
  }

  deleteCar(): void {
    // Check if the car has any active bookings
    const activeBookings = this.allBookings.filter(
      b => b.status === 'PENDING' || b.status === 'CONFIRMED'
    );

    if (activeBookings.length > 0) {
      // Car has active bookings - CANNOT delete, show error notification
      const pendingCount = this.pendingBookings.length;
      const confirmedCount = this.confirmedBookings.length;
      
      let errorMessage = `<div class="blocking-warning">
        <div class="block-reason">
          <p><strong>Không thể xóa xe này vì:</strong></p>
          <ul class="reason-list">`;
      
      if (pendingCount > 0) {
        errorMessage += `<li>Có <strong>${pendingCount}</strong> booking đang chờ duyệt</li>`;
      }
      if (confirmedCount > 0) {
        errorMessage += `<li>Có <strong>${confirmedCount}</strong> booking đã xác nhận</li>`;
      }
      
      errorMessage += `</ul>
        </div>
        <div class="block-solution">
          <p><strong>Để xóa xe này, bạn cần:</strong></p>
          <ol>
            <li>Vào tab <strong>"Quản lý booking"</strong></li>
            <li>Hủy tất cả ${activeBookings.length} booking đang hoạt động</li>
            <li>Sau đó quay lại đây để xóa xe</li>
          </ol>
        </div>
        <div class="block-alternative">
          <p><strong>💡 Gợi ý:</strong> Thay vì xóa, bạn có thể <strong>tạm ngưng xe</strong> ở phần "Trạng thái & Khả dụng"</p>
        </div>
      </div>`;
      
      this.showNotification(
        '🚫 Không thể xóa xe',
        errorMessage,
        'error'
      );
    } else {
      // No active bookings - safe to delete
      this.showConfirmDialog({
        title: '🗑️ Xóa xe',
        message: `<div class="safe-delete">
          <p class="check-item">✓ Xe không có booking đang hoạt động</p>
          <p class="check-item">✓ An toàn để xóa</p>
          <p class="confirm-question">Bạn có chắc muốn xóa xe này không?</p>
          <p class="note">(Hành động này không thể hoàn tác)</p>
        </div>`,
        type: 'warning',
        showCancel: true,
        confirmText: 'Xóa xe',
        cancelText: 'Hủy',
        onConfirm: () => {
          this.performCarDeletion();
        }
      });
    }
  }

  // Helper method to perform actual car deletion
  private performCarDeletion(): void {
    this.carService.deleteCar(this.carId).subscribe({
      next: () => {
        this.showNotification('✅ Thành công', 'Đã xóa xe thành công!', 'success');
        setTimeout(() => {
          this.router.navigate(['/my-cars']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error deleting car:', err);
        let errorTitle = '❌ Không thể xóa xe';
        let errorMessage = '';
        
        if (err.status === 409) {
          errorMessage = 'Xe này có dữ liệu liên quan (booking, đánh giá, v.v.)<br>Vui lòng liên hệ quản trị viên để được hỗ trợ.';
        } else if (err.status === 403) {
          errorMessage = 'Bạn không có quyền xóa xe này!';
        } else {
          errorMessage = 'Có lỗi xảy ra khi xóa xe.<br>Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
        }
        
        this.showNotification(errorTitle, errorMessage, 'error');
      }
    });
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  getBookingStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'COMPLETED': 'status-completed',
      'CANCELED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  getBookingStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'PENDING': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'COMPLETED': 'Hoàn thành',
      'CANCELED': 'Đã hủy'
    };
    return texts[status] || status;
  }

  backToMyCars(): void {
    this.router.navigate(['/my-cars']);
  }

  // Modal helper methods
  showConfirmDialog(data: {
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    showCancel: boolean;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }): void {
    this.confirmModalData = data;
    this.showConfirmModal = true;
  }

  confirmDialogAction(): void {
    if (this.confirmModalData?.onConfirm) {
      this.confirmModalData.onConfirm();
    }
    this.closeConfirmDialog();
  }

  cancelDialogAction(): void {
    if (this.confirmModalData?.onCancel) {
      this.confirmModalData.onCancel();
    }
    this.closeConfirmDialog();
  }

  closeConfirmDialog(): void {
    this.showConfirmModal = false;
    this.confirmModalData = null;
  }

  showNotification(title: string, message: string, type: 'success' | 'error' | 'info'): void {
    this.notificationModalData = { title, message, type };
    this.showNotificationModal = true;
  }

  closeNotificationModal(): void {
    this.showNotificationModal = false;
    this.notificationModalData = null;
  }

  // Urgent booking helpers
  getCountdown(bookingId: number): CountdownInfo | null {
    return this.countdownMap.get(bookingId) || null;
  }

  formatCountdown(countdown: CountdownInfo | null): string {
    if (!countdown) return '';
    return this.countdownService.formatTimeRemaining(countdown);
  }

  hasUrgentBookings(): boolean {
    return this.urgentBookings.length > 0;
  }

  getUrgentLevel(): 'danger' | 'warning' | 'none' {
    if (this.dangerBookings.length > 0) return 'danger';
    if (this.warningBookings.length > 0) return 'warning';
    return 'none';
  }
}
