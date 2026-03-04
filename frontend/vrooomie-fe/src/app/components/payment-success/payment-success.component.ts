import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: false,
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
  
  loading = true;
  paymentVerified = false;
  bookingId: string | null = null;
  orderCode: string | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    // Get order code from query params
    this.route.queryParams.subscribe(params => {
      this.orderCode = params['orderCode'];
      
      if (this.orderCode) {
        this.verifyPayment(this.orderCode);
      } else {
        this.error = 'Không tìm thấy thông tin thanh toán';
        this.loading = false;
      }
    });

    // Get pending booking ID from localStorage
    this.bookingId = localStorage.getItem('pendingBookingId');
  }

  verifyPayment(orderCode: string): void {
    this.paymentService.verifyPayment(orderCode).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.payment.status === 'SUCCESS') {
          this.paymentVerified = true;
          // Clear pending booking
          localStorage.removeItem('pendingBookingId');
        } else {
          this.error = 'Thanh toán chưa được xác nhận. Vui lòng kiểm tra lại.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Không thể xác minh thanh toán: ' + (error.error?.error || error.message);
        console.error('Payment verification error:', error);
      }
    });
  }

  goToMyTrips(): void {
    this.router.navigate(['/my-trips']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
