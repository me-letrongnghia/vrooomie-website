import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  constructor(private formBuilder: FormBuilder,
              private authService: AuthService,
              private router: Router) {}

  ngOnInit() {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';

    // Initialize register form
    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]]
    })
  }

  // Getters for form controls
  get fullName() { return this.registerForm.get('fullName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }

  // Submit form
  submitForm() {
    // console.log('Submit form: ', this.registerForm.value);
    this.authService.register(this.registerForm.value).subscribe(
      (response) => {
        console.log('Register successful: ', response)
        alert('User registered successfully');
        this.onClose();
        this.onSwitchToLogin();
      }, (error) => {
        console.log('Register failed: ', error);
        alert('Registration failed. Please try again.');
      }
    )
  }

  ngOnDestroy() {
    // Re-enable body scroll when modal closes
    document.body.style.overflow = 'auto';
  }

  onSwitchToLogin() {
    this.switchToLogin.emit();
  }

  onClose() {
    this.close.emit();
  }
}
