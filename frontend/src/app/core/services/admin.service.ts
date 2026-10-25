import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import { PaginatedResult } from '../models/property.model';
import {
  AdminDashboard,
  AdminUser,
  AgencyVerificationDto,
  AuditLogEntry,
  PlatformSetting,
  RestrictUserDto,
  SubscriptionPlanAdmin,
  UpdateSubscriptionPlanDto,
  VerifyPaymentDto
} from '../models/admin.model';
import { AgencyProfile, AgencyStatus } from '../models/agency.model';
import { PaymentTransaction } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/admin`;

  getDashboard(): Observable<ApiResponse<AdminDashboard>> {
    return this.http.get<ApiResponse<AdminDashboard>>(`${this.API_URL}/dashboard`);
  }

  getUsers(
    search?: string,
    role?: string,
    isRestricted?: boolean,
    page = 1,
    pageSize = 20
  ): Observable<ApiResponse<PaginatedResult<AdminUser>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    if (isRestricted !== undefined && isRestricted !== null) {
      params = params.set('isRestricted', isRestricted ? 'true' : 'false');
    }
    return this.http.get<ApiResponse<PaginatedResult<AdminUser>>>(`${this.API_URL}/users`, { params });
  }

  getUser(userId: string): Observable<ApiResponse<AdminUser>> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.API_URL}/users/${userId}`);
  }

  setRestriction(userId: string, dto: RestrictUserDto): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(`${this.API_URL}/users/${userId}/restriction`, dto);
  }

  setActive(userId: string, isActive: boolean, reason: string): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(`${this.API_URL}/users/${userId}/active`, {
      isRestricted: !isActive,
      reason
    });
  }

  getAgencies(status?: AgencyStatus): Observable<ApiResponse<AgencyProfile[]>> {
    let params = new HttpParams();
    if (status !== undefined && status !== null) params = params.set('status', status.toString());
    return this.http.get<ApiResponse<AgencyProfile[]>>(`${this.API_URL}/agencies`, { params });
  }

  verifyAgency(agencyId: string, dto: AgencyVerificationDto): Observable<ApiResponse<AgencyProfile>> {
    return this.http.post<ApiResponse<AgencyProfile>>(`${this.API_URL}/agencies/${agencyId}/verification`, dto);
  }

  getSettings(): Observable<ApiResponse<PlatformSetting[]>> {
    return this.http.get<ApiResponse<PlatformSetting[]>>(`${this.API_URL}/settings`);
  }

  updateSetting(key: string, value: string): Observable<ApiResponse<PlatformSetting>> {
    return this.http.put<ApiResponse<PlatformSetting>>(`${this.API_URL}/settings/${encodeURIComponent(key)}`, { value });
  }

  getSubscriptionPlans(): Observable<ApiResponse<SubscriptionPlanAdmin[]>> {
    return this.http.get<ApiResponse<SubscriptionPlanAdmin[]>>(`${this.API_URL}/subscription-plans`);
  }

  updateSubscriptionPlan(planId: string, dto: UpdateSubscriptionPlanDto): Observable<ApiResponse<SubscriptionPlanAdmin>> {
    return this.http.put<ApiResponse<SubscriptionPlanAdmin>>(`${this.API_URL}/subscription-plans/${planId}`, dto);
  }

  getPayments(page = 1, pageSize = 20): Observable<ApiResponse<PaymentTransaction[]>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<ApiResponse<PaymentTransaction[]>>(`${this.API_URL}/payments`, { params });
  }

  verifyPayment(dto: VerifyPaymentDto): Observable<ApiResponse<PaymentTransaction>> {
    return this.http.post<ApiResponse<PaymentTransaction>>(`${this.API_URL}/payments/verify`, dto);
  }

  getAuditLogs(page = 1, pageSize = 50): Observable<ApiResponse<AuditLogEntry[]>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<ApiResponse<AuditLogEntry[]>>(`${this.API_URL}/audit-logs`, { params });
  }
}
