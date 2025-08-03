import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, finalize, Observable, switchMap, tap } from 'rxjs';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // This is the URL of the backend API
  private authUrl = environment.baseUrl + '/auth'

  // Observable for authentication status
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Observable for authentication loading state
  private authLoadingSubject = new BehaviorSubject<boolean>(true);
  authLoading$ = this.authLoadingSubject.asObservable();

  // Observable for current user
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private httpNoInterceptor: HttpClient;

  constructor(
    private loadingService: LoadingService,
    private httpClient: HttpClient,
    private router: Router,
    private httpBackend: HttpBackend // Thêm dòng này
  ) {
    this.httpNoInterceptor = new HttpClient(httpBackend); // Tạo instance không qua interceptor
    this.checkExistingLogin();
  }

  // Helper method to check if running in browser
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Helper method to check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return true; // No exp means expired
      const now = Date.now().valueOf() / 1000; // Convert to seconds
      return decoded.exp < now;
    } catch (e) {
      return true; // Token error also means expired
    }
  }

  // Check existing login on app startup
  private checkExistingLogin() {
    // Set loading to true
    this.authLoadingSubject.next(true);

    // Only run in browser environment
    if (this.isBrowser()) {
      try {
        const user = localStorage.getItem('currentUser');
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Check if access token is expired
        if (this.isTokenExpired(accessToken || '')) {
          // If refresh token is also expired, clear auth state
          if (this.isTokenExpired(refreshToken || '')) {
            this.clearAuthState();
            return;
          }

          // Refresh access token using refresh token
          this.refreshAccessToken(refreshToken).subscribe({
            next: (response: any) => {
              // Save new access token to localStorage (expecting backend returns accessToken)
              localStorage.setItem('accessToken', response.accessToken || 'dummy-token');
              // If backend returns user info, update user state
              if (response) {
                localStorage.setItem('currentUser', JSON.stringify(response));
                this.currentUserSubject.next(response);
              }
              this.isAuthenticatedSubject.next(true);
              this.authLoadingSubject.next(false); // Complete loading
            },
            error: (error: any) => {
              console.error('Error refreshing access token:', error); // Debug log
              this.clearAuthState();
            }
          });
          return; // Exit early since we're handling async refresh
        }

        console.log('Checking existing login:', { user, accessToken, refreshToken }); // Debug log

        if (user && accessToken && refreshToken) {
          const parsedUser = JSON.parse(user);
          console.log('Restoring user session:', parsedUser); // Debug log
          this.currentUserSubject.next(parsedUser);
          this.isAuthenticatedSubject.next(true);
        } else {
          console.log('No existing session found'); // Debug log
          // Explicitly set to false if no session found
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        this.clearAuthState();
      }

      // Complete loading
      this.authLoadingSubject.next(false);
    };
  }

  // Refresh access token method
  refreshAccessToken(refreshToken: string | null): Observable<any> {
    // Dùng httpNoInterceptor để tránh vòng lặp
    return this.httpNoInterceptor.post(`${this.authUrl}/refresh`, { refreshToken });
  }

  // Clear authentication state
  clearAuthState() {
    if (this.isBrowser()) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.authLoadingSubject.next(false); // Complete loading
  }

  // Login method
  login(loginRequest: any): Observable<any> {
    // Show loader
    this.loadingService.show();

    // Send login request
    return this.httpClient.post(`${this.authUrl}/login`, loginRequest)
      .pipe(
        tap((response: any) => {

          // Handle successful login response
          if (response) {

            console.log('Login response:', response); // Debug log

            // Save user info and token to localStorage (only in browser)
            if (this.isBrowser()) {
              localStorage.setItem('currentUser', JSON.stringify(response));
              localStorage.setItem('accessToken', response.accessToken || 'dummy-token');
              localStorage.setItem('refreshToken', response.refreshToken || 'dummy-token');
            }

            // Update subjects
            this.currentUserSubject.next(response);
            this.isAuthenticatedSubject.next(true);
          }
        }),

        // Hide loader
        finalize(() => {
          this.loadingService.hide();
        })
      );
  }

  // Register method
  register(registerRequest: any): Observable<any> {

    // Show loader
    this.loadingService.show();

    // Send register request
    return this.httpClient.post(`${this.authUrl}/register`, registerRequest)
      .pipe(

        // Hide loader
        finalize(() => {
          this.loadingService.hide();
        })
      );
  }

  // Logout method
  logout() {
    console.log('Logging out user'); // Debug log
    this.clearAuthState();
  }

  // Get access token
  getAccessToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  // Get refresh token
  getRefreshToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  // Save access token
  saveAccessToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('accessToken', token);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Check if auth is loading
  isAuthLoading(): boolean {
    return this.authLoadingSubject.value;
  }
}