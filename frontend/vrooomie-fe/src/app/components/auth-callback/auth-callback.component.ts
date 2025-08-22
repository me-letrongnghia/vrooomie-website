import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  isLoading = true;
  isBrowser = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const { accessToken, refreshToken, error } = params;
      if (error) {
        this.router.navigate(['/'], { queryParams: { error: error || 'Đăng nhập thất bại' } });
        return;
      }

      if (accessToken && refreshToken) {
        // Handle OAuth2 login completion properly with both tokens
        this.authService.handleOAuth2LoginSuccess(accessToken, refreshToken).subscribe({
          next: () => {
            if (this.isBrowser) {
              const redirectUrl = localStorage.getItem('redirectUrl') || '/';
              localStorage.removeItem('redirectUrl');
              this.isLoading = false;
              this.router.navigate([redirectUrl]);
            }
          },
          error: () => this.handleError()
        });
      }
      else this.handleError();
    });
  }

  private handleError(message: string = 'Đăng nhập thất bại') {
    this.isLoading = false;
    this.router.navigate(['/'], { queryParams: { error: message } });
  }
}
