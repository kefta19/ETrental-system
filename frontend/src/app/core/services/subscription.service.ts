import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import {
  Entitlement,
  PaymentTransaction,
  StartSubscriptionDto,
  Subscription,
  SubscriptionPlan
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/subscriptions`;

  getPlans(): Observable<ApiResponse<SubscriptionPlan[]>> {
    return this.http.get<ApiResponse<SubscriptionPlan[]>>(`${this.API_URL}/plans`);
  }

  getCurrentSubscription(): Observable<ApiResponse<Subscription | null>> {
    return this.http.get<ApiResponse<Subscription | null>>(`${this.API_URL}/me`);
  }

  getEntitlements(): Observable<ApiResponse<Entitlement>> {
    return this.http.get<ApiResponse<Entitlement>>(`${this.API_URL}/entitlements`);
  }

  startSubscription(dto: StartSubscriptionDto): Observable<ApiResponse<Subscription>> {
    return this.http.post<ApiResponse<Subscription>>(`${this.API_URL}/start`, dto);
  }

  cancelSubscription(reason?: string): Observable<ApiResponse<Subscription>> {
    return this.http.post<ApiResponse<Subscription>>(`${this.API_URL}/cancel`, { reason: reason ?? null });
  }

  getMyPaymentTransactions(): Observable<ApiResponse<PaymentTransaction[]>> {
    return this.http.get<ApiResponse<PaymentTransaction[]>>(`${this.API_URL}/payments`);
  }
}
