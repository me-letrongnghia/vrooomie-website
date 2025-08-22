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

        // For regular login: require user, accessToken, and refreshToken
        // For OAuth2 login: user and accessToken are sufficient
        if (user && accessToken) {
          const parsedUser = JSON.parse(user);
          console.log('Restoring user session:', parsedUser); // Debug log
          this.currentUserSubject.next(parsedUser);
          this.isAuthenticatedSubject.next(true);

          // Log whether this is OAuth2 or regular login
          if (refreshToken) {
            console.log('Regular login session restored');
          } else {
            console.log('OAuth2 login session restored (no refresh token)');
          }
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

  // Handle OAuth2 login completion
  handleOAuth2LoginSuccess(accessToken: string, refreshToken?: string): Observable<any> {
    console.log('Handling OAuth2 login success with tokens:', { accessToken, refreshToken });

    // Save both tokens SYNCHRONOUSLY to ensure they're available for interceptor
    if (this.isBrowser()) {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      console.log('Tokens saved to localStorage successfully');
    }

    // Small delay to ensure localStorage is fully written before API call
    return new Observable(observer => {
      setTimeout(() => {
        // Get user details from backend using the access token
        // The auth interceptor will automatically add the token to Authorization header
        this.getUserDetail().subscribe({
          next: (userResponse: any) => {
            console.log('OAuth2 user details received from API:', userResponse);

            if (this.isBrowser()) {
              // Save user info to localStorage
              localStorage.setItem('currentUser', JSON.stringify(userResponse));
              
              // Update authentication state
              this.currentUserSubject.next(userResponse);
              this.isAuthenticatedSubject.next(true);
              this.authLoadingSubject.next(false);
            }
            
            observer.next(userResponse);
            observer.complete();
          },
          error: (error) => {
            console.error('Error getting OAuth2 user details from API:', error);
            console.log('Falling back to token-based authentication');
            
            // Only proceed if in browser
            if (this.isBrowser()) {
              // If getUserDetail fails, try to extract user info from token
              this.handleOAuth2TokenOnly(accessToken, refreshToken);
            }
            
            observer.next({ message: 'OAuth2 completed via fallback' });
            observer.complete();
          }
        });
      }, 200); // 200ms delay to ensure localStorage is written
    });
  }

  // Fallback method to handle OAuth2 with token only
  private handleOAuth2TokenOnly(accessToken: string, refreshToken?: string): void {
    console.log('Handling OAuth2 with token only (fallback)');

    try {
      // Decode JWT to get basic user info
      const decoded: any = jwtDecode(accessToken);
      console.log('Decoded token:', decoded);

      // Create minimal user object from token claims
      const user = {
        email: decoded.sub || decoded.email,
        fullName: decoded.name || decoded.fullName || 'OAuth2 User',
        // Add other fields as available in your JWT
      };

      if (this.isBrowser()) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Save refresh token if provided
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }

      // Update authentication state (only in browser)
      if (this.isBrowser()) {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.authLoadingSubject.next(false);
        console.log('OAuth2 authentication state updated successfully');
      }
    } catch (error) {
      console.error('Error decoding OAuth2 token:', error);
      // If all else fails, clear auth state
      if (this.isBrowser()) {
        this.clearAuthState();
      }
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Get user detail
  getUserDetail() {
    return this.httpClient.get(`${this.authUrl}/me`);
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