import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car } from '../../models/car.interface';
import { User } from '../../models/user.interface';
import { Subscription } from 'rxjs';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private carService: CarService
  ) {}

  getAvatarUrl(): string {
    return this.userDetail?.avatar || this.getDefaultAvatar();
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

  onLogout() {
    // Call logout method from AuthService
    this.authService.logout();
      
    // Navigate to home page
    this.router.navigate(['/']);
    
    console.log('Logout successful, navigated to home page');
  }
}
