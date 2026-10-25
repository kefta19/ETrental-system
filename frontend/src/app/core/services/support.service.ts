import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/auth.model';
import {
  CreateSupportTicketDto,
  ReplySupportTicketDto,
  SupportDashboard,
  SupportTicket,
  SupportTicketMessage,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UpdateSupportTicketDto
} from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private readonly API_URL = `${API_BASE_URL}/support`;

  createTicket(dto: CreateSupportTicketDto): Observable<ApiResponse<SupportTicket>> {
    return this.http.post<ApiResponse<SupportTicket>>(`${this.API_URL}/tickets`, dto);
  }

  getMyTickets(): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.API_URL}/tickets/my`);
  }

  getTickets(
    status?: TicketStatus,
    category?: TicketCategory,
    priority?: TicketPriority,
    assignedToId?: string,
    page = 1,
    pageSize = 25
  ): Observable<ApiResponse<SupportTicket[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (status !== undefined && status !== null) params = params.set('status', status.toString());
    if (category !== undefined && category !== null) params = params.set('category', category.toString());
    if (priority !== undefined && priority !== null) params = params.set('priority', priority.toString());
    if (assignedToId) params = params.set('assignedToId', assignedToId);
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.API_URL}/tickets`, { params });
  }

  getDashboard(): Observable<ApiResponse<SupportDashboard>> {
    return this.http.get<ApiResponse<SupportDashboard>>(`${this.API_URL}/dashboard`);
  }

  getTicket(ticketId: string): Observable<ApiResponse<SupportTicket>> {
    return this.http.get<ApiResponse<SupportTicket>>(`${this.API_URL}/tickets/${ticketId}`);
  }

  getTicketMessages(ticketId: string): Observable<ApiResponse<SupportTicketMessage[]>> {
    return this.http.get<ApiResponse<SupportTicketMessage[]>>(`${this.API_URL}/tickets/${ticketId}/messages`);
  }

  replyToTicket(ticketId: string, dto: ReplySupportTicketDto): Observable<ApiResponse<SupportTicketMessage>> {
    return this.http.post<ApiResponse<SupportTicketMessage>>(`${this.API_URL}/tickets/${ticketId}/messages`, dto);
  }

  updateTicket(ticketId: string, dto: UpdateSupportTicketDto): Observable<ApiResponse<SupportTicket>> {
    return this.http.put<ApiResponse<SupportTicket>>(`${this.API_URL}/tickets/${ticketId}`, dto);
  }
}
