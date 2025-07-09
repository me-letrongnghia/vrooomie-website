import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'vrooomie-fe';
  
  isLoginVisible = false;
  isRegisterVisible = false;
  isAuthenticated = false;
  currentUser: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('Authentication state changed:', isAuth); // Debug log
      this.isAuthenticated = isAuth;
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      console.log('Current user changed:', user); // Debug log
      this.currentUser = user;
    });
  }

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
