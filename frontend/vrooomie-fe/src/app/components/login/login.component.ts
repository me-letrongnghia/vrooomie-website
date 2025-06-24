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
        console.log('Login successful: ', response);
        this.onClose();

        // Store token and email in local storage
        if (response.token && response.email) {
          const token = response.token;
          const email = response.email;
          localStorage.setItem('token', token);
          localStorage.setItem('email', email);

          // Navigate
          const redirectUrl = localStorage.getItem('redirectUrl') || '/';

          // Back to previous page
          this.router.navigate([redirectUrl]);

          // Remove redirect URL from local storage
          localStorage.removeItem('redirectUrl');
        }
      }, (error) => {
        console.log('Login failed: ', error);
        if (error) {
          alert('Login failed!');
        }
      }
    );
  }

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
