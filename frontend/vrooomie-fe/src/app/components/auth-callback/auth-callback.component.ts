import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];
      const error = params['error'];

      console.log('OAuth2 callback received:', { accessToken, refreshToken, error });

      if (accessToken) {
        console.log('OAuth2 callback received tokens:', { accessToken, refreshToken });
        
        // Handle OAuth2 login completion properly with both tokens
        this.authService.handleOAuth2LoginSuccess(accessToken, refreshToken).subscribe({
          next: (response) => {
            console.log('OAuth2 login processed successfully:', response);
            this.isLoading = false;
            
            // Force check authentication state after OAuth2 completion
            setTimeout(() => {
              console.log('Final auth check - Authenticated:', this.authService.isAuthenticated());
              console.log('Final auth check - Current user:', this.authService.getCurrentUser());
            }, 100);
            
            // Navigate to redirect URL or home with minimal delay
            setTimeout(() => {
              let redirectUrl = '/';
              if (isPlatformBrowser(this.platformId)) {
                redirectUrl = localStorage.getItem('redirectUrl') || '/';
                localStorage.removeItem('redirectUrl');
              }
              this.router.navigate([redirectUrl]);
            }, 200);
          },
          error: (error) => {
            console.error('Error processing OAuth2 login:', error);
            this.isLoading = false;
            // If API call fails, try to proceed anyway (fallback will handle it)
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 200);
          }
        });
      } else if (error) {
        console.error('OAuth2 Error:', error);
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { error: error || 'Đăng nhập thất bại' } 
          });
        }, 200);
      } else {
        console.warn('OAuth2 callback with no tokens or error');
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 200);
      }
    });
  }
}
