import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/auth.model';
import { InteractionService } from '../../../core/services/interaction.service';
import { PaginatedResult, PropertySummary } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyListComponent } from './property-list.component';

describe('PropertyListComponent', () => {
  const listing = {
    id: 'listing-1',
    title: 'Bright apartment in Bole',
    propertyType: 0,
    status: 4,
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    subCity: 'Bole',
    neighborhood: 'Bole',
    rentAmountETB: 20000,
    depositAmountETB: 20000,
    advanceMonthsRequired: 2,
    bedrooms: 2,
    bathrooms: 1,
    furnishing: 0,
    hasWaterTank: false,
    hasGenerator: false,
    hasSecurityGuard: false,
    hasParking: false,
    hasElevator: false,
    imageUrls: [],
    landlordName: 'Test Landlord',
    isVerifiedHost: false,
    createdAtUtc: '2026-01-01T00:00:00Z',
  };

  function createComponent(searchResult: Observable<ApiResponse<PaginatedResult<PropertySummary>>>) {
    const propertyService = { search: vi.fn(() => searchResult) };
    const interactionService = {
      loadFavorites: vi.fn(() => of({ succeeded: true, data: [], errors: [] })),
      isFavorited: vi.fn(() => false),
    };
    const authService = {
      currentUser: () => null,
      isAuthenticated: () => false,
    };

    TestBed.configureTestingModule({
      imports: [PropertyListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PropertyService, useValue: propertyService },
        { provide: InteractionService, useValue: interactionService },
        { provide: AuthService, useValue: authService },
      ],
    });

    const fixture = TestBed.createComponent(PropertyListComponent);
    fixture.detectChanges();
    return { fixture, propertyService };
  }

  it('renders returned listings after an asynchronous search response', async () => {
    const { fixture } = createComponent(of({
      succeeded: true,
      data: {
        items: [listing],
        totalCount: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      errors: [],
    }));

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Bright apartment in Bole');
    expect(fixture.nativeElement.textContent).toContain('1 home available');
    expect(fixture.nativeElement.querySelector('.skeleton-card')).toBeNull();
  });

  it('shows a retryable error instead of leaving the loading skeletons visible', async () => {
    const { fixture } = createComponent(throwError(() => new Error('offline')));

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain("We couldn't load homes");
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.skeleton-card')).toBeNull();
  });
});
