// Google Maps Configuration
export const MAPS_CONFIG = {
  // Replace with your actual Google Maps API key
  // Get one from: https://developers.google.com/maps/gmp-get-started
  API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Default coordinates for Ho Chi Minh City center
  DEFAULT_COORDS: {
    lat: 10.8231,
    lng: 106.6297
  },
  
  // Delivery settings
  MAX_DELIVERY_DISTANCE: 10, // 10km radius
  DELIVERY_RATE: 20000, // 20,000 VND per km
  BASE_DELIVERY_FEE: 100000, // 100,000 VND base fee
  
  // Map configuration
  DEFAULT_ZOOM: 13,
  MAP_OPTIONS: {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    scrollWheel: true
  }
};

// Helper function to load Google Maps API
export function loadGoogleMapsAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (typeof (window as any).google !== 'undefined' && (window as any).google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for the existing script to load
      const checkGoogleMaps = () => {
        if (typeof (window as any).google !== 'undefined' && (window as any).google.maps) {
          resolve();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
      return;
    }

    // Create and load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));

    document.head.appendChild(script);
  });
}
