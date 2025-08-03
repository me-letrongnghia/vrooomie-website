import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingRequest {
  carId: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export interface BookingResponse {
  id: number;
  carId: number;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.baseUrl}/bookings`;

  constructor(private http: HttpClient) { }

  // Create a new booking
  createBooking(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, request);
  }

  // Get all bookings of the current user
  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/my`);
  }

  // Confirm a booking (only for owner)
  confirmBooking(bookingId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${bookingId}/confirm`, {});
  }

  // Cancel a booking (only for owner)
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${bookingId}/cancel`, {});
  }

  // Get bookings for the owner's car
  getOwnerBookings(status?: string): Observable<BookingResponse[]> {
    const url = status ? `${this.apiUrl}/owner?status=${status}` : `${this.apiUrl}/owner`;
    return this.http.get<BookingResponse[]>(url);
  }

  // Get all bookings for a specific car (to check availability)
  getCarBookings(carId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/car/${carId}`);
  }
}