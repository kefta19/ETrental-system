import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LandlordDashboardComponent } from './landlord-dashboard.component';

describe('LandlordDashboardComponent', () => {
  const mockDashboard = {
    totalProperties: 5,
    draftProperties: 1,
    pendingReviewProperties: 1,
    publishedProperties: 2,
    rentedProperties: 1,
    rejectedProperties: 0,
    unavailableProperties: 0,
    totalInquiries: 8,
    unreadInquiries: 3,
    totalAppointments: 4,
    pendingAppointments: 2,
    totalApplications: 3,
    pendingApplications: 1,
    activeAgreements: 1,
    monthlyPortfolioValueETB: 125000,
    unreadNotificationCount: 2
  };

  it('renders landlord performance and portfolio metrics', () => {
    const getLandlordDashboard = vi.fn().mockReturnValue(of({ succeeded: true, data: mockDashboard, errors: [] }));

    TestBed.configureTestingModule({
      imports: [LandlordDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { getLandlordDashboard } }
      ]
    });

    const fixture = TestBed.createComponent(LandlordDashboardComponent);
    fixture.detectChanges();

    expect(getLandlordDashboard).toHaveBeenCalled();
    expect(fixture.componentInstance.dashboard()?.totalProperties).toBe(5);
    expect(fixture.componentInstance.dashboard()?.monthlyPortfolioValueETB).toBe(125000);
    expect(fixture.nativeElement.textContent).toContain('Total properties');
    expect(fixture.nativeElement.textContent).toContain('Monthly portfolio value');
  });
});
