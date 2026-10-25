import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { RenterDashboard } from '../../../core/models/dashboard.model';

interface QuickAction {
  label: string;
  hint: string;
  link: string;
  cta: string;
}

@Component({
  selector: 'app-renter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Renter Dashboard</span>
          <h1>Your rental journey in one place</h1>
          <p>Track saved homes, conversations, viewings and applications across Ethiopia.</p>
        </div>
        @if (dashboard(); as data) {
          <span class="badge" [class.badge-green]="isPremiumTier(data.subscriptionTier)" [class.badge-amber]="!isPremiumTier(data.subscriptionTier)">
            {{ data.subscriptionTier }} plan
          </span>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your renter dashboard...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>We could not load your dashboard.</strong>
          <span>{{ message }}</span>
          <div class="alert-actions">
            <button class="btn btn-outline btn-sm" (click)="loadDashboard()">Try again</button>
          </div>
        </div>
      } @else if (dashboard(); as data) {
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Saved Favorites</div>
            <div class="stat-value">{{ data.favoriteCount | number }}</div>
            <div class="stat-hint">{{ data.recommendedPropertyCount | number }} listings recommended for you</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Saved Searches</div>
            <div class="stat-value">{{ data.savedSearchCount | number }}</div>
            <div class="stat-hint">Alert criteria waiting for a match</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Inquiries Sent</div>
            <div class="stat-value">{{ data.sentInquiryCount | number }}</div>
            <div class="stat-hint">{{ data.unreadInquiryCount | number }} awaiting your reply</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Viewing Appointments</div>
            <div class="stat-value">{{ data.appointmentCount | number }}</div>
            <div class="stat-hint">{{ data.upcomingAppointmentCount | number }} upcoming</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Rental Applications</div>
            <div class="stat-value">{{ data.applicationCount | number }}</div>
            <div class="stat-hint">{{ data.activeApplicationCount | number }} still active</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Unread Notifications</div>
            <div class="stat-value">{{ data.unreadNotificationCount | number }}</div>
            <div class="stat-hint">Updates from hosts and the platform</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Quick actions</span>
            <span class="muted">Jump straight to the tools you use most</span>
          </div>
          <div class="panel-body">
            <div class="quick-grid">
              @for (action of quickActions; track action.link) {
                <a class="quick-link" [routerLink]="action.link">
                  <span class="quick-label">{{ action.label }}</span>
                  <span class="muted">{{ action.hint }}</span>
                  <span class="quick-cta">{{ action.cta }}</span>
                </a>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 0.75rem;
    }
    .quick-link {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: #ffffff;
      transition: all 0.2s ease-in-out;
    }
    .quick-link:hover {
      border-color: var(--primary);
      background: var(--primary-light);
    }
    .quick-label {
      font-weight: 700;
      color: var(--secondary);
    }
    .quick-cta {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--primary);
      margin-top: 0.15rem;
    }
    .alert-actions {
      margin-top: 0.5rem;
    }
  `]
})
export class RenterDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  readonly dashboard = signal<RenterDashboard | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly quickActions: QuickAction[] = [
    { label: 'Favorites', hint: 'Shortlisted homes', link: '/favorites', cta: 'Open favorites' },
    { label: 'Saved Searches', hint: 'Automated alerts', link: '/saved-searches', cta: 'Manage searches' },
    { label: 'Messages', hint: 'Host conversations', link: '/messages', cta: 'Open inbox' },
    { label: 'Appointments', hint: 'Property viewings', link: '/appointments', cta: 'View appointments' },
    { label: 'Applications', hint: 'Rental requests', link: '/applications', cta: 'Track applications' },
    { label: 'Notifications', hint: 'Platform updates', link: '/notifications', cta: 'See notifications' },
    { label: 'Subscription', hint: 'Plan and billing', link: '/subscription', cta: 'Manage plan' },
    { label: 'Support', hint: 'Help centre', link: '/support', cta: 'Ask support' }
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getRenterDashboard().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.dashboard.set(res.data);
          return;
        }
        this.error.set(res.errors.length > 0 ? res.errors.join(' ') : 'The dashboard service returned an empty response.');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not reach the server. Please check your connection and try again.');
      }
    });
  }

  isPremiumTier(tier: string): boolean {
    if (!tier) {
      return false;
    }
    return tier.trim().toLowerCase() === 'premium';
  }
}
