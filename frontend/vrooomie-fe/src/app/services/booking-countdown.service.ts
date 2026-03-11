import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CountdownInfo {
  hoursRemaining: number;
  minutesRemaining: number;
  totalMinutes: number;
  isExpired: boolean;
  percentageRemaining: number;
  statusClass: string; // 'safe' | 'warning' | 'danger' | 'expired'
  statusText: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingCountdownService {

  constructor() { }

  /**
   * Tính toán thời gian còn lại cho booking PENDING
   * @param createdAt ISO 8601 timestamp
   * @param reminderSent Đã gửi reminder chưa
   * @param warningSent Đã gửi warning chưa
   * @returns CountdownInfo
   */
  calculateCountdown(createdAt: string, reminderSent?: boolean, warningSent?: boolean): CountdownInfo {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    const TOTAL_HOURS = 24;
    const hoursRemaining = Math.max(0, TOTAL_HOURS - hoursSinceCreated);
    const totalMinutes = Math.floor(hoursRemaining * 60);
    const hours = Math.floor(hoursRemaining);
    const minutes = Math.floor((hoursRemaining - hours) * 60);
    
    const percentageRemaining = (hoursRemaining / TOTAL_HOURS) * 100;
    
    let statusClass: string;
    let statusText: string;
    
    if (hoursRemaining <= 0) {
      statusClass = 'expired';
      statusText = 'Đã hết hạn';
    } else if (hoursRemaining <= 6) {
      statusClass = 'danger';
      statusText = 'SẮP HẾT HẠN';
    } else if (hoursRemaining <= 12) {
      statusClass = 'warning';
      statusText = 'Còn ít thời gian';
    } else {
      statusClass = 'safe';
      statusText = 'Đang chờ xác nhận';
    }
    
    return {
      hoursRemaining: hours,
      minutesRemaining: minutes,
      totalMinutes,
      isExpired: hoursRemaining <= 0,
      percentageRemaining,
      statusClass,
      statusText
    };
  }

  /**
   * Observable để theo dõi countdown real-time
   * Update mỗi 1 phút
   */
  getCountdownObservable(createdAt: string, reminderSent?: boolean, warningSent?: boolean) {
    return interval(60000).pipe( // Update every minute
      map(() => this.calculateCountdown(createdAt, reminderSent, warningSent))
    );
  }

  /**
   * Format thời gian còn lại thành text
   */
  formatTimeRemaining(countdown: CountdownInfo): string {
    if (countdown.isExpired) {
      return 'Đã hết hạn (tự động hủy)';
    }
    
    const { hoursRemaining, minutesRemaining } = countdown;
    
    if (hoursRemaining > 0) {
      return `Còn ${hoursRemaining} giờ ${minutesRemaining} phút`;
    } else {
      return `Còn ${minutesRemaining} phút`;
    }
  }
}
