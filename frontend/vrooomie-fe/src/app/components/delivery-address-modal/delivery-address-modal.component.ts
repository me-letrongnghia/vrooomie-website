import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAPS_CONFIG, loadGoogleMapsAPI } from './maps.config';

declare var google: any;

interface AddressSuggestion {
  place_id: string;
  description: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
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
export class DeliveryAddressModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() deliveryConfirmed = new EventEmitter<DeliveryInfo>();
  @Input() carAddress: string = '';
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef;

  deliveryForm: FormGroup = new FormGroup<any>({});
  
  // Map related
  map: any;
  mapLoaded = false;
  carMarker: any;
  deliveryMarker: any;
  radiusCircle: any;
  carCoordinates = MAPS_CONFIG.DEFAULT_COORDS;
  
  // Address suggestions
  autocompleteService: any;
  placesService: any;
  addressSuggestions: AddressSuggestion[] = [];
  
  // Calculation
  calculating = false;
  deliveryError: string | null = null;
  isDeliveryCalculated = false;
  selectedAddress = '';
  calculatedDistance = 0;
  deliveryFee = 0;
  
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
    
    // Load Google Maps
    this.loadGoogleMaps();
    
    // Parse car address to get coordinates if possible
    this.geocodeCarAddress();
  }

  ngOnDestroy(): void {
    // Re-enable body scroll when modal closes
    document.body.style.overflow = 'auto';
  }

  // Getters for form controls
  get address() { return this.deliveryForm.get('address'); }
  get contactName() { return this.deliveryForm.get('contactName'); }
  get contactPhone() { return this.deliveryForm.get('contactPhone'); }
  get notes() { return this.deliveryForm.get('notes'); }

  loadGoogleMaps(): void {
    loadGoogleMapsAPI()
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        this.deliveryError = 'Không thể tải bản đồ. Vui lòng thử lại sau.';
      });
  }

  initializeMap(): void {
    setTimeout(() => {
      if (this.mapContainer && this.mapContainer.nativeElement) {
        this.map = new google.maps.Map(this.mapContainer.nativeElement.querySelector('#delivery-map'), {
          center: this.carCoordinates,
          zoom: MAPS_CONFIG.DEFAULT_ZOOM,
          ...MAPS_CONFIG.MAP_OPTIONS
        });

        // Initialize services
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(this.map);

        // Add car marker
        this.carMarker = new google.maps.Marker({
          position: this.carCoordinates,
          map: this.map,
          title: 'Vị trí xe',
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc3545" width="32" height="32">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
          }
        });

        // Add delivery radius circle
        this.radiusCircle = new google.maps.Circle({
          map: this.map,
          center: this.carCoordinates,
          radius: this.MAX_DELIVERY_DISTANCE * 1000, // Convert km to meters
          fillColor: '#5fcf86',
          fillOpacity: 0.1,
          strokeColor: '#5fcf86',
          strokeOpacity: 0.3,
          strokeWeight: 2
        });

        this.mapLoaded = true;
      }
    }, 100);
  }

  geocodeCarAddress(): void {
    if (!this.carAddress) return;
    
    // This is a simple implementation. In production, you'd use Google Geocoding API
    // For now, we'll use default coordinates
    this.carCoordinates = MAPS_CONFIG.DEFAULT_COORDS;
  }

  onAddressChange(event: any): void {
    const query = event.target.value;
    if (query.length < 3) {
      this.addressSuggestions = [];
      return;
    }

    // Clear previous error
    this.deliveryError = null;

    // Get address suggestions
    if (this.autocompleteService) {
      this.autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'vn' }, // Restrict to Vietnam
          types: ['address']
        },
        (predictions: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            this.addressSuggestions = predictions.slice(0, 5).map(prediction => ({
              place_id: prediction.place_id,
              description: prediction.description
            }));
          } else {
            this.addressSuggestions = [];
          }
        }
      );
    }
  }

  selectSuggestion(suggestion: AddressSuggestion): void {
    this.deliveryForm.patchValue({
      address: suggestion.description
    });
    this.addressSuggestions = [];

    // Get detailed place information
    if (this.placesService) {
      this.placesService.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['geometry', 'formatted_address']
        },
        (place: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const location = place.geometry.location;
            
            // Update or create delivery marker
            if (this.deliveryMarker) {
              this.deliveryMarker.setPosition(location);
            } else {
              this.deliveryMarker = new google.maps.Marker({
                position: location,
                map: this.map,
                title: 'Địa chỉ giao xe',
                icon: {
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5fcf86" width="32" height="32">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 32)
                }
              });
            }

            // Center map to show both markers
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(this.carCoordinates);
            bounds.extend(location);
            this.map.fitBounds(bounds);
            
            // Store coordinates for calculation
            suggestion.geometry = {
              location: {
                lat: location.lat(),
                lng: location.lng()
              }
            };
          }
        }
      );
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

    // Simulate API call delay
    setTimeout(() => {
      // Get coordinates from selected suggestion or geocode address
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
    }, 1500); // Simulate processing time
  }

  async geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
    return new Promise((resolve) => {
      if (this.deliveryMarker) {
        // Use coordinates from marker if available
        const position = this.deliveryMarker.getPosition();
        resolve({
          lat: position.lat(),
          lng: position.lng()
        });
      } else {
        // Geocode the address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: address + ', Vietnam' },
          (results: any[], status: any) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
              const location = results[0].geometry.location;
              resolve({
                lat: location.lat(),
                lng: location.lng()
              });
            } else {
              resolve(null);
            }
          }
        );
      }
    });
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
      coordinates: {
        lat: this.deliveryMarker?.getPosition()?.lat() || 0,
        lng: this.deliveryMarker?.getPosition()?.lng() || 0
      }
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
