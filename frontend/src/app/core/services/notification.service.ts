import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/notifications`;

  getNotifications(unreadOnly = false): Observable<ApiResponse<AppNotification[]>> {
    const params = new HttpParams().set('unreadOnly', unreadOnly ? 'true' : 'false');
    return this.http.get<ApiResponse<AppNotification[]>>(this.API_URL, { params });
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.API_URL}/unread-count`);
  }

  markAsRead(id: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.API_URL}/${id}/read`, {});
  }

  markAllAsRead(): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.API_URL}/read-all`, {});
  }
}
