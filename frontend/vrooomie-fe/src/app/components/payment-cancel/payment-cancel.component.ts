import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-cancel',
  standalone: false,
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.css'
})
export class PaymentCancelComponent implements OnInit {
  
  orderCode: string | null = null;
  bookingId: string | null = null;
  verifying: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    // Get order code from query params
    this.route.queryParams.subscribe(params => {
      this.orderCode = params['orderCode'];
      
      // Verify payment status with backend when orderCode is available
      if (this.orderCode) {
        this.verifyPaymentStatus(this.orderCode);
      }
    });

    // Get pending booking ID from localStorage
    this.bookingId = localStorage.getItem('pendingBookingId');
  }

  /**
   * Verify payment status with backend
   * Backend will check PayOS and auto-cancel booking if payment is cancelled
   */
  verifyPaymentStatus(orderCode: string): void {
    this.verifying = true;
    
    this.paymentService.verifyPayment(orderCode).subscribe({
      next: (response) => {
        console.log('Payment verified:', response);
        // Payment status updated in database
        // If cancelled, booking will be auto-cancelled by backend
        this.verifying = false;
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.verifying = false;
      }
    });
  }

  tryAgain(): void {
    // Go back to car detail page
    this.router.navigate(['/cars']);
  }

  goHome(): void {
    // Clear pending booking
    localStorage.removeItem('pendingBookingId');
    this.router.navigate(['/']);
  }
}
