import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class OAuth2Service {
  private oauth2Url = environment.baseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  loginWithGoogle() {
    // Store current URL for redirect after login
    const currentUrl = this.router.url;
    if (currentUrl && currentUrl !== '/login' && currentUrl !== '/register') {
      localStorage.setItem('redirectUrl', currentUrl);
    }
    // Use Spring Security OAuth2 endpoint - it should redirect directly to Google
    window.location.href = `${this.oauth2Url}/oauth2/authorization/google`;
  }

  loginWithFacebook() {
    // Store current URL for redirect after login  
    const currentUrl = this.router.url;
    if (currentUrl && currentUrl !== '/login' && currentUrl !== '/register') {
      localStorage.setItem('redirectUrl', currentUrl);
    }
    
    window.location.href = `${this.oauth2Url}/oauth2/authorization/facebook`;
  }
}

