import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  function createComponent(returnUrl: string | null) {
    const navigateByUrl = vi.fn();
    const authService = {
      login: () => of({ succeeded: true, data: { user: { roles: ['Renter'] } }, errors: [] }),
      currentUser: () => ({ roles: ['Renter'] }),
      dashboardRoute: () => '/renter/dashboard',
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.loginForm.setValue({
      email: 'renter@example.com',
      password: 'Password123',
    });

    return { fixture, navigateByUrl };
  }

  it('returns to the requested property after signing in', () => {
    const { fixture, navigateByUrl } = createComponent('/properties/listing-123');

    fixture.componentInstance.onSubmit();

    expect(navigateByUrl).toHaveBeenCalledWith('/properties/listing-123');
  });

  it('uses the role dashboard when there is no safe local return destination', () => {
    const { fixture, navigateByUrl } = createComponent('//example.com');

    fixture.componentInstance.onSubmit();

    expect(navigateByUrl).toHaveBeenCalledWith('/renter/dashboard');
  });
});
