import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CarService, CarCreateRequest } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { FileUploadService } from '../../services/file-upload.service';
import { Car } from '../../models/car.interface';
import { User } from '../../models/user.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { MAPS_CONFIG } from '../delivery-address-modal/maps.config';

@Component({
  selector: 'app-my-cars',
  standalone: false,
  templateUrl: './my-cars.component.html',
  styleUrl: './my-cars.component.css'
})
export class MyCarsComponent implements OnInit, AfterViewInit, OnDestroy {
  userDetail: User | null = null;
  userCars: Car[] = [];
  carsLoading: boolean = false;
  carsError: string | null = null;

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
    private carService: CarService,
    private authService: AuthService,
    private router: Router,
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

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.subscribe(user => {
      this.userDetail = user;
      console.log('My Cars - Current user:', user);
      if (user) {
        this.loadUserCars();
      } else {
        console.warn('My Cars - No user logged in');
        this.carsError = 'Vui lòng đăng nhập để xem danh sách xe của bạn.';
      }
    });
  }

  ngAfterViewInit(): void {
    // Map initialization will happen when modal opens
  }

  ngOnDestroy(): void {
    if (this.locationPickerMap) {
      this.locationPickerMap.remove();
    }
  }

  loadUserCars(): void {
    if (!this.userDetail?.id) {
      console.error('My Cars - Cannot load: No user ID', this.userDetail);
      this.carsError = 'Không thể tải danh sách xe. Vui lòng đăng nhập lại.';
      return;
    }

    console.log('My Cars - Loading cars for user ID:', this.userDetail.id);
    this.carsLoading = true;
    this.carsError = null;

    this.carService.getCarsByOwnerId(this.userDetail.id).subscribe({
      next: (cars) => {
        this.userCars = cars;
        this.carsLoading = false;
        console.log('My Cars - Successfully loaded cars:', cars);
      },
      error: (error) => {
        console.error('My Cars - Error loading cars:', error);
        this.carsLoading = false;
        
        if (error.status === 401) {
          this.carsError = 'Bạn không có quyền xem danh sách xe này. Vui lòng đăng nhập lại.';
        } else if (error.status === 500) {
          this.carsError = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.status === 0) {
          this.carsError = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.';
        } else {
          this.carsError = `Có lỗi xảy ra khi tải danh sách xe (${error.status}). Vui lòng thử lại sau.`;
        }
      }
    });
  }

  // Car actions
  onViewCar(carId: number): void {
    this.router.navigate(['/car', carId]);
  }

  onEditCar(carId: number): void {
    this.router.navigate(['/car-management', carId]);
  }

  // Car status
  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Có sẵn';
      case 'RENTED': return 'Đã thuê';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'UNAVAILABLE': return 'Không khả dụng';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'RENTED': return 'status-rented';
      case 'MAINTENANCE': return 'status-maintenance';
      case 'UNAVAILABLE': return 'status-unavailable';
      default: return '';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  // Create car modal
  onOpenCreateCarModal(): void {
    this.showCreateCarModal = true;
    this.carCreateError = null;
    this.carCreateSuccess = false;
    this.createCarForm.reset();
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadMode = 'url';
    
    // Initialize map after modal is shown
    setTimeout(() => {
      this.initLocationPickerMap();
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

    if (!this.authService.isAuthenticated()) {
      this.carCreateError = 'Bạn cần đăng nhập để thực hiện chức năng này.';
      return;
    }

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

    if (this.uploadMode === 'upload' && this.selectedFile) {
      this.fileUploading = true;
      this.fileUploadService.uploadFile(this.selectedFile).subscribe({
        next: (response) => {
          this.fileUploading = false;
          this.createCarForm.patchValue({ imageUrl: response.fileUrl });
          this.createCarWithData();
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          this.fileUploading = false;
          this.carCreating = false;
          
          if (error.status === 401 || error.status === 403) {
            this.carCreateError = 'Bạn cần đăng nhập để tải hình ảnh lên. Vui lòng đăng nhập lại.';
          } else if (error.status === 413) {
            this.carCreateError = 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.';
          } else if (error.status === 415) {
            this.carCreateError = 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF.';
          } else {
            this.carCreateError = 'Không thể tải hình ảnh lên. Vui lòng thử lại.';
          }
        }
      });
    } else {
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
        } else {
          this.carCreateError = 'Có lỗi xảy ra khi tạo xe. Vui lòng thử lại sau.';
        }
      }
    });
  }

  // Form validation
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
    if (field.errors['min']) return `Giá trị tối thiểu: ${field.errors['min'].min}`;
    if (field.errors['pattern']) {
      if (fieldName === 'licensePlate') return 'Biển số không hợp lệ (VD: 30A-12345)';
    }
    return 'Giá trị không hợp lệ';
  }

  // File upload
  switchUploadMode(mode: 'url' | 'upload'): void {
    this.uploadMode = mode;
    this.carCreateError = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.carCreateError = 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.';
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.carCreateError = 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF.';
        return;
      }

      this.selectedFile = file;
      this.carCreateError = null;

      // Preview image
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
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Location picker
  private initLocationPickerMap(): void {
    const mapElement = document.getElementById('createCarMap');
    if (!mapElement) return;

    if (this.locationPickerMap) {
      this.locationPickerMap.remove();
    }

    this.locationPickerMap = L.map('createCarMap').setView(
      [MAPS_CONFIG.DEFAULT_COORDS.lat, MAPS_CONFIG.DEFAULT_COORDS.lng], 
      MAPS_CONFIG.DEFAULT_ZOOM
    );

    L.tileLayer(MAPS_CONFIG.TILE_LAYER.url, {
      attribution: MAPS_CONFIG.TILE_LAYER.attribution
    }).addTo(this.locationPickerMap);

    const customIcon = L.icon({
      iconUrl: MAPS_CONFIG.MARKERS.CAR.iconUrl,
      iconSize: MAPS_CONFIG.MARKERS.CAR.iconSize as [number, number],
      iconAnchor: MAPS_CONFIG.MARKERS.CAR.iconAnchor as [number, number],
      popupAnchor: MAPS_CONFIG.MARKERS.CAR.popupAnchor as [number, number]
    });

    this.locationPickerMap.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (this.locationMarker) {
        this.locationMarker.setLatLng([lat, lng]);
      } else {
        this.locationMarker = L.marker([lat, lng], { icon: customIcon })
          .addTo(this.locationPickerMap!);
      }

      this.createCarForm.patchValue({
        latitude: lat,
        longitude: lng
      });
    });
  }

  clearLocation(): void {
    if (this.locationMarker && this.locationPickerMap) {
      this.locationPickerMap.removeLayer(this.locationMarker);
      this.locationMarker = null;
    }
    this.createCarForm.patchValue({
      latitude: '',
      longitude: ''
    });
  }
}
