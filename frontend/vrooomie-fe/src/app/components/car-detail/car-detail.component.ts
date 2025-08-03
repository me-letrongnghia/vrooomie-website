import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Car } from '../../models/car.interface';
import { CarService } from '../../services/car.service';
import { LoadingService } from '../../services/loading.service';
import { BookingService, BookingRequest, BookingResponse } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { AppComponent } from '../../app.component';

interface Review {
  id: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-car-detail',
  standalone: false,
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css'
})

export class CarDetailComponent implements OnInit {
  car: Car | null = null;
  loading = true;
  error: string | null = null;
  carId: number = 0;
  redirectUrl: string = '';

  // Date selection
  pickupDate: string = '';
  pickupTime: string = '09:00';
  returnDate: string = '';
  returnTime: string = '18:00';

  // Booking states
  bookingLoading = false;
  bookingError: string | null = null;
  bookingSuccess = false;
  isAuthenticated = false;

  // Existing bookings for this car
  existingBookings: BookingResponse[] = [];
  bookingsLoading = false;

  // Mock reviews data
  reviews: Review[] = [
    {
      id: 1,
      userName: 'Nguyễn Văn A',
      userAvatar: 'https://via.placeholder.com/50x50/007bff/ffffff?text=A',
      rating: 5,
      comment: 'Xe rất tuyệt vời, chủ xe thân thiện và nhiệt tình. Xe sạch sẽ, đúng như mô tả. Sẽ thuê lại lần sau!',
      date: '2024-01-15'
    },
    {
      id: 2,
      userName: 'Trần Thị B',
      userAvatar: 'https://via.placeholder.com/50x50/28a745/ffffff?text=B',
      rating: 4,
      comment: 'Xe đẹp, lái êm ái. Chủ xe giao nhận đúng giờ. Chỉ có điều âm thanh hơi nhỏ một chút.',
      date: '2024-01-10'
    },
    {
      id: 3,
      userName: 'Lê Văn C',
      userAvatar: 'https://via.placeholder.com/50x50/ffc107/ffffff?text=C',
      rating: 5,
      comment: 'Tuyệt vời! Xe mới, sạch sẽ, đầy đủ tiện nghi. Chủ xe support rất tốt. Highly recommended!',
      date: '2024-01-05'
    }
  ];

  // Additional images for gallery
  carImages: string[] = [
    '',  // Will be filled with car.imageUrl
    'https://via.placeholder.com/800x600/f0f0f0/999999?text=Car+Image+2',
    'https://via.placeholder.com/800x600/f0f0f0/999999?text=Car+Image+3',
    'https://via.placeholder.com/800x600/f0f0f0/999999?text=Car+Image+4',
    'https://via.placeholder.com/800x600/f0f0f0/999999?text=Car+Image+5'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    public loadingService: LoadingService,
    private bookingService: BookingService,
    private authService: AuthService,
    private appComponent: AppComponent
  ) {
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.pickupDate = today.toISOString().split('T')[0];
    this.returnDate = tomorrow.toISOString().split('T')[0];

    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.carId = +params['id'];
      if (this.carId) {
        this.loadCarDetails();
      } else {
        this.error = 'ID xe không hợp lệ';
        this.loading = false;
      }
    });
  }

  loadCarDetails(): void {
    this.loading = true;
    this.error = null;

    this.carService.getCarById(this.carId).subscribe({
      next: (car) => {
        this.car = car;
        this.carImages[0] = car.imageUrl; // Set main image
        this.loading = false;
        // Load existing bookings for this car
        this.loadCarBookings();
      },
      error: (err) => {
        this.error = 'Không thể tải thông tin xe. Vui lòng thử lại.';
        this.loading = false;
        console.error('Error loading car details:', err);
      }
    });
  }

  loadCarBookings(): void {
    this.bookingsLoading = true;
    this.bookingService.getCarBookings(this.carId).subscribe({
      next: (bookings) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        this.existingBookings = bookings
          .filter(booking => {
            // Only include CONFIRMED or PENDING bookings
            const isValidStatus = booking.status === 'CONFIRMED' || booking.status === 'PENDING';
            // Only include bookings that haven't ended yet (endDate >= today)
            const endDate = new Date(booking.endDate);
            const isNotExpired = endDate >= today;
            return isValidStatus && isNotExpired;
          })
          .sort((a, b) => {
            // Sort by start date ascending
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateA.getTime() - dateB.getTime();
          });
        
        this.bookingsLoading = false;
      },
      error: (err) => {
        console.error('Error loading car bookings:', err);
        this.bookingsLoading = false;
        // Don't show error to user for booking load failure
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  // Format date string to Vietnamese locale
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  // Format booking period
  formatBookingPeriod(booking: any): string {
    const startDate = this.formatDate(booking.startDate);
    const endDate = this.formatDate(booking.endDate);
    return `${startDate} - ${endDate}`;
  }

  // Get booking status display text
  getBookingStatusText(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PENDING': return 'Chờ xác nhận';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  }

  // Check if booking is currently active (today is between start and end date)
  isBookingActive(booking: any): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    return today >= startDate && today <= endDate;
  }

  // Check if booking is upcoming (start date is in future)
  isBookingUpcoming(booking: any): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.startDate);
    return startDate > today;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Có sẵn';
      case 'BOOKED': return 'Đã thuê';
      case 'UNAVAILABLE': return 'Bảo trì';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'BOOKED': return 'status-rented';
      case 'UNAVAILABLE': return 'status-maintenance';
      default: return 'status-unknown';
    }
  }

  calculateDays(): number {
    if (this.pickupDate && this.returnDate) {
      const pickup = new Date(this.pickupDate);
      const returnD = new Date(this.returnDate);
      const diffTime = Math.abs(returnD.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1;
    }
    return 1;
  }

  calculateTotalPrice(): number {
    if (this.car) {
      return this.car.pricePerDay * this.calculateDays();
    }
    return 0;
  }

  // Validation methods
  isValidDateRange(): boolean {
    if (!this.pickupDate || !this.returnDate) {
      return false;
    }

    const pickup = new Date(this.pickupDate);
    const returnD = new Date(this.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pickup date cannot be in the past
    if (pickup < today) {
      return false;
    }

    // Return date must be after pickup date
    return returnD > pickup;
  }

  getValidationError(): string | null {
    if (!this.pickupDate || !this.returnDate) {
      return 'Vui lòng chọn ngày nhận và trả xe';
    }

    const pickup = new Date(this.pickupDate);
    const returnD = new Date(this.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickup < today) {
      return 'Ngày nhận xe không thể là ngày trong quá khứ';
    }

    if (returnD <= pickup) {
      return 'Ngày trả xe phải sau ngày nhận xe';
    }

    // Check for date conflicts with existing bookings
    const conflictError = this.checkDateConflicts();
    if (conflictError) {
      return conflictError;
    }

    return null;
  }

  // Check if selected dates conflict with existing bookings
  checkDateConflicts(): string | null {
    if (!this.pickupDate || !this.returnDate || this.existingBookings.length === 0) {
      return null;
    }

    const selectedPickup = new Date(this.pickupDate);
    const selectedReturn = new Date(this.returnDate);

    for (const booking of this.existingBookings) {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);

      // Check if there's any overlap or adjacent dates
      if (this.datesOverlap(selectedPickup, selectedReturn, bookingStart, bookingEnd)) {
        const conflictStart = bookingStart.toLocaleDateString('vi-VN');
        const conflictEnd = bookingEnd.toLocaleDateString('vi-VN');
        
        // Check if it's adjacent dates
        const isAdjacent = (selectedPickup.getTime() === bookingEnd.getTime()) || 
                          (selectedReturn.getTime() === bookingStart.getTime());
        
        if (isAdjacent) {
          return `Không thể đặt sát ngày đã có booking (${conflictStart} - ${conflictEnd}). Vui lòng để trống ít nhất 1 ngày.`;
        } else {
          return `Khoảng thời gian từ ${conflictStart} đến ${conflictEnd} đã được đặt trước. Vui lòng chọn ngày khác.`;
        }
      }
    }

    return null;
  }

  // Check if two date ranges overlap or are adjacent (no gap allowed)
  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    // Prevent overlapping and adjacent bookings
    // Example: Booking A (24-25), Booking B (25-26) should conflict
    // Because end date of A (25) equals start date of B (25)
    return start1 <= end2 && end1 >= start2;
  }

  // Check if a specific date is disabled due to existing bookings
  isDateDisabled(date: string): boolean {
    if (!date || this.existingBookings.length === 0) {
      return false;
    }

    const checkDate = new Date(date);
    
    for (const booking of this.existingBookings) {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Check if the date falls within any existing booking
      if (checkDate >= bookingStart && checkDate <= bookingEnd) {
        return true;
      }
    }

    return false;
  }

  // Get the minimum allowed pickup date
  getMinPickupDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Get the minimum allowed return date based on pickup date
  getMinReturnDate(): string {
    if (!this.pickupDate) {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    }
    
    const pickup = new Date(this.pickupDate);
    pickup.setDate(pickup.getDate() + 1);
    return pickup.toISOString().split('T')[0];
  }

  onBookNow(): void {
    // Reset booking states
    this.bookingError = null;
    this.bookingSuccess = false;

    // Check authentication first
    if (!this.isAuthenticated) {
      this.appComponent.showLogin();
      localStorage.setItem('redirectUrl', this.router.url);
      return;
    }

    // Check car availability
    if (this.car?.status === 'UNAVAILABLE') {
      this.bookingError = 'Xe hiện không khả dụng';
      return;
    }

    // Validate dates
    const validationError = this.getValidationError();
    if (validationError) {
      this.bookingError = validationError;
      return;
    }

    // Prepare booking request
    const bookingRequest: BookingRequest = {
      carId: this.car?.id || 0,
      startDate: this.pickupDate,
      endDate: this.returnDate
    };

    // Start booking process
    this.bookingLoading = true;

    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (response) => {
        this.bookingLoading = false;
        this.bookingSuccess = true;
        console.log('Booking successful:', response);

        this.loading = true;
        // Show success message for 2 seconds then navigate
        setTimeout(() => {
          this.router.navigate(['/my-trips']);
          this.loading = false;
        }, 2000);
      },
      error: (error) => {
        this.bookingLoading = false;
        this.bookingError = error.error?.message || 'Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.';
        console.error('Booking error:', error);
      }
    });
  }

  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getRatingStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  goBack(): void {
    this.router.navigate(['/cars']);
  }

  openImageGallery(): void {
    // Open image gallery modal or navigate to gallery page
    console.log('Opening image gallery with images:', this.carImages);
    // Implementation for image gallery modal
  }
}