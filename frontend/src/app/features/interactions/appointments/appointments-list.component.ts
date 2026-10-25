import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { ViewingAppointment, AppointmentStatus } from '../../../core/models/interaction.model';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="appointments-page container">
      <div class="page-header">
        <div>
          <span class="badge badge-green">Ethiopian Property Tours</span>
          <h1 class="page-title">Viewing Appointments</h1>
          <p class="page-subtitle">Manage onsite property visits and viewing schedules.</p>
        </div>
        <a routerLink="/properties" class="btn btn-outline">Find More Listings</a>
      </div>

      @if (isLoading) {
        <div class="loading-state">
          <p>Loading viewing appointments...</p>
        </div>
      } @else if (appointments.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No viewing appointments scheduled</h3>
          <p>When you find an Ethiopian property you like, click "Book a Viewing Tour" on its detail page.</p>
          <a routerLink="/properties" class="btn btn-primary">Browse Properties</a>
        </div>
      } @else {
        <div class="appointments-list">
          @for (apt of appointments; track apt.id) {
            <div class="apt-card">
              <div class="apt-header">
                <div class="apt-prop-info">
                  <h3>{{ apt.property?.title }}</h3>
                  <p class="apt-location">📍 {{ apt.property?.subCity }}, {{ apt.property?.neighborhood }}</p>
                </div>
                <div class="status-pill status-{{ getStatusClass(apt.status) }}">
                  {{ getStatusLabel(apt.status) }}
                </div>
              </div>

              <div class="apt-grid">
                <div class="apt-detail-col">
                  <span class="lbl">Requested Date & Time:</span>
                  <strong>{{ apt.requestedDateTimeUtc | date:'medium' }}</strong>
                </div>

                @if (apt.confirmedDateTimeUtc) {
                  <div class="apt-detail-col">
                    <span class="lbl">Confirmed Visit Time:</span>
                    <strong class="text-green">{{ apt.confirmedDateTimeUtc | date:'medium' }}</strong>
                  </div>
                }

                <div class="apt-detail-col">
                  <span class="lbl">{{ isHost ? 'Visitor Name:' : 'Host Name:' }}</span>
                  <strong>{{ isHost ? apt.renterName : (apt.hostName || 'Property Landlord') }}</strong>
                  <span class="contact-sub">📞 {{ isHost ? (apt.renterPhone || 'Not shared') : (apt.hostPhone || 'Revealed on confirmation') }}</span>
                </div>
              </div>

              @if (apt.renterNotes) {
                <div class="notes-box">
                  <span class="lbl">Visitor Notes:</span>
                  <p>{{ apt.renterNotes }}</p>
                </div>
              }

              @if (apt.hostNotes) {
                <div class="notes-box host-note">
                  <span class="lbl">Host Instructions:</span>
                  <p>{{ apt.hostNotes }}</p>
                </div>
              }

              <!-- Host / Landlord Action Controls -->
              @if (isHost && apt.status === 0) {
                <div class="apt-actions">
                  <button class="btn btn-primary btn-sm" (click)="confirmAppointment(apt)">
                    ✓ Confirm Tour
                  </button>
                  <button class="btn btn-outline-danger btn-sm" (click)="openCancelModal(apt)">
                    ✕ Decline
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Cancel / Decline Modal -->
      @if (selectedAptForCancel) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Decline / Cancel Appointment</h3>
              <button class="close-x" (click)="selectedAptForCancel = null">×</button>
            </div>
            <div class="modal-body">
              <label class="lbl">Reason for Cancellation:</label>
              <textarea 
                [(ngModel)]="cancelReason" 
                rows="3" 
                class="form-control" 
                placeholder="e.g., The landlord is unavailable at this hour, please pick another slot..."
              ></textarea>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="selectedAptForCancel = null">Back</button>
              <button class="btn btn-danger" (click)="cancelAppointment()">Confirm Cancellation</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .appointments-page {
      padding: 2.5rem 1.5rem 4rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-subtitle {
      color: var(--text-muted);
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
    .empty-state h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .apt-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1.5rem;
    }
    .apt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    .apt-prop-info h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .apt-location {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .status-pill {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
    }
    .status-requested { background: #fef3c7; color: #b45309; }
    .status-confirmed { background: #dcfce7; color: #15803d; }
    .status-rescheduled { background: #e0f2fe; color: #0369a1; }
    .status-cancelled { background: #fee2e2; color: #b91c1c; }
    .status-completed { background: #f1f5f9; color: #475569; }

    .apt-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .apt-detail-col {
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
    .text-green {
      color: #15803d;
    }
    .contact-sub {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.2rem;
    }
    .notes-box {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }
    .notes-box p {
      font-size: 0.9rem;
      color: #334155;
      margin: 0;
    }
    .host-note {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .apt-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
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
    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
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
      max-width: 480px;
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
export class AppointmentsListComponent implements OnInit {
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);

  appointments: ViewingAppointment[] = [];
  isLoading = true;

  selectedAptForCancel: ViewingAppointment | null = null;
  cancelReason = '';

  get isHost(): boolean {
    return this.authService.isLandlord() || this.authService.isAgency() || this.authService.isAdmin();
  }

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.interactionService.getMyAppointments().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.appointments = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  confirmAppointment(apt: ViewingAppointment) {
    this.interactionService.updateAppointmentStatus(apt.id, {
      status: AppointmentStatus.Confirmed,
      confirmedDateTimeUtc: apt.requestedDateTimeUtc,
      hostNotes: 'Tour appointment confirmed by property host.'
    }).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          apt.status = AppointmentStatus.Confirmed;
          apt.confirmedDateTimeUtc = res.data.confirmedDateTimeUtc;
          apt.hostNotes = res.data.hostNotes;
        }
      }
    });
  }

  openCancelModal(apt: ViewingAppointment) {
    this.selectedAptForCancel = apt;
    this.cancelReason = '';
  }

  cancelAppointment() {
    const apt = this.selectedAptForCancel;
    if (!apt) return;
    this.interactionService.updateAppointmentStatus(apt.id, {
      status: AppointmentStatus.Cancelled,
      cancellationReason: this.cancelReason || 'Declined by host.'
    }).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          apt.status = AppointmentStatus.Cancelled;
          apt.cancellationReason = res.data.cancellationReason;
          this.selectedAptForCancel = null;
        }
      }
    });
  }

  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.Requested: return 'requested';
      case AppointmentStatus.Confirmed: return 'confirmed';
      case AppointmentStatus.Rescheduled: return 'rescheduled';
      case AppointmentStatus.Cancelled: return 'cancelled';
      case AppointmentStatus.Completed: return 'completed';
      default: return 'requested';
    }
  }

  getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.Requested: return 'Requested';
      case AppointmentStatus.Confirmed: return 'Confirmed';
      case AppointmentStatus.Rescheduled: return 'Rescheduled';
      case AppointmentStatus.Cancelled: return 'Cancelled';
      case AppointmentStatus.Completed: return 'Completed';
      default: return 'Requested';
    }
  }
}
