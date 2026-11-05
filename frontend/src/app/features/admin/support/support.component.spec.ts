import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { SupportService } from '../../../core/services/support.service';
import { SupportComponent } from './support.component';

describe('SupportComponent', () => {
  it('renders string-enum values returned by the support API', async () => {
    const ticket = {
      id: 'ticket-1',
      ticketReference: 'TICK-1',
      userId: 'user-1',
      userName: 'Test Renter',
      userEmail: 'renter@example.test',
      category: 'Other',
      priority: 'High',
      status: 'Open',
      subject: 'Help with a listing',
      createdAtUtc: '2026-11-04T12:00:00Z',
      messageCount: 1,
      lastMessagePreview: 'Please help.',
    };

    TestBed.configureTestingModule({
      imports: [SupportComponent],
      providers: [
        {
          provide: SupportService,
          useValue: {
            getTickets: () => of({ succeeded: true, data: [ticket], errors: [] }),
          },
        },
        {
          provide: AdminService,
          useValue: { pageRefreshRequested$: of() },
        },
        {
          provide: AuthService,
          useValue: { hasRole: () => false },
        },
      ],
    });

    const fixture = TestBed.createComponent(SupportComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('High');
    expect(text).toContain('Other');
    expect(text).toContain('Open');
    expect(text).not.toContain('Unknown');
  });
});
