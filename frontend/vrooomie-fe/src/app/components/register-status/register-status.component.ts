import { Component } from '@angular/core';

@Component({
  selector: 'app-register-status',
  standalone: false,
  templateUrl: './register-status.component.html',
  styleUrl: './register-status.component.css'
})
export class RegisterStatusComponent {
  isLoginVisible = false;

  showRegister() {
    this.isLoginVisible = true;
  }

  hideRegister() {
    this.isLoginVisible = false;
  }
}
