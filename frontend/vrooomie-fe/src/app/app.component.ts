import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vrooomie-fe';
  
  isLoginVisible = false;
  isRegisterVisible = false;

  showLogin() {
    this.isLoginVisible = true;
    this.isRegisterVisible = false;
  }

  showRegister() {
    this.isRegisterVisible = true;
    this.isLoginVisible = false;
  }

  hideLogin() {
    this.isLoginVisible = false;
  }

  hideRegister() {
    this.isRegisterVisible = false;
  }

  onSwitchToRegister() {
    this.showRegister();
  }

  onSwitchToLogin() {
    this.showLogin();
  }
}
