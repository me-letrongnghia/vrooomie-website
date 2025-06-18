import { Component } from '@angular/core';

@Component({
  selector: 'app-login-status',
  standalone: false,
  templateUrl: './login-status.component.html',
  styleUrl: './login-status.component.css'
})
export class LoginStatusComponent {
  
  isLoginVisible = false;

  showLoginForm() {
    this.isLoginVisible = true;
  }

  hideLoginForm() {
    this.isLoginVisible = false;
  }
}
