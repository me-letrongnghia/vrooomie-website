# Delivery Address Modal Component

Thành phần modal cho phép người dùng chọn địa chỉ giao xe tận nơi với tích hợp Google Maps.

## Tính năng

- **Layout responsive**: Bên trái hiển thị bản đồ, bên phải là form nhập thông tin
- **Google Maps tích hợp**: Hiển thị bản đồ với vị trí xe và bán kính giao xe 10km
- **Tự động hoàn thành địa chỉ**: Sử dụng Google Places API
- **Tính phí tự động**: 100.000đ cơ bản + 20.000đ/km
- **Validation**: Kiểm tra địa chỉ trong phạm vi 10km

## Cài đặt Google Maps API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật các API sau:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Tạo API key và hạn chế domain
5. Cập nhật API key trong `maps.config.ts`:

```typescript
export const MAPS_CONFIG = {
  API_KEY: 'YOUR_ACTUAL_GOOGLE_MAPS_API_KEY',
  // ... other config
};
```

## Sử dụng Component

```html
<app-delivery-address-modal 
    *ngIf="showDeliveryModal"
    [carAddress]="car?.address || ''"
    (close)="onDeliveryModalClose()"
    (deliveryConfirmed)="onDeliveryConfirmed($event)">
</app-delivery-address-modal>
```

## Input Properties

- `carAddress: string` - Địa chỉ của xe (để tính khoảng cách)

## Output Events

- `close: void` - Khi đóng modal
- `deliveryConfirmed: DeliveryInfo` - Khi xác nhận thông tin giao xe

## DeliveryInfo Interface

```typescript
interface DeliveryInfo {
  address: string;           // Địa chỉ giao xe
  contactName: string;       // Tên người nhận
  contactPhone: string;      // Số điện thoại
  notes?: string;           // Ghi chú (tùy chọn)
  distance: number;         // Khoảng cách (km)
  deliveryFee: number;      // Phí giao xe (VND)
  coordinates: {            // Tọa độ địa chỉ giao xe
    lat: number;
    lng: number;
  };
}
```

## Cấu hình

Tất cả cấu hình được quản lý trong `maps.config.ts`:

```typescript
export const MAPS_CONFIG = {
  API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
  MAX_DELIVERY_DISTANCE: 10,    // 10km radius
  DELIVERY_RATE: 20000,         // 20,000 VND per km
  BASE_DELIVERY_FEE: 100000,    // 100,000 VND base fee
  DEFAULT_ZOOM: 13,
  // ... other options
};
```

## Styling

Component sử dụng CSS tùy chỉnh với thiết kế responsive:
- Desktop: Layout 2 cột (map + form)
- Mobile: Layout 1 cột (map trên, form dưới)

## Lưu ý bảo mật

- Luôn hạn chế API key theo domain
- Không commit API key vào repository
- Sử dụng environment variables cho production
- Xem xét sử dụng server-side proxy cho API calls

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Yêu cầu JavaScript enabled và hỗ trợ ES6+.
