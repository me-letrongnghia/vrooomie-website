import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {

  @Output() close = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  loginForm: FormGroup = new FormGroup<any>({});
  showErrorModal: boolean = false;
  errorMessage: string = '';

  constructor(private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router) { }

  ngOnInit(): void {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';

    // Initialize login form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    })
  }

  // Getters for form controls
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  submitForm() {
    // console.log('Submit form: ', this.loginForm.value);
    this.authService.login(this.loginForm.value).subscribe(
      (response) => {

        // Close login modal
        this.onClose();

        // Navigate to redirect URL or home
        const redirectUrl = localStorage.getItem('redirectUrl') || '/';
        this.router.navigate([redirectUrl]);
        localStorage.removeItem('redirectUrl');
      }, (error) => {
        console.log('Login failed: ', error);
        this.errorMessage = this.getErrorMessage(error);
        this.showErrorModal = true;
      }
    );
  }

  // Get user-friendly error message
  getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.status === 403) {
      return 'Sai email hoặc mật khẩu. Vui lòng thử lại.';
    } else if (error.status === 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    } else if (error.status === 0) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    } else {
      return 'Đăng nhập thất bại. Vui lòng thử lại.';
    }
  }

  // Close error modal
  closeErrorModal() {
    this.showErrorModal = false;
  }

  // Re-enable body scroll when modal closes
  ngOnDestroy() {
    // Re-enable body scroll when modal closes
    document.body.style.overflow = 'auto';
  }

  onSwitchToRegister() {
    this.switchToRegister.emit();
  }

  onClose() {
    this.close.emit();
  }
}
