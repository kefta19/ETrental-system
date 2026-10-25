import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AgencyDashboard } from '../../../core/models/dashboard.model';
import { AgencyStatus } from '../../../core/models/agency.model';

interface AgencyQuickAction {
  label: string;
  link: string;
  hint: string;
}

@Component({
  selector: 'app-agency-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Agency Workspace</span>
          <h1>{{ dashboard()?.agencyName || 'Agency Overview' }}</h1>
          <p>Monitor your brokerage listings, staff workload and renter pipeline across Ethiopia.</p>
        </div>
        @if (dashboard(); as d) {
          <div class="row-between header-badges">
            <span class="status-pill {{ statusClass(d.agencyStatus) }}">{{ statusLabel(d.agencyStatus) }}</span>
            @if (d.unreadNotificationCount > 0) {
              <span class="badge badge-amber">{{ d.unreadNotificationCount | number }} Unread Alerts</span>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your agency metrics...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Dashboard unavailable.</strong> {{ message }}
        </div>
        <button class="btn btn-outline btn-sm" (click)="load()">Try again</button>
      } @else if (dashboard(); as d) {
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-label">Total Listings</span>
            <span class="stat-value">{{ d.totalProperties | number }}</span>
            <span class="stat-hint">Managed by your agency</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Published</span>
            <span class="stat-value">{{ d.publishedProperties | number }}</span>
            <span class="stat-hint">Live in public search</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending Review</span>
            <span class="stat-value">{{ d.pendingReviewProperties | number }}</span>
            <span class="stat-hint">Awaiting moderation</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Rented</span>
            <span class="stat-value">{{ d.rentedProperties | number }}</span>
            <span class="stat-hint">Under active tenancy</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Unread Inquiries</span>
            <span class="stat-value">{{ d.unreadInquiries | number }}</span>
            <span class="stat-hint">Waiting for a reply</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending Applications</span>
            <span class="stat-value">{{ d.pendingApplications | number }}</span>
            <span class="stat-hint">Needs your decision</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Upcoming Appointments</span>
            <span class="stat-value">{{ d.upcomingAppointments | number }}</span>
            <span class="stat-hint">Scheduled viewings</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Staff</span>
            <span class="stat-value">{{ d.activeStaff | number }}</span>
            <span class="stat-hint">Team members on the platform</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Agency Management</span>
            <a routerLink="/agency/profile" class="btn btn-ghost btn-sm">Agency profile</a>
          </div>
          <div class="panel-body">
            <div class="grid-2">
              @for (action of quickActions; track action.link) {
                <a class="list-row quick-link" [routerLink]="action.link">
                  <span class="stack">
                    <strong>{{ action.label }}</strong>
                    <span class="muted">{{ action.hint }}</span>
                  </span>
                  <span class="quick-arrow">&rarr;</span>
                </a>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-badges {
      gap: 0.5rem;
    }
    .quick-link {
      text-decoration: none;
    }
    .quick-link:hover strong {
      color: var(--primary);
    }
    .quick-arrow {
      color: var(--primary);
      font-weight: 700;
    }
  `]
})
export class AgencyDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<AgencyDashboard | null>(null);

  readonly statusNames: string[] = Object.keys(AgencyStatus).filter((key) => Number.isNaN(Number(key)));

  readonly quickActions: AgencyQuickAction[] = [
    { label: 'Agency Profile', link: '/agency/profile', hint: 'Business details and verification status' },
    { label: 'Staff Team', link: '/agency/staff', hint: 'Invite agents and manage roles' },
    { label: 'Performance Report', link: '/agency/report', hint: 'Listings, pipeline and staffing metrics' },
    { label: 'My Properties', link: '/landlord/my-properties', hint: 'Listings attached to your brokerage' },
    { label: 'Messages', link: '/messages', hint: 'Respond to renter inquiries' },
    { label: 'Appointments', link: '/appointments', hint: 'Confirm scheduled viewings' },
    { label: 'Applications', link: '/applications', hint: 'Review incoming applications' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getAgencyDashboard().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.dashboard.set(res.data);
        } else {
          this.error.set(res.errors && res.errors.length ? res.errors.join(' ') : 'Your agency dashboard could not be loaded right now.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The server did not respond. Please check your connection and try again.');
      }
    });
  }

  statusLabel(status: string): string {
    const raw = status === null || status === undefined ? '' : String(status).trim();
    if (raw.length === 0) {
      return 'Unknown';
    }
    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) {
      const name = AgencyStatus[numeric as AgencyStatus];
      return name ? name : 'Unknown';
    }
    const match = this.statusNames.find((name) => name.toLowerCase() === raw.toLowerCase());
    return match ? match : raw;
  }

  statusClass(status: string): string {
    switch (this.statusLabel(status)) {
      case 'Verified':
        return 'status-green';
      case 'Pending':
        return 'status-amber';
      case 'Rejected':
      case 'Suspended':
        return 'status-red';
      default:
        return '';
    }
  }
}
