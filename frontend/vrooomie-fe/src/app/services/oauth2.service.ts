import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class OAuth2Service {

  private oauth2Url = environment.oauth2Url;

  constructor(private router: Router) {}

  loginWithGoogle() {
    this.saveRedirectUrl();
    window.location.href = `${this.oauth2Url}/google`;
  }

  loginWithFacebook() {
    this.saveRedirectUrl();
    window.location.href = `${this.oauth2Url}/facebook`;
  }

  private saveRedirectUrl() {
    const currentUrl = this.router.url;
    if (currentUrl && currentUrl !== '/login' && currentUrl !== '/register') {
      localStorage.setItem('redirectUrl', currentUrl);
    }
  }
}

