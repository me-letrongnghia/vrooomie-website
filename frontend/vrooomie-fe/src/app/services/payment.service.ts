import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Payment {
  id: number;
  bookingId: number;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING' | 'REFUND';
  paymentMethod: 'PAYOS' | 'CASH' | 'BANK_TRANSFER';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  orderCode: string;
  transactionId?: string;
  description: string;
  paymentUrl?: string;
  paidAt?: string;
  expiredAt?: string;
  createdAt: string;
}

export interface PaymentRequest {
  bookingId: number;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING';
  paymentMethod: 'PAYOS' | 'CASH';
  amount: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  
  private apiUrl = `${environment.baseUrl}/payments`;

  constructor(private http: HttpClient) { }

  /**
   * Create a payment and get payment URL
   */
  createPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, request);
  }

  /**
   * Get payments by booking ID
   */
  getPaymentsByBookingId(bookingId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/booking/${bookingId}`);
  }

  /**
   * Get payment by order code
   */
  getPaymentByOrderCode(orderCode: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/order/${orderCode}`);
  }

  /**
   * Verify payment status
   */
  verifyPayment(orderCode: string): Observable<{success: boolean, payment: Payment}> {
    return this.http.get<{success: boolean, payment: Payment}>(`${this.apiUrl}/${orderCode}/verify`);
  }

  /**
   * Cancel payment
   */
  cancelPayment(orderCode: string): Observable<{success: boolean, message: string, payment: Payment}> {
    return this.http.post<{success: boolean, message: string, payment: Payment}>(
      `${this.apiUrl}/${orderCode}/cancel`, 
      {}
    );
  }

  /**
   * Calculate deposit amount (30% of total)
   */
  calculateDepositAmount(totalAmount: number): number {
    return Math.round(totalAmount * 0.3);
  }

  /**
   * Calculate remaining amount (70% of total)
   */
  calculateRemainingAmount(totalAmount: number): number {
    return Math.round(totalAmount * 0.7);
  }

  /**
   * Redirect to payment URL
   */
  redirectToPayment(paymentUrl: string): void {
    window.location.href = paymentUrl;
  }
}
