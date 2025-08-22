import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';

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
  isAuthLoading = true;
  currentUser: any = null;

  constructor(private authService: AuthService, public loadingService: LoadingService) {
    this.isAuthLoading = this.authService.isAuthLoading();
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  ngOnInit() {
    // Subscribe to authentication loading state
    this.authService.authLoading$.subscribe(isLoading => {
      this.isAuthLoading = isLoading;
    });

    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
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
