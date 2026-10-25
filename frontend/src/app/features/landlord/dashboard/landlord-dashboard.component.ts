import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LandlordDashboard } from '../../../core/models/dashboard.model';

interface QuickAction {
  label: string;
  link: string;
  hint: string;
}

@Component({
  selector: 'app-landlord-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landlord-dashboard">
      <div class="dashboard-header">
        <div class="header-content">
          <div>
            <h1>Dashboard</h1>
            <p>Manage your properties and track performance</p>
          </div>
          <div class="header-actions">
            <a routerLink="/landlord/add-property" class="btn-add">
              <span>+</span>
              <span>Add property</span>
            </a>
          </div>
        </div>
      </div>

      <div class="container">
        @if (loading()) {
          <div class="loading-card">
            <div class="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        } @else if (error(); as message) {
          <div class="error-card">
            <span>⚠️</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{{ message }}</p>
            </div>
            <button class="btn-retry" (click)="load()">Try again</button>
          </div>
        } @else if (dashboard(); as d) {
          @if (d.pendingReviewProperties > 0) {
            <div class="alert-banner">
              <span>ℹ️</span>
              <p><strong>{{ d.pendingReviewProperties }}</strong> {{ d.pendingReviewProperties === 1 ? 'property' : 'properties' }} awaiting review. These will go live once approved by our team.</p>
              <a routerLink="/landlord/my-properties">View →</a>
            </div>
          }

          <!-- Stats Overview -->
          <div class="stats-grid">
            <div class="stat-card stat-primary">
              <div class="stat-icon">🏠</div>
              <div class="stat-info">
                <div class="stat-value">{{ d.totalProperties }}</div>
                <div class="stat-label">Total properties</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-green">✅</div>
              <div class="stat-info">
                <div class="stat-value">{{ d.publishedProperties }}</div>
                <div class="stat-label">Published</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-blue">💬</div>
              <div class="stat-info">
                <div class="stat-value">{{ d.unreadInquiries }}</div>
                <div class="stat-label">New messages</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-orange">📅</div>
              <div class="stat-info">
                <div class="stat-value">{{ d.pendingAppointments }}</div>
                <div class="stat-label">Pending viewings</div>
              </div>
            </div>
          </div>

          <div class="dashboard-grid">
            <!-- Properties Overview -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2>Properties overview</h2>
                <a routerLink="/landlord/my-properties" class="card-link">Manage all →</a>
              </div>
              <div class="card-body">
                <div class="property-status-grid">
                  <div class="status-item">
                    <div class="status-dot status-draft"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.draftProperties }}</span>
                      <span class="status-label">Drafts</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-dot status-pending"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.pendingReviewProperties }}</span>
                      <span class="status-label">Pending review</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-dot status-published"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.publishedProperties }}</span>
                      <span class="status-label">Published</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-dot status-rented"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.rentedProperties }}</span>
                      <span class="status-label">Rented</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-dot status-rejected"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.rejectedProperties }}</span>
                      <span class="status-label">Rejected</span>
                    </div>
                  </div>
                  <div class="status-item">
                    <div class="status-dot status-unavailable"></div>
                    <div class="status-info">
                      <span class="status-count">{{ d.unavailableProperties }}</span>
                      <span class="status-label">Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="dashboard-card">
              <div class="card-header">
                <h2>Quick actions</h2>
              </div>
              <div class="card-body">
                <div class="quick-actions-list">
                  <a routerLink="/landlord/add-property" class="quick-action-item">
                    <div class="action-icon">➕</div>
                    <div class="action-info">
                      <div class="action-title">Add new property</div>
                      <div class="action-desc">List a new rental property</div>
                    </div>
                    <span class="action-arrow">→</span>
                  </a>
                  <a routerLink="/messages" class="quick-action-item">
                    <div class="action-icon">💬</div>
                    <div class="action-info">
                      <div class="action-title">Messages</div>
                      <div class="action-desc">{{ d.unreadInquiries }} unread inquiries</div>
                    </div>
                    <span class="action-arrow">→</span>
                  </a>
                  <a routerLink="/appointments" class="quick-action-item">
                    <div class="action-icon">📅</div>
                    <div class="action-info">
                      <div class="action-title">Viewings</div>
                      <div class="action-desc">Manage viewing appointments</div>
                    </div>
                    <span class="action-arrow">→</span>
                  </a>
                  <a routerLink="/applications" class="quick-action-item">
                    <div class="action-icon">📝</div>
                    <div class="action-info">
                      <div class="action-title">Applications</div>
                      <div class="action-desc">Review rental applications</div>
                    </div>
                    <span class="action-arrow">→</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Performance -->
            <div class="dashboard-card dashboard-card-wide">
              <div class="card-header">
                <h2>Performance</h2>
              </div>
              <div class="card-body">
                <div class="performance-grid">
                  <div class="performance-item">
                    <div class="performance-label">Monthly portfolio value</div>
                    <div class="performance-value">{{ d.monthlyPortfolioValueETB | number }} ETB</div>
                    <div class="performance-desc">Total rent across all published properties</div>
                  </div>
                  <div class="performance-item">
                    <div class="performance-label">Total inquiries</div>
                    <div class="performance-value">{{ d.totalInquiries }}</div>
                    <div class="performance-desc">All messages received</div>
                  </div>
                  <div class="performance-item">
                    <div class="performance-label">Applications</div>
                    <div class="performance-value">{{ d.totalApplications }}</div>
                    <div class="performance-desc">{{ d.pendingApplications }} pending review</div>
                  </div>
                  <div class="performance-item">
                    <div class="performance-label">Active tenancies</div>
                    <div class="performance-value">{{ d.rentedProperties }}</div>
                    <div class="performance-desc">Currently rented out</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .landlord-dashboard {
      min-height: 100vh;
      background: #f9fafb;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 2rem 0 1.5rem;
      margin-bottom: 2rem;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .dashboard-header h1 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .dashboard-header p {
      color: #6b7280;
      font-size: 0.95rem;
    }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-add:hover {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transform: translateY(-1px);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem 3rem;
    }

    .loading-card {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      color: #991b1b;
    }

    .btn-retry {
      margin-left: auto;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      color: #1e40af;
    }

    .alert-banner p {
      flex: 1;
      margin: 0;
    }

    .alert-banner a {
      color: #1e40af;
      font-weight: 600;
      text-decoration: none;
    }

    .alert-banner a:hover {
      text-decoration: underline;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .stat-primary {
      background: linear-gradient(135deg, #f0fdf4 0%, white 100%);
      border-color: #86efac;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 12px;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .stat-icon-green { background: #dcfce7; }
    .stat-icon-blue { background: #dbeafe; }
    .stat-icon-orange { background: #fed7aa; }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
      line-height: 1;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    .dashboard-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .dashboard-card-wide {
      grid-column: 1 / -1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .card-header h2 {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
    }

    .card-link {
      color: var(--primary);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
    }

    .card-link:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 1.25rem;
    }

    .property-status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 10px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-draft { background: #9ca3af; }
    .status-pending { background: #f59e0b; }
    .status-published { background: #10b981; }
    .status-rented { background: #3b82f6; }
    .status-rejected { background: #ef4444; }
    .status-unavailable { background: #6b7280; }

    .status-count {
      display: block;
      font-weight: 700;
      color: #111827;
    }

    .status-label {
      display: block;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .quick-actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-action-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      text-decoration: none;
      border-radius: 10px;
      transition: background 0.2s;
    }

    .quick-action-item:hover {
      background: #f9fafb;
    }

    .action-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .action-info {
      flex: 1;
    }

    .action-title {
      font-weight: 600;
      color: #111827;
      font-size: 0.9rem;
    }

    .action-desc {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .action-arrow {
      color: #9ca3af;
    }

    .performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .performance-item {
      text-align: center;
    }

    .performance-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .performance-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .performance-desc {
      color: #9ca3af;
      font-size: 0.8125rem;
    }

    @media (max-width: 968px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .property-status-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .property-status-grid {
        grid-template-columns: 1fr;
      }
      
      .performance-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LandlordDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<LandlordDashboard | null>(null);

  readonly quickActions: QuickAction[] = [
    { label: 'My Properties', link: '/landlord/my-properties', hint: 'Manage, pause or delete your listings' },
    { label: 'Add Property', link: '/landlord/add-property', hint: 'Publish a new home for renters' },
    { label: 'Messages', link: '/messages', hint: 'Answer renter inquiries' },
    { label: 'Appointments', link: '/appointments', hint: 'Confirm viewing appointments' },
    { label: 'Applications', link: '/applications', hint: 'Review rental applications' },
    { label: 'Support', link: '/support', hint: 'Get help from the ETrental team' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getLandlordDashboard().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.dashboard.set(res.data);
        } else {
          this.error.set(res.errors && res.errors.length ? res.errors.join(' ') : 'Your dashboard could not be loaded right now.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The server did not respond. Please check your connection and try again.');
      }
    });
  }
}
