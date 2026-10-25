import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgencyService } from '../../../core/services/agency.service';
import { AgencyMember, AgencyStaffRole, InviteStaffDto } from '../../../core/models/agency.model';

@Component({
  selector: 'app-agency-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Agency Workspace</span>
          <h1>Staff Team</h1>
          <p>Invite colleagues, control their roles and assign them to the properties they manage.</p>
        </div>
        <span class="badge badge-green">{{ staff().length }} Members</span>
      </div>

      @if (actionMessage(); as message) {
        <div class="alert alert-success">{{ message }}</div>
      }

      @if (temporaryPassword(); as tempPassword) {
        <div class="alert alert-success temp-alert">
          <div class="row-between">
            <div class="stack">
              <strong>Temporary password for {{ temporaryPasswordOwner() }}</strong>
              <span class="temp-value">{{ tempPassword }}</span>
              <span class="muted">Share this once with the new staff member. It is not displayed again.</span>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="dismissTemporaryPassword()">Dismiss</button>
          </div>
        </div>
      }

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Invite Staff</span>
          <span class="muted">The invitee receives access to your agency listings</span>
        </div>
        <div class="panel-body">
          @if (inviteError(); as message) {
            <div class="alert alert-danger">{{ message }}</div>
          }
          @if (inviteSuccess(); as message) {
            <div class="alert alert-success">{{ message }}</div>
          }

          <form (ngSubmit)="invite()">
            <div class="toolbar">
              <div class="form-group">
                <label class="form-label" for="invite-name">Full Name</label>
                <input id="invite-name" type="text" class="form-control" [(ngModel)]="inviteFullName" name="inviteFullName" placeholder="e.g. Almaz Kebede" />
              </div>
              <div class="form-group">
                <label class="form-label" for="invite-email">Email</label>
                <input id="invite-email" type="email" class="form-control" [(ngModel)]="inviteEmail" name="inviteEmail" placeholder="name@agency.et" />
              </div>
              <div class="form-group">
                <label class="form-label" for="invite-phone">Phone</label>
                <input id="invite-phone" type="tel" class="form-control" [(ngModel)]="invitePhoneNumber" name="invitePhoneNumber" placeholder="+251..." />
              </div>
              <div class="form-group">
                <label class="form-label" for="invite-role">Role</label>
                <select id="invite-role" class="form-control" [(ngModel)]="inviteRole" name="inviteRole">
                  @for (role of staffRoles; track role) {
                    <option [ngValue]="role">{{ roleLabel(role) }}</option>
                  }
                </select>
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="inviting()">
                {{ inviting() ? 'Sending...' : 'Invite Staff' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your staff team...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Staff list unavailable.</strong> {{ message }}
        </div>
        <button class="btn btn-outline btn-sm" (click)="loadStaff()">Try again</button>
      } @else if (staff().length === 0) {
        <div class="empty-state">
          <h3>No staff members yet</h3>
          <p>Invite your first colleague to start managing agency listings together.</p>
        </div>
      } @else {
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Team Members</span>
            <span class="muted">Roles control what each member can do with listings</span>
          </div>
          <div class="panel-body">
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Properties</th>
                    <th>Status</th>
                    <th>Property Assignment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (member of staff(); track member.membershipId) {
                    <tr>
                      <td>
                        <div class="stack">
                          <strong>{{ member.fullName }}</strong>
                          <span class="muted">{{ member.email }}</span>
                        </div>
                      </td>
                      <td>{{ member.phoneNumber || '—' }}</td>
                      <td>
                        <select class="form-control role-select" [ngModel]="member.role" (ngModelChange)="onRoleChange(member, $event)">
                          @for (role of staffRoles; track role) {
                            <option [ngValue]="role">{{ roleLabel(role) }}</option>
                          }
                        </select>
                      </td>
                      <td>{{ member.joinedAtUtc | date: 'mediumDate' }}</td>
                      <td>{{ member.assignedPropertyCount }}</td>
                      <td>
                        <span class="status-pill" [class.status-green]="member.isActive" [class.status-amber]="!member.isActive">
                          {{ member.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <div class="stack assignment-cell">
                          <input
                            type="text"
                            class="form-control"
                            placeholder="Property GUID"
                            [ngModel]="propertyDrafts[member.userId] || ''"
                            (ngModelChange)="setPropertyDraft(member.userId, $event)"
                          />
                          <div class="row-actions">
                            <button class="btn btn-outline btn-sm" [disabled]="isBusy(member.membershipId, 'assign')" (click)="assignProperty(member)">
                              Assign
                            </button>
                            <button class="btn btn-ghost btn-sm" [disabled]="isBusy(member.membershipId, 'remove')" (click)="removeProperty(member)">
                              Remove
                            </button>
                          </div>
                          @if (assignmentErrors[member.userId]; as assignmentError) {
                            <span class="error-text">{{ assignmentError }}</span>
                          }
                        </div>
                      </td>
                      <td>
                        <button
                          class="btn btn-danger btn-sm"
                          [disabled]="!member.isActive || isBusy(member.membershipId, 'deactivate')"
                          (click)="deactivate(member)"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .temp-alert {
      border-width: 2px;
    }
    .temp-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: var(--secondary);
    }
    .table-scroll {
      overflow-x: auto;
    }
    .role-select {
      min-width: 150px;
      padding: 0.4rem 0.6rem;
      font-size: 0.85rem;
    }
    .assignment-cell {
      min-width: 210px;
      gap: 0.5rem;
    }
    .assignment-cell .form-control {
      padding: 0.4rem 0.6rem;
      font-size: 0.85rem;
    }
    .row-actions {
      display: flex;
      gap: 0.4rem;
    }
    .error-text {
      color: #991b1b;
      font-size: 0.78rem;
    }
  `]
})
export class AgencyStaffComponent implements OnInit {
  private agencyService = inject(AgencyService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly inviting = signal(false);
  readonly inviteError = signal<string | null>(null);
  readonly inviteSuccess = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly busyAction = signal<string | null>(null);
  readonly temporaryPassword = signal<string | null>(null);
  readonly temporaryPasswordOwner = signal<string | null>(null);
  readonly staff = signal<AgencyMember[]>([]);

  readonly staffRoles: AgencyStaffRole[] = [
    AgencyStaffRole.AgencyManager,
    AgencyStaffRole.Agent,
    AgencyStaffRole.Viewer
  ];

  private readonly guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  inviteFullName = '';
  inviteEmail = '';
  invitePhoneNumber = '';
  inviteRole: AgencyStaffRole = AgencyStaffRole.Agent;

  propertyDrafts: Record<string, string> = {};
  assignmentErrors: Record<string, string> = {};

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agencyService.getStaff().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.staff.set(res.data);
        } else {
          this.error.set(res.errors && res.errors.length ? res.errors.join(' ') : 'Your staff list could not be loaded right now.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The server did not respond. Please check your connection and try again.');
      }
    });
  }

  invite(): void {
    const email = this.inviteEmail.trim();
    const fullName = this.inviteFullName.trim();
    if (email.length === 0 || fullName.length === 0) {
      this.inviteError.set('A full name and an email address are required to send an invitation.');
      return;
    }

    const dto: InviteStaffDto = {
      email: email,
      fullName: fullName,
      phoneNumber: this.invitePhoneNumber.trim() ? this.invitePhoneNumber.trim() : null,
      role: this.inviteRole
    };

    this.inviting.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(null);

    this.agencyService.inviteStaff(dto).subscribe({
      next: (res) => {
        this.inviting.set(false);
        if (res.succeeded && res.data) {
          this.inviteSuccess.set(`${res.data.fullName} was invited as ${this.roleLabel(res.data.role)}.`);
          if (res.data.temporaryPassword) {
            this.temporaryPassword.set(res.data.temporaryPassword);
            this.temporaryPasswordOwner.set(res.data.email);
          }
          this.resetInviteForm();
          this.loadStaff();
        } else {
          this.inviteError.set(res.errors && res.errors.length ? res.errors.join(' ') : 'The invitation could not be sent.');
        }
      },
      error: () => {
        this.inviting.set(false);
        this.inviteError.set('The server did not respond. Please try again.');
      }
    });
  }

  resetInviteForm(): void {
    this.inviteFullName = '';
    this.inviteEmail = '';
    this.invitePhoneNumber = '';
    this.inviteRole = AgencyStaffRole.Agent;
  }

  dismissTemporaryPassword(): void {
    this.temporaryPassword.set(null);
    this.temporaryPasswordOwner.set(null);
  }

  onRoleChange(member: AgencyMember, role: AgencyStaffRole): void {
    const nextRole = Number(role) as AgencyStaffRole;
    if (nextRole === member.role) {
      return;
    }

    this.busyAction.set(this.busyKey(member.membershipId, 'role'));
    this.agencyService.updateStaffRole(member.membershipId, nextRole).subscribe({
      next: (res) => {
        this.busyAction.set(null);
        if (res.succeeded) {
          this.actionMessage.set(`${member.fullName} is now a ${this.roleLabel(nextRole)}.`);
          this.loadStaff();
        } else {
          this.actionMessage.set(res.errors && res.errors.length ? res.errors.join(' ') : 'The role could not be updated.');
          this.loadStaff();
        }
      },
      error: () => {
        this.busyAction.set(null);
        this.actionMessage.set('The server did not respond while updating the role.');
        this.loadStaff();
      }
    });
  }

  deactivate(member: AgencyMember): void {
    if (!confirm(`Deactivate ${member.fullName}? They will lose access to agency listings.`)) {
      return;
    }

    this.busyAction.set(this.busyKey(member.membershipId, 'deactivate'));
    this.agencyService.deactivateStaff(member.membershipId).subscribe({
      next: (res) => {
        this.busyAction.set(null);
        if (res.succeeded) {
          this.actionMessage.set(`${member.fullName} was deactivated.`);
        } else {
          this.actionMessage.set(res.errors && res.errors.length ? res.errors.join(' ') : 'The staff member could not be deactivated.');
        }
        this.loadStaff();
      },
      error: () => {
        this.busyAction.set(null);
        this.actionMessage.set('The server did not respond while deactivating the staff member.');
      }
    });
  }

  setPropertyDraft(userId: string, value: string): void {
    this.propertyDrafts = { ...this.propertyDrafts, [userId]: value };
  }

  assignProperty(member: AgencyMember): void {
    const propertyId = (this.propertyDrafts[member.userId] || '').trim();
    if (!this.isValidGuid(propertyId)) {
      this.setAssignmentError(member.userId, 'Enter a valid property GUID before assigning.');
      return;
    }

    this.setAssignmentError(member.userId, '');
    this.busyAction.set(this.busyKey(member.membershipId, 'assign'));

    this.agencyService.assignStaffToProperty(member.userId, propertyId).subscribe({
      next: (res) => {
        this.busyAction.set(null);
        if (res.succeeded) {
          this.actionMessage.set(`${member.fullName} was assigned to property ${propertyId}.`);
          this.loadStaff();
        } else {
          this.setAssignmentError(member.userId, res.errors && res.errors.length ? res.errors.join(' ') : 'The assignment failed.');
        }
      },
      error: () => {
        this.busyAction.set(null);
        this.setAssignmentError(member.userId, 'The server did not respond while assigning the property.');
      }
    });
  }

  removeProperty(member: AgencyMember): void {
    const propertyId = (this.propertyDrafts[member.userId] || '').trim();
    if (!this.isValidGuid(propertyId)) {
      this.setAssignmentError(member.userId, 'Enter a valid property GUID before removing.');
      return;
    }

    this.setAssignmentError(member.userId, '');
    this.busyAction.set(this.busyKey(member.membershipId, 'remove'));

    this.agencyService.removeStaffFromProperty(member.userId, propertyId).subscribe({
      next: (res) => {
        this.busyAction.set(null);
        if (res.succeeded) {
          this.actionMessage.set(`${member.fullName} was removed from property ${propertyId}.`);
          this.loadStaff();
        } else {
          this.setAssignmentError(member.userId, res.errors && res.errors.length ? res.errors.join(' ') : 'The removal failed.');
        }
      },
      error: () => {
        this.busyAction.set(null);
        this.setAssignmentError(member.userId, 'The server did not respond while removing the property.');
      }
    });
  }

  setAssignmentError(userId: string, message: string): void {
    this.assignmentErrors = { ...this.assignmentErrors, [userId]: message };
  }

  isValidGuid(value: string): boolean {
    return this.guidPattern.test(value);
  }

  isBusy(membershipId: string, action: string): boolean {
    return this.busyAction() === this.busyKey(membershipId, action);
  }

  private busyKey(membershipId: string, action: string): string {
    return `${membershipId}:${action}`;
  }

  roleLabel(role: AgencyStaffRole): string {
    const name = AgencyStaffRole[role];
    return name ? name : 'Unknown';
  }
}
