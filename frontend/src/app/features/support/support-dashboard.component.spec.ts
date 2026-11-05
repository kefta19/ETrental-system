import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SupportService } from '../../core/services/support.service';
import { SupportDashboardComponent } from './support-dashboard.component';

describe('SupportDashboardComponent', () => {
  it('renders ticket counts returned by the support API', async () => {
    TestBed.configureTestingModule({
      imports: [SupportDashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: SupportService,
          useValue: {
            getDashboard: () => of({
              succeeded: true,
              data: {
                openTickets: 3,
                inProgressTickets: 2,
                waitingForUserTickets: 1,
                escalatedTickets: 0,
                resolvedToday: 4,
                totalOpenTickets: 6,
                unassignedTickets: 2,
                myAssignedTickets: 3,
              },
              errors: [],
            }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(SupportDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Open cases');
    expect(fixture.nativeElement.textContent).toContain('Assigned to me');
    expect(fixture.nativeElement.textContent).toContain('6 case(s) still need attention');
  });
});
