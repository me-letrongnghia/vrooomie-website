import { Component, OnInit } from '@angular/core';
import { Car } from '../../models/car.interface';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-car-list',
  standalone: false,
  templateUrl: './car-list.component.html',
  styleUrl: './car-list.component.css'
})
export class CarListComponent implements OnInit {
  cars: Car[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading = true;
    this.error = null;
    
    this.carService.getAllCars().subscribe({
      next: (data) => {
        this.cars = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching cars:', error);
        this.error = 'Failed to load cars. Please try again later.';
        this.loading = false;
      }
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Có sẵn';
      case 'BOOKED': return 'Đã thuê';
      case 'UNAVAILABLE': return 'Bảo trì';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'BOOKED': return 'status-rented';
      case 'UNAVAILABLE': return 'status-maintenance';
      default: return 'status-unknown';
    }
  }
}
