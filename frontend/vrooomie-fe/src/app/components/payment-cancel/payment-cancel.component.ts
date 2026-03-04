import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: false,
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.css'
})
export class PaymentCancelComponent implements OnInit {
  
  orderCode: string | null = null;
  bookingId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get order code from query params
    this.route.queryParams.subscribe(params => {
      this.orderCode = params['orderCode'];
    });

    // Get pending booking ID from localStorage
    this.bookingId = localStorage.getItem('pendingBookingId');
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
