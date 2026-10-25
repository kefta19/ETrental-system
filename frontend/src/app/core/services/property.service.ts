import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Property, 
  PropertySummary, 
  PropertyFilter, 
  PaginatedResult, 
  CreatePropertyDto, 
  ModerationDecisionDto,
  MarkAsRentedDto 
} from '../models/property.model';
import { ApiResponse } from '../models/auth.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/properties`;
  private readonly MODERATION_API_URL = `${API_BASE_URL}/admin/moderation`;

  search(filter: PropertyFilter): Observable<ApiResponse<PaginatedResult<PropertySummary>>> {
    let params = new HttpParams();

    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.city) params = params.set('city', filter.city);
    if (filter.subCity) params = params.set('subCity', filter.subCity);
    if (filter.neighborhood) params = params.set('neighborhood', filter.neighborhood);
    if (filter.propertyType !== undefined && filter.propertyType !== null) params = params.set('propertyType', filter.propertyType.toString());
    if (filter.furnishing !== undefined && filter.furnishing !== null) params = params.set('furnishing', filter.furnishing.toString());
    
    if (filter.minPriceETB) params = params.set('minPriceETB', filter.minPriceETB.toString());
    if (filter.maxPriceETB && filter.maxPriceETB > 0) params = params.set('maxPriceETB', filter.maxPriceETB.toString());
    if (filter.minBedrooms) params = params.set('minBedrooms', filter.minBedrooms.toString());
    if (filter.minBathrooms) params = params.set('minBathrooms', filter.minBathrooms.toString());
    if (filter.maxAdvanceMonths) params = params.set('maxAdvanceMonths', filter.maxAdvanceMonths.toString());

    if (filter.hasWaterTank) params = params.set('hasWaterTank', 'true');
    if (filter.hasGenerator) params = params.set('hasGenerator', 'true');
    if (filter.hasSecurityGuard) params = params.set('hasSecurityGuard', 'true');
    if (filter.hasParking) params = params.set('hasParking', 'true');
    if (filter.hasElevator) params = params.set('hasElevator', 'true');
    if (filter.hasWifi) params = params.set('hasWifi', 'true');

    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<ApiResponse<PaginatedResult<PropertySummary>>>(`${this.API_URL}/search`, { params });
  }

  getById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.API_URL}/${id}`);
  }

  create(dto: CreatePropertyDto): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(this.API_URL, dto);
  }

  update(id: string, dto: any): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.API_URL}/${id}`, dto);
  }

  getMyProperties(status?: number): Observable<ApiResponse<PropertySummary[]>> {
    let params = new HttpParams();
    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }
    return this.http.get<ApiResponse<PropertySummary[]>>(`${this.API_URL}/landlord/my-listings`, { params });
  }

  submitForReview(id: string): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.API_URL}/${id}/submit-review`, {});
  }

  toggleAvailability(id: string): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.API_URL}/${id}/toggle-availability`, {});
  }

  markAsRented(id: string, dto: MarkAsRentedDto): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.API_URL}/${id}/mark-as-rented`, dto);
  }

  deleteProperty(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.API_URL}/${id}`);
  }

  uploadImage(file: File): Observable<{ succeeded: boolean; data: { url: string }; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ succeeded: boolean; data: { url: string }; errors?: string[] }>(
      `${this.API_URL}/upload-image`,
      formData
    );
  }

  // Admin Moderation API
  getPendingModeration(page: number = 1, pageSize: number = 12): Observable<ApiResponse<PaginatedResult<PropertySummary>>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<ApiResponse<PaginatedResult<PropertySummary>>>(`${this.MODERATION_API_URL}/pending`, { params });
  }

  moderateListing(id: string, decision: ModerationDecisionDto): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.MODERATION_API_URL}/properties/${id}/decision`, decision);
  }
}
