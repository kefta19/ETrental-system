import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AgencyProfile, AgencyStatus } from '../../../core/models/agency.model';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-left">
          <h1>Agency Verification</h1>
          <p>Review and verify agency applications</p>
        </div>
        <div class="header-right">
          <select [(ngModel)]="statusFilter" (change)="loadAgencies()" class="filter-select">
            <option [value]="null">All Status</option>
            <option [value]="0">Pending</option>
            <option [value]="1">Verified</option>
            <option [value]="2">Rejected</option>
          </select>
        </div>
      </header>
      <div class="admin-content">
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading agencies...</p>
          </div>
        } @else if (agencies.length === 0) {
          <div class="empty-state">
            <span class="empty-emoji">🏢</span>
            <h2>No Agencies Found</h2>
            <p>No agencies match the current filter.</p>
          </div>
        } @else {
          <div class="agencies-grid">
            @for (agency of agencies; track agency.id) {
              <div class="agency-card">
                <div class="card-header">
                  <div class="agency-avatar">{{ agency.name?.charAt(0) || 'A' }}</div>
                  <div class="agency-info">
                    <h3>{{ agency.name }}</h3>
                    <span class="status-badge" [class.status-pending]="agency.status === 0" [class.status-verified]="agency.status === 1" [class.status-rejected]="agency.status === 2">
                      {{ getStatusText(agency.status) }}
                    </span>
                  </div>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">{{ agency.officialEmail }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Phone:</span>
                    <span class="value">{{ agency.officialPhone }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">License:</span>
                    <span class="value">{{ agency.businessLicenseNumber || 'N/A' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Members:</span>
                    <span class="value">{{ agency.memberCount || 0 }}</span>
                  </div>
                </div>
                @if (agency.status === 0) {
                  <div class="card-actions">
                    <button class="action-btn verify" (click)="verifyAgency(agency)">✓ Verify</button>
                    <button class="action-btn reject" (click)="rejectAgency(agency)">✕ Reject</button>
                  </div>
                }
              </div>
            }
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
    .filter-select {
      padding: 0.625rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
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
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
    }
    .empty-emoji {
      font-size: 4rem;
      margin-bottom: 1rem;
      display: block;
    }
    .empty-state h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }
    .empty-state p {
      color: #64748b;
      margin: 0;
    }
    .agencies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .agency-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .card-header {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .agency-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .agency-info {
      flex: 1;
    }
    .agency-info h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }
    .status-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge.status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-badge.status-verified {
      background: #dcfce7;
      color: #166534;
    }
    .status-badge.status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    .card-body {
      padding: 1.25rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
      font-size: 0.875rem;
    }
    .value {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }
    .card-actions {
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      gap: 0.75rem;
    }
    .action-btn {
      flex: 1;
      padding: 0.625rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn.verify {
      background: #dcfce7;
      color: #166534;
    }
    .action-btn.verify:hover {
      background: #d1fae5;
    }
    .action-btn.reject {
      background: #fee2e2;
      color: #991b1b;
    }
    .action-btn.reject:hover {
      background: #fecaca;
    }
  `]
})
export class AgenciesComponent implements OnInit {
  private adminService = inject(AdminService);

  agencies: AgencyProfile[] = [];
  isLoading = true;
  statusFilter: AgencyStatus | null = null;

  ngOnInit() {
    this.loadAgencies();
  }

  loadAgencies() {
    this.isLoading = true;
    this.adminService.getAgencies(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.agencies = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getStatusText(status: AgencyStatus): string {
    switch (status) {
      case AgencyStatus.Pending: return 'Pending';
      case AgencyStatus.Verified: return 'Verified';
      case AgencyStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  verifyAgency(agency: AgencyProfile) {
    const notes = prompt('Enter verification notes (optional):');
    this.adminService.verifyAgency(agency.id, { approved: true, verificationNotes: notes || '' }).subscribe({
      next: () => {
        this.loadAgencies();
      }
    });
  }

  rejectAgency(agency: AgencyProfile) {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      this.adminService.verifyAgency(agency.id, { approved: false, rejectionReason: reason }).subscribe({
        next: () => {
          this.loadAgencies();
        }
      });
    }
  }
}
