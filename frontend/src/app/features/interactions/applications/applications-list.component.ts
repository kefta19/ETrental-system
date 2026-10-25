import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InteractionService } from '../../../core/services/interaction.service';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { RentalApplication, ApplicationStatus } from '../../../core/models/interaction.model';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="applications-page container">
      <div class="page-header">
        <div>
          <span class="badge badge-green">Tenant Screening & Leases</span>
          <h1 class="page-title">Rental Applications</h1>
          <p class="page-subtitle">Track digital rental applications and evaluate prospective tenants.</p>
        </div>

        <div class="tabs-bar">
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'sent'" 
            (click)="switchTab('sent')"
          >
            My Applications ({{ myApplications.length }})
          </button>
          @if (isHost) {
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'received'" 
              (click)="switchTab('received')"
            >
              Received as Host ({{ receivedApplications.length }})
            </button>
          }
        </div>
      </div>

      @if (isLoading) {
        <div class="loading-state">
          <p>Loading applications...</p>
        </div>
      } @else if (currentList.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No applications found in this folder</h3>
          <p>
            {{ activeTab === 'sent' ? 'You have not submitted any rental applications yet.' : 'No tenant applications have been submitted for your listings yet.' }}
          </p>
          <a routerLink="/properties" class="btn btn-primary">Find Rental Properties</a>
        </div>
      } @else {
        <div class="apps-grid">
          @for (app of currentList; track app.id) {
            <div class="app-card">
              <div class="app-card-header">
                <div>
                  <h3 class="app-prop-title">{{ app.property?.title }}</h3>
                  <p class="app-location">📍 {{ app.property?.subCity }}, {{ app.property?.neighborhood }} — {{ app.property?.rentAmountETB | number }} ETB/mo</p>
                </div>
                <div class="status-pill status-{{ getStatusClass(app.status) }}">
                  {{ getStatusLabel(app.status) }}
                </div>
              </div>

              <div class="app-specs">
                <div class="spec-cell">
                  <span class="lbl">Applicant Name:</span>
                  <strong>{{ app.applicantName }}</strong>
                  <span class="sub-contact">📞 {{ app.applicantPhone || 'Phone upon approval' }}</span>
                </div>

                <div class="spec-cell">
                  <span class="lbl">Desired Move-in:</span>
                  <strong>{{ app.proposedMoveInDate | date:'mediumDate' }}</strong>
                </div>

                <div class="spec-cell">
                  <span class="lbl">Lease Term:</span>
                  <strong>{{ app.proposedLeaseDurationMonths }} Months</strong>
                </div>

                <div class="spec-cell">
                  <span class="lbl">Occupants:</span>
                  <strong>{{ app.proposedOccupantsCount }} Person(s)</strong>
                </div>
              </div>

              <!-- Income Statement -->
              <div class="income-box">
                <span class="lbl">Employment / Income Verification:</span>
                <p>{{ app.employmentOrIncomeSummary }}</p>
              </div>

              @if (app.additionalNotes) {
                <div class="notes-box">
                  <span class="lbl">Applicant Notes:</span>
                  <p>{{ app.additionalNotes }}</p>
                </div>
              }

              @if (app.hostDecisionNotes) {
                <div class="decision-box">
                  <span class="lbl">Host Decision Notes:</span>
                  <p>{{ app.hostDecisionNotes }}</p>
                </div>
              }

              <!-- Landlord Action Buttons -->
              @if (activeTab === 'received' && app.status === 0) {
                <div class="app-actions">
                  <button class="btn btn-primary btn-sm" (click)="decideApplication(app, 2)">
                    ✓ Accept Application
                  </button>
                  <button class="btn btn-outline-danger btn-sm" (click)="decideApplication(app, 3)">
                    ✕ Decline
                  </button>
                  <button class="btn btn-secondary btn-sm" (click)="openMarkAsRentedModal(app)">
                    🎉 Finalize & Mark Property as Rented
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Mark as Rented Modal -->
      @if (selectedAppForRented) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Finalize Tenancy & Mark as Rented</h3>
              <button class="close-x" (click)="selectedAppForRented = null">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Record the agreed tenancy terms for <strong>{{ selectedAppForRented.property?.title }}</strong>. This will set the listing status to <strong>RENTED</strong>.
              </p>

              <div class="form-group">
                <label class="lbl">Tenant Name:</label>
                <input type="text" [(ngModel)]="rentedTenantName" class="form-control" />
              </div>

              <div class="grid-2-col">
                <div class="form-group">
                  <label class="lbl">Agreed Monthly Rent (ETB):</label>
                  <input type="number" [(ngModel)]="rentedAmountETB" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="lbl">Lease Term (Months):</label>
                  <input type="number" [(ngModel)]="rentedLeaseMonths" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label class="lbl">Tenancy Start Date:</label>
                <input type="date" [(ngModel)]="rentedStartDate" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="selectedAppForRented = null">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="isFinalizing || !rentedTenantName || !rentedAmountETB" 
                (click)="confirmMarkAsRented()"
              >
                {{ isFinalizing ? 'Finalizing...' : 'Confirm Tenancy' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .applications-page {
      padding: 2.5rem 1.5rem 4rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-subtitle {
      color: var(--text-muted);
    }
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      background: #e2e8f0;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
    }
    .tab-btn {
      padding: 0.5rem 1.25rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: white;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 5rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .apps-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .app-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1.5rem;
    }
    .app-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    .app-prop-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .app-location {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .status-pill {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
    }
    .status-submitted { background: #fef3c7; color: #b45309; }
    .status-underreview { background: #e0f2fe; color: #0369a1; }
    .status-accepted { background: #dcfce7; color: #15803d; }
    .status-rejected { background: #fee2e2; color: #b91c1c; }
    .status-withdrawn { background: #f1f5f9; color: #64748b; }

    .app-specs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .spec-cell {
      display: flex;
      flex-direction: column;
    }
    .lbl {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
    }
    .sub-contact {
      font-size: 0.85rem;
      color: #64748b;
    }
    .income-box {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }
    .income-box p {
      font-size: 0.9rem;
      color: #334155;
      margin: 0;
    }
    .notes-box, .decision-box {
      background: #fafafa;
      padding: 0.6rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }
    .decision-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .app-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
      flex-wrap: wrap;
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }
    .btn-outline-danger {
      background: transparent;
      border: 1px solid #fca5a5;
      color: #ef4444;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
    }
    .btn-outline-danger:hover {
      background: #fee2e2;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: white;
      border-radius: var(--radius-lg);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .close-x {
      background: transparent;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: #94a3b8;
    }
    .modal-body {
      padding: 1.25rem;
    }
    .modal-sub {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
  `]
})
export class ApplicationsListComponent implements OnInit {
  private interactionService = inject(InteractionService);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);

  myApplications: RentalApplication[] = [];
  receivedApplications: RentalApplication[] = [];
  isLoading = true;
  isFinalizing = false;

  activeTab: 'sent' | 'received' = 'sent';

  selectedAppForRented: RentalApplication | null = null;
  rentedTenantName = '';
  rentedAmountETB = 0;
  rentedLeaseMonths = 12;
  rentedStartDate = '';

  get isHost(): boolean {
    return this.authService.isLandlord() || this.authService.isAgency() || this.authService.isAdmin();
  }

  get currentList(): RentalApplication[] {
    return this.activeTab === 'sent' ? this.myApplications : this.receivedApplications;
  }

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading = true;
    this.interactionService.getMyApplications().subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.myApplications = res.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    if (this.isHost) {
      this.interactionService.getReceivedApplications().subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.receivedApplications = res.data;
          }
        }
      });
    }
  }

  switchTab(tab: 'sent' | 'received') {
    this.activeTab = tab;
  }

  decideApplication(app: RentalApplication, status: number) {
    this.interactionService.updateApplicationStatus(app.id, {
      status: status,
      hostDecisionNotes: status === 2 ? 'Application accepted! Welcome to your new home.' : 'Declined at this time.'
    }).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          app.status = res.data.status;
          app.hostDecisionNotes = res.data.hostDecisionNotes;
        }
      }
    });
  }

  openMarkAsRentedModal(app: RentalApplication) {
    this.selectedAppForRented = app;
    this.rentedTenantName = app.applicantName;
    this.rentedAmountETB = app.property?.rentAmountETB || 0;
    this.rentedLeaseMonths = app.proposedLeaseDurationMonths || 12;
    this.rentedStartDate = new Date().toISOString().substring(0, 10);
  }

  confirmMarkAsRented() {
    if (!this.selectedAppForRented) return;
    this.isFinalizing = true;

    this.propertyService.markAsRented(this.selectedAppForRented.propertyId, {
      tenantName: this.rentedTenantName,
      tenantId: this.selectedAppForRented.applicantId,
      agreedRentAmountETB: this.rentedAmountETB,
      agreedLeaseMonths: this.rentedLeaseMonths,
      tenancyStartDateUtc: new Date(this.rentedStartDate).toISOString()
    }).subscribe({
      next: (res) => {
        this.isFinalizing = false;
        if (res.succeeded) {
          // Update application status to accepted as well
          this.decideApplication(this.selectedAppForRented!, 2);
          this.selectedAppForRented = null;
        }
      },
      error: () => {
        this.isFinalizing = false;
      }
    });
  }

  getStatusClass(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.Submitted: return 'submitted';
      case ApplicationStatus.UnderReview: return 'underreview';
      case ApplicationStatus.Accepted: return 'accepted';
      case ApplicationStatus.Rejected: return 'rejected';
      case ApplicationStatus.Withdrawn: return 'withdrawn';
      default: return 'submitted';
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.Submitted: return 'Submitted';
      case ApplicationStatus.UnderReview: return 'Under Review';
      case ApplicationStatus.Accepted: return 'Accepted';
      case ApplicationStatus.Rejected: return 'Declined';
      case ApplicationStatus.Withdrawn: return 'Withdrawn';
      default: return 'Submitted';
    }
  }
}
