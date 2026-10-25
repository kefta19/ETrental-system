import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import { PaginatedResult } from '../models/property.model';
import {
  CreateUserReportDto,
  ReportCategory,
  ReportDashboard,
  ReportStatus,
  UpdateUserReportDto,
  UserReport
} from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/reports`;

  createReport(dto: CreateUserReportDto): Observable<ApiResponse<UserReport>> {
    return this.http.post<ApiResponse<UserReport>>(this.API_URL, dto);
  }

  getMyReports(): Observable<ApiResponse<UserReport[]>> {
    return this.http.get<ApiResponse<UserReport[]>>(`${this.API_URL}/my`);
  }

  getAllReports(
    status?: ReportStatus,
    category?: ReportCategory,
    page = 1,
    pageSize = 25
  ): Observable<ApiResponse<PaginatedResult<UserReport>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (status !== undefined && status !== null) params = params.set('status', status.toString());
    if (category !== undefined && category !== null) params = params.set('category', category.toString());
    return this.http.get<ApiResponse<PaginatedResult<UserReport>>>(this.API_URL, { params });
  }

  getDashboard(): Observable<ApiResponse<ReportDashboard>> {
    return this.http.get<ApiResponse<ReportDashboard>>(`${this.API_URL}/dashboard`);
  }

  updateReport(reportId: string, dto: UpdateUserReportDto): Observable<ApiResponse<UserReport>> {
    return this.http.put<ApiResponse<UserReport>>(`${this.API_URL}/${reportId}`, dto);
  }
}
