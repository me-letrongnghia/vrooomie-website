import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy {
  
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  registerForm: FormGroup = new FormGroup<any>({});
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  userEmail: string = '';
  errorMessage: string = '';

  constructor(private formBuilder: FormBuilder,
              private authService: AuthService,
              private router: Router) {}

  // Custom validator to trim and check min length of actual content
  static trimmedMinLength(minLength: number) {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null; // Let required validator handle empty values
      
      const trimmedValue = control.value.trim();
      
      // Check if after trimming, the value is empty (only whitespace)
      if (trimmedValue.length === 0) return { 'onlyWhiteSpace': true };
      
      
      // Check if trimmed value meets minimum length requirement
      if (trimmedValue.length < minLength) return { 'trimmedMinLength': { requiredLength: minLength, actualLength: trimmedValue.length } };
      
      return null;
    };
  }

  ngOnInit() {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';

    // Initialize register form
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, RegisterComponent.trimmedMinLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        RegisterComponent.trimmedMinLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    });
  }

  // Getters for form controls
  get fullName() { return this.registerForm.get('fullName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }

  // Normalize form data before submission
  normalizeFormData(formData: any): any {
    const normalized = { ...formData };
    
    // Normalize text fields: trim and replace multiple spaces with single space
    if (normalized.fullName) {
      normalized.fullName = normalized.fullName.trim().replace(/\s+/g, ' ');
    }
    if (normalized.email) {
      normalized.email = normalized.email.trim().replace(/\s+/g, ' ');
    }
    
    return normalized;
  }

  // Submit form
  submitForm() {
    // Get normalized form data
    const formData = this.normalizeFormData(this.registerForm.value);
    
    // Check if passwords match before submitting
    if (formData.password !== formData.confirmPassword) {
      this.errorMessage = 'Mật khẩu không khớp. Vui lòng kiểm tra lại.';
      this.showErrorModal = true;
      return;
    }
    
    // console.log('Submit form: ', formData);
    this.authService.register(formData).subscribe(
      (response) => {
        console.log('Register successful: ', response)
        this.userEmail = formData.email;
        this.showSuccessModal = true;
      }, (error) => {
        console.log('Register failed: ', error);
        this.errorMessage = this.getErrorMessage(error);
        this.showErrorModal = true;
      }
    )
  }

  // Get user-friendly error message
  getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.status === 403) {
      return 'Email đã được sử dụng.';
    } else if (error.status === 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    } else if (error.status === 0) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    } else {
      return 'Đăng ký thất bại. Vui lòng thử lại.';
    }
  }

  // Close success modal and switch to login
  closeSuccessModal() {
    this.showSuccessModal = false;
    this.onSwitchToLogin();
  }

  // Close error modal
  closeErrorModal() {
    this.showErrorModal = false;
  }

  // Re-enable body scroll when modal closes
  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  // Switch to login
  onSwitchToLogin() {
    this.switchToLogin.emit();
  }

  // Close register modal
  onClose() {
    this.close.emit();
  }
}
