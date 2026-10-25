import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AgencyService } from '../../../core/services/agency.service';
import { AgencyReport } from '../../../core/models/agency.model';

@Component({
  selector: 'app-agency-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Agency Workspace</span>
          <h1>Performance Report</h1>
          <p>A consolidated view of your brokerage listings, renter pipeline and staffing capacity.</p>
        </div>
        @if (report(); as r) {
          <div class="row-between header-badges">
            <span class="badge badge-green">{{ r.subscriptionTier || 'Standard' }} Plan</span>
            <a routerLink="/agency/staff" class="btn btn-outline btn-sm">Manage staff</a>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Building your agency report...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Report unavailable.</strong> {{ message }}
        </div>
        <button class="btn btn-outline btn-sm" (click)="load()">Try again</button>
      } @else if (report(); as r) {
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Listings</span>
            <a routerLink="/landlord/my-properties" class="btn btn-ghost btn-sm">View listings</a>
          </div>
          <div class="panel-body">
            <div class="stat-grid">
              <div class="stat-card">
                <span class="stat-label">Total Listings</span>
                <span class="stat-value">{{ r.totalProperties | number }}</span>
                <span class="stat-hint">All agency inventory</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Active</span>
                <span class="stat-value">{{ r.activeProperties | number }}</span>
                <span class="stat-hint">Currently taking applications</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Published</span>
                <span class="stat-value">{{ r.publishedProperties | number }}</span>
                <span class="stat-hint">Visible in public search</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Pending Review</span>
                <span class="stat-value">{{ r.pendingReviewProperties | number }}</span>
                <span class="stat-hint">Awaiting moderation</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Rejected</span>
                <span class="stat-value">{{ r.rejectedProperties | number }}</span>
                <span class="stat-hint">Needs corrections</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Rented</span>
                <span class="stat-value">{{ r.rentedProperties | number }}</span>
                <span class="stat-hint">Under active tenancy</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Unavailable</span>
                <span class="stat-value">{{ r.unavailableProperties | number }}</span>
                <span class="stat-hint">Paused listings</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Inquiries</span>
              <a routerLink="/messages" class="btn btn-ghost btn-sm">Open inbox</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Total Inquiries</span>
                  <span class="stat-value">{{ r.totalInquiries | number }}</span>
                  <span class="stat-hint">Every message received</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Unread</span>
                  <span class="stat-value">{{ r.unreadInquiries | number }}</span>
                  <span class="stat-hint">Still waiting on a reply</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Applications</span>
              <a routerLink="/applications" class="btn btn-ghost btn-sm">Open applications</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Total Applications</span>
                  <span class="stat-value">{{ r.totalApplications | number }}</span>
                  <span class="stat-hint">Submitted to your listings</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Pending</span>
                  <span class="stat-value">{{ r.pendingApplications | number }}</span>
                  <span class="stat-hint">Awaiting a decision</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Appointments</span>
              <a routerLink="/appointments" class="btn btn-ghost btn-sm">Open appointments</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Total Appointments</span>
                  <span class="stat-value">{{ r.totalAppointments | number }}</span>
                  <span class="stat-hint">Viewings ever scheduled</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Upcoming</span>
                  <span class="stat-value">{{ r.upcomingAppointments | number }}</span>
                  <span class="stat-hint">Scheduled ahead</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Staffing</span>
              <a routerLink="/agency/staff" class="btn btn-ghost btn-sm">Manage staff</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Active Staff</span>
                  <span class="stat-value">{{ r.activeStaff | number }}</span>
                  <span class="stat-hint">Members with platform access</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Subscription Tier</span>
                  <span class="stat-value tier-value">{{ r.subscriptionTier || 'Standard' }}</span>
                  <span class="stat-hint">Current agency plan</span>
                </div>
              </div>
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
    .tier-value {
      font-size: 1.35rem;
      text-transform: capitalize;
    }
  `]
})
export class AgencyReportComponent implements OnInit {
  private agencyService = inject(AgencyService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly report = signal<AgencyReport | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agencyService.getReport().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.report.set(res.data);
        } else {
          this.error.set(res.errors && res.errors.length ? res.errors.join(' ') : 'Your agency report could not be loaded right now.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The server did not respond. Please check your connection and try again.');
      }
    });
  }
}
