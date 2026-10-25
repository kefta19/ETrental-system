import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import { AgencyDashboard, LandlordDashboard, RenterDashboard } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/dashboard`;

  getRenterDashboard(): Observable<ApiResponse<RenterDashboard>> {
    return this.http.get<ApiResponse<RenterDashboard>>(`${this.API_URL}/renter`);
  }

  getLandlordDashboard(): Observable<ApiResponse<LandlordDashboard>> {
    return this.http.get<ApiResponse<LandlordDashboard>>(`${this.API_URL}/landlord`);
  }

  getAgencyDashboard(): Observable<ApiResponse<AgencyDashboard>> {
    return this.http.get<ApiResponse<AgencyDashboard>>(`${this.API_URL}/agency`);
  }
}
