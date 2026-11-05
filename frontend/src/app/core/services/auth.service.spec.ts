import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('routes each supported role to its own dashboard regardless of role casing', () => {
    const user = (role: string) => ({ roles: [role] }) as User;

    expect(service.dashboardRoute(user('ADMIN'))).toBe('/admin/dashboard');
    expect(service.dashboardRoute(user('Landlord'))).toBe('/landlord/dashboard');
    expect(service.dashboardRoute(user('Support'))).toBe('/support/dashboard');
    expect(service.dashboardRoute(user('Renter'))).toBe('/renter/dashboard');
  });
});
