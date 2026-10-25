import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

interface QuickAction {
  label: string;
  link: string;
  hint: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-left">
          <h1>Admin Dashboard</h1>
          <p>Platform overview and management metrics</p>
        </div>
        @if (stats(); as s) {
          <div class="header-badges">
            <span class="badge badge-green">{{ s.totalUsers }} Total Users</span>
            @if (s.pendingModerations > 0) {
              <span class="badge badge-amber">{{ s.pendingModerations }} Pending</span>
            }
          </div>
        }
      </header>

      <div class="admin-content">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading dashboard metrics...</p>
          </div>
        } @else if (error(); as message) {
          <div class="alert alert-danger">
            <strong>Dashboard unavailable.</strong> {{ message }}
          </div>
          <button class="btn btn-outline" (click)="load()">Try again</button>
        } @else if (stats(); as s) {
          @if (s.pendingModerations > 0) {
            <div class="alert alert-success review-hint">
              <strong>{{ s.pendingModerations }} listing(s) awaiting review.</strong>
              Review and approve property submissions before they appear in public search.
              <a routerLink="/admin/moderation" class="hint-link">Review moderation queue</a>
            </div>
          }

          @if (s.pendingAgencyVerifications > 0) {
            <div class="alert alert-info review-hint">
              <strong>{{ s.pendingAgencyVerifications }} agency verification(s) pending.</strong>
              Agency accounts require verification before they can list properties.
              <a routerLink="/admin/agencies" class="hint-link">Review agency requests</a>
            </div>
          }

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">User Management</span>
              <a routerLink="/admin/users" class="btn btn-ghost btn-sm">Manage users</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Total Users</span>
                  <span class="stat-value">{{ s.totalUsers }}</span>
                  <span class="stat-hint">All registered accounts</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Active Users</span>
                  <span class="stat-value">{{ s.activeUsers }}</span>
                  <span class="stat-hint">Currently active accounts</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Restricted Users</span>
                  <span class="stat-value">{{ s.restrictedUsers }}</span>
                  <span class="stat-hint">Account access limited</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Renters</span>
                  <span class="stat-value">{{ s.renterCount }}</span>
                  <span class="stat-hint">Property seekers</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Landlords</span>
                  <span class="stat-value">{{ s.landlordCount }}</span>
                  <span class="stat-hint">Property owners</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Agencies</span>
                  <span class="stat-value">{{ s.agencyCount }}</span>
                  <span class="stat-hint">Real estate agencies</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Content Moderation</span>
              <a routerLink="/admin/moderation" class="btn btn-ghost btn-sm">View queue</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Pending Moderations</span>
                  <span class="stat-value">{{ s.pendingModerations }}</span>
                  <span class="stat-hint">Awaiting review</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Approved Today</span>
                  <span class="stat-value">{{ s.approvedToday }}</span>
                  <span class="stat-hint">Published listings</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Rejected Today</span>
                  <span class="stat-value">{{ s.rejectedToday }}</span>
                  <span class="stat-hint">Rejected submissions</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Total Properties</span>
                  <span class="stat-value">{{ s.totalProperties }}</span>
                  <span class="stat-hint">All property listings</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Agency Verification</span>
              <a routerLink="/admin/agencies" class="btn btn-ghost btn-sm">Manage agencies</a>
            </div>
            <div class="panel-body">
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Pending Verifications</span>
                  <span class="stat-value">{{ s.pendingAgencyVerifications }}</span>
                  <span class="stat-hint">Awaiting review</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Verified Agencies</span>
                  <span class="stat-value">{{ s.verifiedAgencies }}</span>
                  <span class="stat-hint">Approved agencies</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Rejected Agencies</span>
                  <span class="stat-value">{{ s.rejectedAgencies }}</span>
                  <span class="stat-hint">Denied applications</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Quick Actions</span>
            </div>
            <div class="panel-body">
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
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .admin-header {
      background: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .header-left p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    .header-badges {
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-green {
      background: #dcfce7;
      color: #166534;
    }
    .badge-amber {
      background: #fef3c7;
      color: #92400e;
    }
    .admin-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .alert {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .alert-success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .alert-info {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .alert-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .review-hint {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    .hint-link {
      font-weight: 700;
      text-decoration: underline;
      color: inherit;
    }
    .panel {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .panel-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .panel-body {
      padding: 1.5rem;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      padding: 1.25rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      display: block;
      margin-bottom: 0.25rem;
    }
    .stat-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      text-decoration: none;
      transition: background 0.2s;
    }
    .list-row:last-child {
      border-bottom: none;
    }
    .list-row:hover {
      background: #f8fafc;
    }
    .stack {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .stack strong {
      color: #1e293b;
      font-weight: 600;
    }
    .muted {
      color: #64748b;
      font-size: 0.875rem;
    }
    .quick-arrow {
      color: #3b82f6;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .quick-link:hover strong {
      color: #3b82f6;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-outline {
      border: 1px solid #d1d5db;
      background: white;
      color: #1e293b;
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-ghost {
      background: transparent;
      color: #3b82f6;
      border: 1px solid transparent;
    }
    .btn-ghost:hover {
      background: #eff6ff;
    }
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<any | null>(null);

  readonly quickActions: QuickAction[] = [
    { label: 'Moderation Queue', link: '/admin/moderation', hint: 'Review pending property submissions' },
    { label: 'User Management', link: '/admin/users', hint: 'Manage user accounts and restrictions' },
    { label: 'Agency Verification', link: '/admin/agencies', hint: 'Verify agency applications' },
    { label: 'Analytics', link: '/admin/analytics', hint: 'View platform analytics and reports' },
    { label: 'Settings', link: '/admin/settings', hint: 'Configure platform settings' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    
    // For now, use mock data. In production, call adminService.getDashboardStats()
    setTimeout(() => {
      this.loading.set(false);
      this.stats.set({
        totalUsers: 150,
        activeUsers: 142,
        restrictedUsers: 3,
        renterCount: 85,
        landlordCount: 45,
        agencyCount: 20,
        pendingModerations: 12,
        approvedToday: 8,
        rejectedToday: 2,
        totalProperties: 250,
        pendingAgencyVerifications: 5,
        verifiedAgencies: 15,
        rejectedAgencies: 0
      });
    }, 500);
  }
}
