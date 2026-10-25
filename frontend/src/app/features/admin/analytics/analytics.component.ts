import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboard } from '../../../core/models/admin.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-left">
          <h1>Analytics Dashboard</h1>
          <p>Platform performance metrics and insights</p>
        </div>
      </header>
      <div class="admin-content">
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        } @else if (dashboard) {
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon users">👥</div>
              <div class="stat-content">
                <span class="stat-label">Total Users</span>
                <span class="stat-value">{{ dashboard.totalUsers | number }}</span>
                <span class="stat-sub">{{ dashboard.activeUsers | number }} active</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon properties">🏠</div>
              <div class="stat-content">
                <span class="stat-label">Properties</span>
                <span class="stat-value">{{ dashboard.totalProperties | number }}</span>
                <span class="stat-sub">{{ dashboard.publishedProperties | number }} published</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon revenue">💰</div>
              <div class="stat-content">
                <span class="stat-label">Revenue</span>
                <span class="stat-value">{{ dashboard.totalSubscriptionRevenueETB | number }} ETB</span>
                <span class="stat-sub">{{ dashboard.activePremiumSubscriptions | number }} subscriptions</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon agencies">🏢</div>
              <div class="stat-content">
                <span class="stat-label">Agencies</span>
                <span class="stat-value">{{ dashboard.totalAgencies | number }}</span>
                <span class="stat-sub">{{ dashboard.verifiedAgencies | number }} verified</span>
              </div>
            </div>
          </div>

          <div class="charts-section">
            <div class="chart-card">
              <h3>User Distribution</h3>
              <div class="distribution-grid">
                <div class="dist-item">
                  <span class="dist-label">Renters</span>
                  <span class="dist-value">{{ dashboard.totalRenters | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Landlords</span>
                  <span class="dist-value">{{ dashboard.totalLandlords | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Agencies</span>
                  <span class="dist-value">{{ dashboard.totalAgencies | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Support</span>
                  <span class="dist-value">{{ dashboard.totalSupportAgents | number }}</span>
                </div>
              </div>
            </div>

            <div class="chart-card">
              <h3>Property Status</h3>
              <div class="distribution-grid">
                <div class="dist-item">
                  <span class="dist-label">Published</span>
                  <span class="dist-value">{{ dashboard.publishedProperties | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Pending Review</span>
                  <span class="dist-value">{{ dashboard.pendingReviewProperties | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Rejected</span>
                  <span class="dist-value">{{ dashboard.rejectedProperties | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Rented</span>
                  <span class="dist-value">{{ dashboard.rentedProperties | number }}</span>
                </div>
              </div>
            </div>

            <div class="chart-card">
              <h3>Activity Metrics</h3>
              <div class="distribution-grid">
                <div class="dist-item">
                  <span class="dist-label">Inquiries</span>
                  <span class="dist-value">{{ dashboard.totalInquiries | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Appointments</span>
                  <span class="dist-value">{{ dashboard.totalAppointments | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Applications</span>
                  <span class="dist-value">{{ dashboard.totalApplications | number }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Reports</span>
                  <span class="dist-value">{{ dashboard.openReports | number }}</span>
                </div>
              </div>
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
    }
    .admin-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .admin-header p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
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
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .stat-icon.users {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    }
    .stat-icon.properties {
      background: linear-gradient(135deg, #10b981, #059669);
    }
    .stat-icon.revenue {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    .stat-icon.agencies {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    .stat-content {
      flex: 1;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      display: block;
      margin: 0.25rem 0;
    }
    .stat-sub {
      font-size: 0.75rem;
      color: #64748b;
    }
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
    }
    .chart-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }
    .distribution-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .dist-item {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
    }
    .dist-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
    }
    .dist-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  dashboard: AdminDashboard | null = null;
  isLoading = true;

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.dashboard = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
