import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // This is the URL of the backend API
  private authUrl = environment.baseUrl + '/auth'

  // Observable for authentication status
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Observable for current user
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private httpClient: HttpClient, private router: Router) {
    // Check if user is already logged in on app startup
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
    
    // Only run in browser environment
    if (this.isBrowser()) {
      try {
        const user = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');

        // Check if token is expired
        if (this.isTokenExpired(token || '')) {
          this.clearAuthState();
          return;
        }
        
        console.log('Checking existing login:', { user, token }); // Debug log

        if (user && token) {
          const parsedUser = JSON.parse(user);
          console.log('Restoring user session:', parsedUser); // Debug log
          this.currentUserSubject.next(parsedUser);
          this.isAuthenticatedSubject.next(true);
        } else {
          console.log('No existing session found'); // Debug log
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        this.clearAuthState();
      }
    }
  }

  // Clear authentication state
  private clearAuthState() {
    if (this.isBrowser()) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // Login method
  login(loginRequest: any): Observable<any> {
    return this.httpClient.post(`${this.authUrl}/login`, loginRequest)
      .pipe(
        tap((response: any) => {

          // Handle successful login response
          if (response) {

            console.log('Login response:', response); // Debug log

            // Save user info and token to localStorage (only in browser)
            if (this.isBrowser()) {
              localStorage.setItem('currentUser', JSON.stringify(response));
              localStorage.setItem('token', response.token || 'dummy-token');
            }

            // Update subjects
            this.currentUserSubject.next(response);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  // Register method
  register(registerRequest: any): Observable<any> {
    return this.httpClient.post(`${this.authUrl}/register`, registerRequest);
  }

  // Logout method
  logout() {
    console.log('Logging out user'); // Debug log
    this.clearAuthState();
  }

  // Get current user
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
