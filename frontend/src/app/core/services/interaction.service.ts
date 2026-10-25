import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/auth.model';
import { API_BASE_URL } from '../config/api.config';
import { PropertySummary } from '../models/property.model';
import { 
  SavedSearch, 
  CreateSavedSearch, 
  PropertyInquiry, 
  CreateInquiry, 
  ReplyInquiry,
  ViewingAppointment,
  CreateAppointment,
  UpdateAppointmentStatus,
  RentalApplication,
  CreateApplication,
  UpdateApplicationStatus
} from '../models/interaction.model';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private http = inject(HttpClient);

  private readonly FAVORITES_API = `${API_BASE_URL}/favorites`;
  private readonly SEARCHES_API = `${API_BASE_URL}/saved-searches`;
  private readonly INQUIRIES_API = `${API_BASE_URL}/inquiries`;
  private readonly APPOINTMENTS_API = `${API_BASE_URL}/appointments`;
  private readonly APPLICATIONS_API = `${API_BASE_URL}/applications`;

  // Reactive State for Favorited Property IDs (for instant UI feedback across components)
  favoritedPropertyIds = signal<Set<string>>(new Set<string>());

  // ================= Favorites =================
  loadFavorites(): Observable<ApiResponse<PropertySummary[]>> {
    return this.http.get<ApiResponse<PropertySummary[]>>(this.FAVORITES_API).pipe(
      tap((res) => {
        if (res.succeeded && res.data) {
          const ids = new Set<string>(res.data.map((p) => p.id));
          this.favoritedPropertyIds.set(ids);
        }
      })
    );
  }

  toggleFavorite(propertyId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.FAVORITES_API}/toggle/${propertyId}`, {}).pipe(
      tap((res) => {
        if (res.succeeded) {
          const current = new Set(this.favoritedPropertyIds());
          if (res.data) {
            current.add(propertyId);
          } else {
            current.delete(propertyId);
          }
          this.favoritedPropertyIds.set(current);
        }
      })
    );
  }

  isFavorited(propertyId: string): boolean {
    return this.favoritedPropertyIds().has(propertyId);
  }

  // ================= Saved Searches =================
  getSavedSearches(): Observable<ApiResponse<SavedSearch[]>> {
    return this.http.get<ApiResponse<SavedSearch[]>>(this.SEARCHES_API);
  }

  createSavedSearch(dto: CreateSavedSearch): Observable<ApiResponse<SavedSearch>> {
    return this.http.post<ApiResponse<SavedSearch>>(this.SEARCHES_API, dto);
  }

  deleteSavedSearch(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.SEARCHES_API}/${id}`);
  }

  // ================= Inquiries =================
  createInquiry(dto: CreateInquiry): Observable<ApiResponse<PropertyInquiry>> {
    return this.http.post<ApiResponse<PropertyInquiry>>(this.INQUIRIES_API, dto);
  }

  getInquiriesSent(): Observable<ApiResponse<PropertyInquiry[]>> {
    return this.http.get<ApiResponse<PropertyInquiry[]>>(`${this.INQUIRIES_API}/sent`);
  }

  getInquiriesReceived(): Observable<ApiResponse<PropertyInquiry[]>> {
    return this.http.get<ApiResponse<PropertyInquiry[]>>(`${this.INQUIRIES_API}/received`);
  }

  replyInquiry(id: string, dto: ReplyInquiry): Observable<ApiResponse<PropertyInquiry>> {
    return this.http.post<ApiResponse<PropertyInquiry>>(`${this.INQUIRIES_API}/${id}/reply`, dto);
  }

  markInquiryAsRead(id: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.INQUIRIES_API}/${id}/read`, {});
  }

  // ================= Appointments =================
  requestAppointment(dto: CreateAppointment): Observable<ApiResponse<ViewingAppointment>> {
    return this.http.post<ApiResponse<ViewingAppointment>>(this.APPOINTMENTS_API, dto);
  }

  getMyAppointments(): Observable<ApiResponse<ViewingAppointment[]>> {
    return this.http.get<ApiResponse<ViewingAppointment[]>>(`${this.APPOINTMENTS_API}/mine`);
  }

  updateAppointmentStatus(id: string, dto: UpdateAppointmentStatus): Observable<ApiResponse<ViewingAppointment>> {
    return this.http.put<ApiResponse<ViewingAppointment>>(`${this.APPOINTMENTS_API}/${id}/status`, dto);
  }

  // ================= Rental Applications =================
  submitApplication(dto: CreateApplication): Observable<ApiResponse<RentalApplication>> {
    return this.http.post<ApiResponse<RentalApplication>>(this.APPLICATIONS_API, dto);
  }

  getMyApplications(): Observable<ApiResponse<RentalApplication[]>> {
    return this.http.get<ApiResponse<RentalApplication[]>>(`${this.APPLICATIONS_API}/sent`);
  }

  getReceivedApplications(propertyId?: string): Observable<ApiResponse<RentalApplication[]>> {
    let params = new HttpParams();
    if (propertyId) params = params.set('propertyId', propertyId);
    return this.http.get<ApiResponse<RentalApplication[]>>(`${this.APPLICATIONS_API}/received`, { params });
  }

  updateApplicationStatus(id: string, dto: UpdateApplicationStatus): Observable<ApiResponse<RentalApplication>> {
    return this.http.put<ApiResponse<RentalApplication>>(`${this.APPLICATIONS_API}/${id}/status`, dto);
  }
}
