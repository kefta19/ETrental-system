import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { PropertyService } from '../../../core/services/property.service';
import { ApplicationsListComponent } from './applications-list.component';

describe('ApplicationsListComponent', () => {
  it('shows host decisions for a submitted application returned as an API enum string', async () => {
    const application = {
      id: 'application-1',
      propertyId: 'property-1',
      property: { title: 'Test apartment', rentAmountETB: 12000, city: 'Addis Ababa', subCity: 'Bole', neighborhood: 'Bole' },
      applicantId: 'renter-1',
      applicantName: 'Test Renter',
      proposedMoveInDate: '2026-12-01',
      proposedLeaseDurationMonths: 12,
      proposedOccupantsCount: 2,
      employmentOrIncomeSummary: 'Employed',
      status: 'Submitted',
      createdAtUtc: '2026-11-04T12:00:00Z',
    };

    TestBed.configureTestingModule({
      imports: [ApplicationsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: InteractionService,
          useValue: {
            getMyApplications: () => of({ succeeded: true, data: [], errors: [] }),
            getReceivedApplications: () => of({ succeeded: true, data: [application], errors: [] }),
          },
        },
        { provide: PropertyService, useValue: {} },
        {
          provide: AuthService,
          useValue: { isLandlord: () => true, isAdmin: () => false },
        },
      ],
    });

    const fixture = TestBed.createComponent(ApplicationsListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Submitted');
    expect(fixture.nativeElement.textContent).toContain('Accept Application');
    expect(fixture.nativeElement.textContent).toContain('Decline');
  });
});
