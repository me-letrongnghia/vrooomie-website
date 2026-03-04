import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAPS_CONFIG } from './maps.config';
import * as L from 'leaflet';

interface AddressSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export interface DeliveryInfo {
  address: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
  distance: number;
  deliveryFee: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

@Component({
  selector: 'app-delivery-address-modal',
  standalone: false,
  templateUrl: './delivery-address-modal.component.html',
  styleUrl: './delivery-address-modal.component.css'
})
export class DeliveryAddressModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @Output() deliveryConfirmed = new EventEmitter<DeliveryInfo>();
  @Input() carAddress: string = '';
  @Input() carLatitude?: number;
  @Input() carLongitude?: number;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef;

  deliveryForm: FormGroup = new FormGroup<any>({});
  
  // Map related (Leaflet)
  map: L.Map | null = null;
  mapLoaded = false;
  carMarker: L.Marker | null = null;
  deliveryMarker: L.Marker | null = null;
  radiusCircle: L.Circle | null = null;
  carCoordinates = MAPS_CONFIG.DEFAULT_COORDS;
  
  // Address suggestions
  addressSuggestions: AddressSuggestion[] = [];
  searchTimeout: any;
  
  // Calculation
  calculating = false;
  deliveryError: string | null = null;
  isDeliveryCalculated = false;
  selectedAddress = '';
  calculatedDistance = 0;
  deliveryFee = 0;
  selectedCoordinates = { lat: 0, lng: 0 };
  
  // Constants
  readonly MAX_DELIVERY_DISTANCE = MAPS_CONFIG.MAX_DELIVERY_DISTANCE;
  readonly DELIVERY_RATE = MAPS_CONFIG.DELIVERY_RATE;
  readonly BASE_DELIVERY_FEE = MAPS_CONFIG.BASE_DELIVERY_FEE;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';
    
    // Initialize form
    this.deliveryForm = this.formBuilder.group({
      address: ['', [Validators.required, Validators.minLength(10)]],
      contactName: ['', [Validators.required, Validators.minLength(2)]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      notes: ['']
    });
  }

  ngAfterViewInit(): void {
    // Geocode car address first, then initialize map
    this.geocodeCarAddress().then(() => {
      // Initialize map after geocoding completes
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    });
  }

  ngOnDestroy(): void {
    // Re-enable body scroll when modal closes
    document.body.style.overflow = 'auto';
    
    // Clean up map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // Getters for form controls
  get address() { return this.deliveryForm.get('address'); }
  get contactName() { return this.deliveryForm.get('contactName'); }
  get contactPhone() { return this.deliveryForm.get('contactPhone'); }
  get notes() { return this.deliveryForm.get('notes'); }

  initializeMap(): void {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    const mapElement = this.mapContainer.nativeElement.querySelector('#delivery-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    try {
      // Create Leaflet map
      this.map = L.map(mapElement, {
        center: [this.carCoordinates.lat, this.carCoordinates.lng],
        zoom: MAPS_CONFIG.DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Add OpenStreetMap tile layer
      L.tileLayer(MAPS_CONFIG.TILE_LAYER.url, {
        attribution: MAPS_CONFIG.TILE_LAYER.attribution,
        maxZoom: MAPS_CONFIG.TILE_LAYER.maxZoom
      }).addTo(this.map);

      // Create custom icons
      const carIcon = L.icon({
        iconUrl: MAPS_CONFIG.MARKERS.CAR.iconUrl,
        iconSize: MAPS_CONFIG.MARKERS.CAR.iconSize as [number, number],
        iconAnchor: MAPS_CONFIG.MARKERS.CAR.iconAnchor as [number, number],
        popupAnchor: MAPS_CONFIG.MARKERS.CAR.popupAnchor as [number, number]
      });

      // Add car marker
      this.carMarker = L.marker(
        [this.carCoordinates.lat, this.carCoordinates.lng],
        { icon: carIcon }
      ).addTo(this.map);
      
      // Show car address in popup (or default text)
      const carPopupText = this.carAddress ? `Vị trí xe: ${this.carAddress}` : 'Vị trí xe';
      this.carMarker.bindPopup(carPopupText);

      // Add delivery radius circle
      this.radiusCircle = L.circle(
        [this.carCoordinates.lat, this.carCoordinates.lng],
        {
          radius: this.MAX_DELIVERY_DISTANCE * 1000, // Convert km to meters
          color: '#5fcf86',
          fillColor: '#5fcf86',
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.3
        }
      ).addTo(this.map);

      this.mapLoaded = true;
      
      // Fix map tiles display after a short delay
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);
      
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      this.deliveryError = 'Không thể khởi tạo bản đồ';
    }
  }

  geocodeCarAddress(): Promise<void> {
    return new Promise((resolve) => {
      // If coordinates are provided directly, use them (most accurate!)
      if (this.carLatitude && this.carLongitude) {
        this.carCoordinates = {
          lat: this.carLatitude,
          lng: this.carLongitude
        };
        console.log('Using provided car coordinates:', this.carCoordinates);
        resolve();
        return;
      }

      // Otherwise, try to geocode address
      if (!this.carAddress) {
        console.log('No car address provided, using default coordinates');
        resolve();
        return;
      }
      
      // Use Nominatim API to geocode car address
      const searchQuery = encodeURIComponent(this.carAddress + ', Vietnam');
      console.log('Geocoding car address:', this.carAddress);
      
      fetch(`${MAPS_CONFIG.NOMINATIM_API}/search?format=json&q=${searchQuery}&limit=1`, {
        headers: {
          'User-Agent': 'Vrooomie Car Rental App'
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            this.carCoordinates = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            console.log('Car coordinates found:', this.carCoordinates);
          } else {
            console.log('No coordinates found for address, using default');
          }
          resolve();
        })
        .catch(error => {
          console.error('Error geocoding car address:', error);
          // Use default coordinates
          resolve();
        });
    });
  }

  onAddressChange(event: any): void {
    const query = event.target.value;
    if (query.length < 3) {
      this.addressSuggestions = [];
      return;
    }

    // Clear previous error
    this.deliveryError = null;

    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchAddress(query);
    }, 500);
  }

  searchAddress(query: string): void {
    // Use Nominatim API for address suggestions
    const searchQuery = encodeURIComponent(query + ', Vietnam');
    fetch(`${MAPS_CONFIG.NOMINATIM_API}/search?format=json&q=${searchQuery}&limit=5&addressdetails=1`, {
      headers: {
        'User-Agent': 'Vrooomie Car Rental App'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          this.addressSuggestions = data.map((item: any) => ({
            place_id: item.place_id,
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon
          }));
        } else {
          this.addressSuggestions = [];
        }
      })
      .catch(error => {
        console.error('Error searching address:', error);
        this.addressSuggestions = [];
      });
  }

  selectSuggestion(suggestion: AddressSuggestion): void {
    this.deliveryForm.patchValue({
      address: suggestion.display_name
    });
    this.addressSuggestions = [];

    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Store selected coordinates
    this.selectedCoordinates = { lat, lng };

    // Update or create delivery marker
    if (this.deliveryMarker && this.map) {
      this.deliveryMarker.setLatLng([lat, lng]);
    } else if (this.map) {
      const deliveryIcon = L.icon({
        iconUrl: MAPS_CONFIG.MARKERS.DELIVERY.iconUrl,
        iconSize: MAPS_CONFIG.MARKERS.DELIVERY.iconSize as [number, number],
        iconAnchor: MAPS_CONFIG.MARKERS.DELIVERY.iconAnchor as [number, number],
        popupAnchor: MAPS_CONFIG.MARKERS.DELIVERY.popupAnchor as [number, number]
      });

      this.deliveryMarker = L.marker([lat, lng], { icon: deliveryIcon }).addTo(this.map);
      this.deliveryMarker.bindPopup('Địa chỉ giao xe');
    }

    // Fit map to show both markers
    if (this.map && this.carMarker && this.deliveryMarker) {
      const bounds = L.latLngBounds([
        this.carMarker.getLatLng(),
        this.deliveryMarker.getLatLng()
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  calculateDelivery(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryError = 'Vui lòng điền đầy đủ thông tin';
      return;
    }

    this.calculating = true;
    this.deliveryError = null;

    setTimeout(() => {
      // Get coordinates from selected location or geocode address
      this.geocodeAddress(this.deliveryForm.get('address')?.value).then((coordinates) => {
        if (coordinates) {
          // Calculate distance
          const distance = this.calculateDistance(
            this.carCoordinates.lat,
            this.carCoordinates.lng,
            coordinates.lat,
            coordinates.lng
          );

          // Check if within delivery radius
          if (distance > this.MAX_DELIVERY_DISTANCE) {
            this.deliveryError = `Địa chỉ giao xe vượt quá bán kính ${this.MAX_DELIVERY_DISTANCE}km cho phép. Khoảng cách: ${distance}km`;
            this.calculating = false;
            return;
          }

          // Calculate delivery fee
          const deliveryFee = this.BASE_DELIVERY_FEE + (distance * this.DELIVERY_RATE);

          // Store calculation results
          this.selectedAddress = this.deliveryForm.get('address')?.value;
          this.calculatedDistance = distance;
          this.deliveryFee = deliveryFee;
          this.selectedCoordinates = coordinates;
          this.isDeliveryCalculated = true;
          this.calculating = false;

        } else {
          this.deliveryError = 'Không thể xác định vị trí địa chỉ. Vui lòng thử lại.';
          this.calculating = false;
        }
      }).catch(() => {
        this.deliveryError = 'Có lỗi xảy ra khi tính toán. Vui lòng thử lại.';
        this.calculating = false;
      });
    }, 1000);
  }

  async geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
    // If we have selected coordinates, use them
    if (this.selectedCoordinates.lat !== 0 && this.selectedCoordinates.lng !== 0) {
      return this.selectedCoordinates;
    }

    // Otherwise, geocode the address using Nominatim
    try {
      const searchQuery = encodeURIComponent(address + ', Vietnam');
      const response = await fetch(`${MAPS_CONFIG.NOMINATIM_API}/search?format=json&q=${searchQuery}&limit=1`, {
        headers: {
          'User-Agent': 'Vrooomie Car Rental App'
        }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  goBackToForm(): void {
    this.isDeliveryCalculated = false;
  }

  confirmDelivery(): void {
    const deliveryInfo: DeliveryInfo = {
      address: this.selectedAddress,
      contactName: this.deliveryForm.get('contactName')?.value,
      contactPhone: this.deliveryForm.get('contactPhone')?.value,
      notes: this.deliveryForm.get('notes')?.value,
      distance: this.calculatedDistance,
      deliveryFee: this.deliveryFee,
      coordinates: this.selectedCoordinates
    };

    this.deliveryConfirmed.emit(deliveryInfo);
    this.onClose();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price);
  }

  onClose(): void {
    this.close.emit();
  }
}
