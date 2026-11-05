import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { PropertyCardComponent } from './property-card.component';

describe('PropertyCardComponent', () => {
  it('sends a guest to sign-in with the property as the return destination', () => {
    const navigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: AuthService, useValue: { currentUser: () => null } },
        { provide: InteractionService, useValue: { isFavorited: () => false } },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new PropertyCardComponent());
    component.property = {
      id: 'listing-123',
      title: 'Test apartment',
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

    component.toggleFavorite(new MouseEvent('click'));

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/properties/listing-123' },
    });
  });
});
