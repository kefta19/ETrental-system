import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import {
  AgencyMember,
  AgencyProfile,
  AgencyReport,
  InviteStaffDto,
  UpdateAgencyDto
} from '../models/agency.model';
import { AgencyStaffRole } from '../models/agency.model';

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/agency`;

  getProfile(): Observable<ApiResponse<AgencyProfile>> {
    return this.http.get<ApiResponse<AgencyProfile>>(`${this.API_URL}/profile`);
  }

  updateProfile(dto: UpdateAgencyDto): Observable<ApiResponse<AgencyProfile>> {
    return this.http.put<ApiResponse<AgencyProfile>>(`${this.API_URL}/profile`, dto);
  }

  submitVerification(): Observable<ApiResponse<AgencyProfile>> {
    return this.http.post<ApiResponse<AgencyProfile>>(`${this.API_URL}/submit-verification`, {});
  }

  getStaff(): Observable<ApiResponse<AgencyMember[]>> {
    return this.http.get<ApiResponse<AgencyMember[]>>(`${this.API_URL}/staff`);
  }

  inviteStaff(dto: InviteStaffDto): Observable<ApiResponse<AgencyMember>> {
    return this.http.post<ApiResponse<AgencyMember>>(`${this.API_URL}/staff/invite`, dto);
  }

  updateStaffRole(membershipId: string, role: AgencyStaffRole): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.API_URL}/staff/${membershipId}/role`, { role });
  }

  deactivateStaff(membershipId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.API_URL}/staff/${membershipId}`);
  }

  assignStaffToProperty(staffUserId: string, propertyId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.API_URL}/staff/${staffUserId}/properties/${propertyId}/assign`, {});
  }

  removeStaffFromProperty(staffUserId: string, propertyId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.API_URL}/staff/${staffUserId}/properties/${propertyId}/assign`);
  }

  getReport(): Observable<ApiResponse<AgencyReport>> {
    return this.http.get<ApiResponse<AgencyReport>>(`${this.API_URL}/report`);
  }
}
