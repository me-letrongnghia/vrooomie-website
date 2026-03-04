import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CarService, CarCreateRequest } from '../../services/car.service';
import { BookingService, BookingResponse } from '../../services/booking.service';
import { Car } from '../../models/car.interface';
import { User } from '../../models/user.interface';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileUploadService } from '../../services/file-upload.service';
import * as L from 'leaflet';
import { MAPS_CONFIG } from '../delivery-address-modal/maps.config';

@Component({
  selector: 'app-user-detail-info',
  standalone: false,
  templateUrl: './user-detail-info.component.html',
  styleUrl: './user-detail-info.component.css'
})
export class UserDetailInfoComponent implements OnInit, OnDestroy {
  userDetail: User | null = null;
  loading: boolean = false;
  error: string | null = null;
  private authSubscription: Subscription | null = null;

  // User's cars
  userCars: Car[] = [];
  carsLoading: boolean = false;
  carsError: string | null = null;

  // User's bookings
  userBookings: BookingResponse[] = [];
  bookingsLoading: boolean = false;
  bookingsError: string | null = null;

  // Create car modal
  showCreateCarModal: boolean = false;
  createCarForm: FormGroup;
  carCreating: boolean = false;
  carCreateError: string | null = null;
  carCreateSuccess: boolean = false;

  // File upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadMode: 'url' | 'upload' = 'url';
  fileUploading: boolean = false;
  uploadProgress: number = 0;

  // Location picker map
  private locationPickerMap: L.Map | null = null;
  private locationMarker: L.Marker | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private carService: CarService,
    private bookingService: BookingService,
    private fb: FormBuilder,
    private fileUploadService: FileUploadService
  ) {
    // Initialize create car form
    this.createCarForm = this.fb.group({
      brand: ['', [Validators.required, Validators.minLength(2)]],
      model: ['', [Validators.required, Validators.minLength(1)]],
      licensePlate: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/)]],
      type: ['', Validators.required],
      pricePerDay: ['', [Validators.required, Validators.min(100000)]],
      imageUrl: [''],
      address: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
      latitude: [''],
      longitude: ['']
    });
  }

  getAvatarUrl(): string {
    return this.userDetail?.avatarUrl || this.getDefaultAvatar();
  }

  formatJoinDate(dateString: string | undefined): string {
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

  formatBirthDate(dateString: string | undefined): string {
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

  private getDefaultAvatar(): string {
    if (!this.userDetail?.fullName) {
      return 'https://via.placeholder.com/80x80/e0e0e0/666666?text=U';
    }
    const initials = this.userDetail.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://via.placeholder.com/80x80/e0e0e0/666666?text=${initials}`;
  }

  activeMenu: string = 'account';

  // Getter methods for template access
  get isAuthLoading(): boolean {
    return this.authService.isAuthLoading();
  }

  onMenuClick(menuKey: string) {
    // Set active menu
    this.activeMenu = menuKey;
    // Handle navigation logic here
    console.log('Clicked menu:', menuKey);

    // You can add specific logic for each menu item here
    switch (menuKey) {
      case 'account':
        console.log('Navigating to account page');
        break;
      case 'favorites':
        console.log('Navigating to favorites page');
        break;
      case 'my-cars':
        console.log('Navigating to my cars page');
        this.loadUserCars();
        break;
      case 'my-trips':
        console.log('Navigating to my trips page');
        this.loadUserBookings();
        break;
      case 'long-term-rental':
        console.log('Navigating to long term rental page');
        break;
      case 'gifts':
        console.log('Navigating to gifts page');
        break;
      case 'addresses':
        console.log('Navigating to addresses page');
        break;
      case 'change-password':
        console.log('Navigating to change password page');
        break;
      case 'delete-account':
        console.log('Navigating to delete account page');
        break;
      case 'logout':
        // Just show the logout confirmation, actual logout handled by onLogout method
        break;
      default:
        console.log('Unknown menu item:', menuKey);
    }
  }

  ngOnInit(): void {
    // Check authentication state first
    this.authSubscription = this.authService.authLoading$.subscribe(authLoading => {
      if (!authLoading) {
        // Auth loading is complete, now check if user is authenticated
        if (this.authService.isAuthenticated()) {
          this.loadUserDetail();
        } else {
          // User is not authenticated, redirect to login
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup subscription to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    // Clean up map if exists
    if (this.locationPickerMap) {
      this.locationPickerMap.remove();
    }
  }

  // Location Picker Map Methods
  private initializeLocationPickerMap(): void {
    const mapElement = document.getElementById('createCarMap');
    if (!mapElement) return;

    // Default center: Ho Chi Minh City
    const defaultLat = 10.8231;
    const defaultLng = 106.6297;

    try {
      // Initialize map
      this.locationPickerMap = L.map('createCarMap', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true
      });

      // Add tile layer
      L.tileLayer(MAPS_CONFIG.TILE_LAYER.url, {
        attribution: MAPS_CONFIG.TILE_LAYER.attribution,
        maxZoom: 19
      }).addTo(this.locationPickerMap);

      // Create custom icon
      const customIcon = L.icon({
        iconUrl: MAPS_CONFIG.MARKERS.CAR.iconUrl,
        iconSize: MAPS_CONFIG.MARKERS.CAR.iconSize as [number, number],
        iconAnchor: MAPS_CONFIG.MARKERS.CAR.iconAnchor as [number, number],
        popupAnchor: MAPS_CONFIG.MARKERS.CAR.popupAnchor as [number, number]
      });

      // Handle map click to place marker
      this.locationPickerMap.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Remove existing marker
        if (this.locationMarker) {
          this.locationMarker.remove();
        }

        // Place new marker
        this.locationMarker = L.marker([lat, lng], { icon: customIcon })
          .addTo(this.locationPickerMap!)
          .bindPopup('Vị trí xe của bạn')
          .openPopup();

        // Update form values
        this.createCarForm.patchValue({
          latitude: lat,
          longitude: lng
        });

        console.log('Location selected:', lat, lng);
      });

      // Fix map display issues
      setTimeout(() => {
        this.locationPickerMap?.invalidateSize();
      }, 100);

    } catch (error) {
      console.error('Error initializing location picker map:', error);
    }
  }

  clearLocation(): void {
    // Remove marker
    if (this.locationMarker) {
      this.locationMarker.remove();
      this.locationMarker = null;
    }

    // Clear form values
    this.createCarForm.patchValue({
      latitude: null,
      longitude: null
    });

    console.log('Location cleared');
  }

  loadUserDetail(): void {
    this.loading = true;
    this.error = null;

    // Double check authentication before making API call
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getUserDetail().subscribe({
      next: (data: any) => {
        this.userDetail = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching user detail:', error);
        this.loading = false;
        
        // Handle different types of errors
        if (error.status === 401) {
          // Unauthorized - clear auth state and redirect to login
          console.log('Unauthorized access, clearing auth and redirecting to login');
          this.authService.clearAuthState();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          // Forbidden
          this.error = 'Bạn không có quyền truy cập thông tin này.';
        } else if (error.status === 500) {
          // Server error
          this.error = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.status === 0) {
          // Network error
          this.error = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else {
          // Generic error
          this.error = 'Có lỗi xảy ra khi tải thông tin. Vui lòng thử lại sau.';
        }
      }
    });
  }

  onEditPhone() {
    console.log('Edit phone clicked');
  }

  onAddEmail() {
    console.log('Add email clicked');
  }

  onAddFacebook() {
    console.log('Add Facebook clicked');
  }

  onAddGoogle() {
    console.log('Add Google clicked');
  }

  onEditDriverLicense() {
    console.log('Edit driver license clicked');
  }

  loadUserCars(): void {
    if (!this.userDetail?.id) {
      this.carsError = 'Không thể tải danh sách xe. Vui lòng thử lại.';
      return;
    }

    this.carsLoading = true;
    this.carsError = null;

    this.carService.getCarsByOwnerId(this.userDetail.id).subscribe({
      next: (cars) => {
        this.userCars = cars;
        this.carsLoading = false;
        console.log('User cars loaded:', cars);
      },
      error: (error) => {
        console.error('Error loading user cars:', error);
        this.carsLoading = false;
        
        if (error.status === 401) {
          this.carsError = 'Bạn không có quyền xem danh sách xe này.';
        } else if (error.status === 500) {
          this.carsError = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.status === 0) {
          this.carsError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else {
          this.carsError = 'Có lỗi xảy ra khi tải danh sách xe. Vui lòng thử lại sau.';
        }
      }
    });
  }

  loadUserBookings(): void {
    this.bookingsLoading = true;
    this.bookingsError = null;

    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.userBookings = bookings;
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

  // Format price for car display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  // Get status text for car
  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Có sẵn';
      case 'BOOKED': return 'Đã thuê';
      case 'UNAVAILABLE': return 'Bảo trì';
      default: return status;
    }
  }

  // Get status class for car
  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'BOOKED': return 'status-rented';
      case 'UNAVAILABLE': return 'status-maintenance';
      default: return 'status-unknown';
    }
  }

  // Navigate to car detail
  onViewCar(carId: number): void {
    this.router.navigate(['/cars', carId]);
  }

  // Edit car functionality (placeholder)
  onEditCar(carId: number): void {
    console.log('Edit car:', carId);
    // TODO: Navigate to edit car page
  }

  // Delete car functionality (placeholder)
  onDeleteCar(carId: number): void {
    console.log('Delete car:', carId);
    // TODO: Show confirmation dialog and delete car
  }

  // Booking display methods
  getBookingStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'booking-status-pending';
      case 'CONFIRMED': return 'booking-status-confirmed';
      case 'COMPLETED': return 'booking-status-completed';
      case 'CANCELLED': return 'booking-status-cancelled';
      default: return 'booking-status-unknown';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'FAILED': return 'Thanh toán thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'payment-status-pending';
      case 'PAID': return 'payment-status-paid';
      case 'FAILED': return 'payment-status-failed';
      case 'REFUNDED': return 'payment-status-refunded';
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

  // Navigate to booking detail (placeholder)
  onViewBooking(bookingId: number): void {
    console.log('View booking:', bookingId);
    // TODO: Navigate to booking detail page or show modal
  }

  onLogout() {
    // Call logout method from AuthService
    this.authService.logout();
      
    // Navigate to home page
    this.router.navigate(['/']);
    
    console.log('Logout successful, navigated to home page');
  }

  // Create car methods
  onOpenCreateCarModal(): void {
    this.showCreateCarModal = true;
    this.carCreateError = null;
    this.carCreateSuccess = false;
    this.createCarForm.reset();
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadMode = 'url';
    this.fileUploading = false;
    this.uploadProgress = 0;

    // Initialize location picker map after modal DOM is ready
    setTimeout(() => {
      this.initializeLocationPickerMap();
    }, 100);
  }

  onCloseCreateCarModal(): void {
    this.showCreateCarModal = false;
    this.carCreateError = null;
    this.carCreateSuccess = false;
    this.createCarForm.reset();
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadMode = 'url';
    this.fileUploading = false;
    this.uploadProgress = 0;

    // Clean up map
    if (this.locationPickerMap) {
      this.locationPickerMap.remove();
      this.locationPickerMap = null;
      this.locationMarker = null;
    }
  }

  onSubmitCreateCar(): void {
    if (this.createCarForm.invalid) {
      Object.keys(this.createCarForm.controls).forEach(key => {
        this.createCarForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.carCreateError = 'Bạn cần đăng nhập để thực hiện chức năng này.';
      return;
    }

    // Validate image (either URL or file upload)
    if (this.uploadMode === 'url') {
      if (!this.createCarForm.value.imageUrl) {
        this.carCreateError = 'Vui lòng nhập URL hình ảnh';
        return;
      }
    } else {
      if (!this.selectedFile) {
        this.carCreateError = 'Vui lòng chọn hình ảnh';
        return;
      }
    }

    this.carCreating = true;
    this.carCreateError = null;
    this.carCreateSuccess = false;

    // If upload mode, upload file first
    if (this.uploadMode === 'upload' && this.selectedFile) {
      this.fileUploading = true;
      this.fileUploadService.uploadFile(this.selectedFile).subscribe({
        next: (response) => {
          this.fileUploading = false;
          // Set the uploaded image URL
          this.createCarForm.patchValue({ imageUrl: response.fileUrl });
          // Now create the car
          this.createCarWithData();
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          this.fileUploading = false;
          this.carCreating = false;
          
          // Better error handling
          if (error.status === 401 || error.status === 403) {
            this.carCreateError = 'Bạn cần đăng nhập để tải hình ảnh lên. Vui lòng đăng nhập lại.';
            // Clear auth and show login
            setTimeout(() => {
              this.authService.clearAuthState();
              this.router.navigate(['/']);
            }, 2000);
          } else if (error.status === 413) {
            this.carCreateError = 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.';
          } else if (error.status === 415) {
            this.carCreateError = 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF.';
          } else if (error.status === 0) {
            this.carCreateError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else {
            const errorMsg = error.error?.error || error.error?.message || 'Không thể tải hình ảnh lên';
            this.carCreateError = `Lỗi: ${errorMsg}. Vui lòng thử lại.`;
          }
        }
      });
    } else {
      // URL mode, create car directly
      this.createCarWithData();
    }
  }

  private createCarWithData(): void {
    const carData: CarCreateRequest = {
      brand: this.createCarForm.value.brand,
      model: this.createCarForm.value.model,
      licensePlate: this.createCarForm.value.licensePlate,
      type: this.createCarForm.value.type,
      pricePerDay: parseFloat(this.createCarForm.value.pricePerDay),
      imageUrl: this.createCarForm.value.imageUrl,
      address: this.createCarForm.value.address,
      description: this.createCarForm.value.description,
      latitude: this.createCarForm.value.latitude || null,
      longitude: this.createCarForm.value.longitude || null
    };

    this.carService.createCar(carData).subscribe({
      next: (car) => {
        console.log('Car created successfully:', car);
        this.carCreating = false;
        this.carCreateSuccess = true;
        
        // Wait 1.5 seconds to show success message, then close modal and reload cars
        setTimeout(() => {
          this.onCloseCreateCarModal();
          this.loadUserCars();
        }, 1500);
      },
      error: (error) => {
        console.error('Error creating car:', error);
        this.carCreating = false;
        
        if (error.status === 401) {
          this.carCreateError = 'Bạn không có quyền tạo xe. Vui lòng đăng nhập lại.';
        } else if (error.status === 400) {
          this.carCreateError = error.error?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (error.status === 500) {
          this.carCreateError = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.status === 0) {
          this.carCreateError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else {
          this.carCreateError = 'Có lỗi xảy ra khi tạo xe. Vui lòng thử lại sau.';
        }
      }
    });
  }

  // Form validation helper
  isFieldInvalid(fieldName: string): boolean {
    const field = this.createCarForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.createCarForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Trường này là bắt buộc';
    if (field.errors['minlength']) return `Tối thiểu ${field.errors['minlength'].requiredLength} ký tự`;
    if (field.errors['maxlength']) return `Tối đa ${field.errors['maxlength'].requiredLength} ký tự`;
    if (field.errors['pattern']) {
      if (fieldName === 'licensePlate') return 'Biển số không hợp lệ (VD: 30A-12345)';
      if (fieldName === 'imageUrl') return 'URL hình ảnh không hợp lệ';
    }
    if (field.errors['min']) return `Giá trị tối thiểu là ${field.errors['min'].min}`;
    
    return 'Giá trị không hợp lệ';
  }

  // File upload methods
  switchUploadMode(mode: 'url' | 'upload'): void {
    this.uploadMode = mode;
    this.selectedFile = null;
    this.imagePreview = null;
    this.createCarForm.patchValue({ imageUrl: '' });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.carCreateError = 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)';
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.carCreateError = 'Kích thước file tối đa là 10MB';
        return;
      }

      this.selectedFile = file;
      this.carCreateError = null;

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
