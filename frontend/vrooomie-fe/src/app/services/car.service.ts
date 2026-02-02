import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car } from '../models/car.interface';
import { environment } from '../../environments/environment';

export interface CarCreateRequest {
  brand: string;
  model: string;
  licensePlate: string;
  type: string;
  pricePerDay: number;
  imageUrl: string;
  address: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = `${environment.baseUrl}/cars`;

  constructor(private http: HttpClient) { }

  getAllCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  getCarById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`);
  }

  getCarsByOwnerId(ownerId: number): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/owner/${ownerId}`);
  }

  createCar(carData: CarCreateRequest): Observable<Car> {
    return this.http.post<Car>(`${this.apiUrl}/create`, carData);
  }

  updateCar(id: number, carData: Car): Observable<Car> {
    return this.http.put<Car>(`${this.apiUrl}/${id}`, carData);
  }

  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 