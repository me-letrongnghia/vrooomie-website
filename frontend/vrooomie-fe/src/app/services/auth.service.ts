import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // This is the URL of the backend API
  private authUrl = environment.baseUrl + '/auth'
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private httpClient: HttpClient, private router: Router) { }

  // Login method
  login(loginRequest: any): Observable<any> {
    return this.httpClient.post(`${this.authUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  // Register method
  register(registerRequest: any): Observable<any> {
    return this.httpClient.post(`${this.authUrl}/register`, registerRequest);
  }
}
