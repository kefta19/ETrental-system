import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse, ApiResponse } from '../models/auth.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${API_BASE_URL}/auth`;
  private readonly TOKEN_KEY = 'etrental_token';
  private readonly REFRESH_TOKEN_KEY = 'etrental_refresh_token';
  private readonly USER_KEY = 'etrental_user';

  // Angular Signals for reactive state management
  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.roles[0] || null);
  isLandlord = computed(() => this.hasRole('Landlord'));
  isAdmin = computed(() => this.hasRole('Admin'));
  isRenter = computed(() => this.hasRole('Renter'));

  constructor() {
    // Verify a stored token, but never clear a session that was just created by a
    // login/register request if this background check fails late.
    if (this.getToken()) {
      const tokenAtStartup = this.getToken();
      this.fetchCurrentUser().subscribe({
        error: () => {
          if (this.getToken() === tokenAtStartup) {
            this.clearSession();
          }
        }
      });
    }
  }

  /** Case-insensitive role check so roles such as "admin" also work. */
  hasRole(role: string): boolean {
    return this.currentUser()?.roles.some(r => r.toLowerCase() === role.toLowerCase()) ?? false;
  }

  /** Landing page for the signed-in user's role. */
  dashboardRoute(user: User | null = this.currentUser()): string {
    const roles = (user?.roles ?? []).map(r => r.toLowerCase());
    if (roles.includes('admin')) return '/admin/dashboard';
    if (roles.includes('landlord')) return '/landlord/dashboard';
    if (roles.includes('renter')) return '/renter/dashboard';
    return '/renter/dashboard';
  }

  register(data: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data).pipe(
      tap(res => {
        if (res.succeeded && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.succeeded && res.data) {
          this.handleAuthSuccess(res.data);
        }
      })
    );
  }

  fetchCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/me`).pipe(
      tap(res => {
        if (res.succeeded && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
        }
      })
    );
  }

  syncProfile(
    profile: Pick<User, 'firstName' | 'lastName' | 'email' | 'phoneNumber'>
      & Partial<Pick<User, 'profilePictureUrl'>>,
  ): void {
    const current = this.currentUser();
    if (!current) return;

    const updated: User = { ...current, ...profile, fullName: `${profile.firstName} ${profile.lastName}`.trim() };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Drops the stored session without navigating (used for stale tokens). */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(auth.user));
    this.currentUser.set(auth.user);
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}
