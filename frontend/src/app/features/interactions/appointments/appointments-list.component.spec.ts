import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { AppointmentsListComponent } from './appointments-list.component';

describe('AppointmentsListComponent', () => {
  it('shows host actions for a requested appointment returned as an API enum string', async () => {
    const appointment = {
      id: 'appointment-1',
      propertyId: 'property-1',
      property: { title: 'Test apartment', city: 'Addis Ababa', subCity: 'Bole', neighborhood: 'Bole' },
      renterId: 'renter-1',
      renterName: 'Test Renter',
      requestedDateTimeUtc: '2026-11-10T09:00:00Z',
      status: 'Requested',
      createdAtUtc: '2026-11-04T12:00:00Z',
    };

    TestBed.configureTestingModule({
      imports: [AppointmentsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: InteractionService,
          useValue: { getMyAppointments: () => of({ succeeded: true, data: [appointment], errors: [] }) },
        },
        {
          provide: AuthService,
          useValue: { isLandlord: () => true, isAdmin: () => false },
        },
      ],
    });

    const fixture = TestBed.createComponent(AppointmentsListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Requested');
    expect(fixture.nativeElement.textContent).toContain('Confirm Tour');
  });
});
