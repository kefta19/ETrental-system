import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgencyService } from '../../../core/services/agency.service';
import { AgencyProfile, AgencyStatus, UpdateAgencyDto } from '../../../core/models/agency.model';

@Component({
  selector: 'app-agency-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Agency Settings</span>
          <h1>{{ profile()?.name || 'Agency Profile' }}</h1>
          <p>Keep your business details current and track the admin verification status of your brokerage.</p>
        </div>
        @if (profile(); as p) {
          <span class="status-pill {{ statusClass(p.status) }}">{{ statusLabel(p.status) }}</span>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your agency profile...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Profile unavailable.</strong> {{ message }}
        </div>
        <button class="btn btn-outline btn-sm" (click)="load()">Try again</button>
      } @else if (profile(); as p) {
        @if (success(); as message) {
          <div class="alert alert-success">{{ message }}</div>
        }
        @if (saveError(); as message) {
          <div class="alert alert-danger">{{ message }}</div>
        }

        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Business Details</span>
              <span class="muted">Used on your published listings</span>
            </div>
            <div class="panel-body">
              <form (ngSubmit)="save()">
                <div class="form-group">
                  <label class="form-label" for="agency-name">Agency Name</label>
                  <input id="agency-name" type="text" class="form-control" [(ngModel)]="formName" name="agencyName" placeholder="e.g. Addis Property Group" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-description">Description</label>
                  <textarea id="agency-description" rows="4" class="form-control" [(ngModel)]="formDescription" name="agencyDescription" placeholder="Tell renters what your agency specialises in"></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-logo">Logo URL</label>
                  <input id="agency-logo" type="url" class="form-control" [(ngModel)]="formLogoUrl" name="agencyLogoUrl" placeholder="https://..." />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-city">City</label>
                  <input id="agency-city" type="text" class="form-control" [(ngModel)]="formCity" name="agencyCity" placeholder="e.g. Addis Ababa" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-subcity">Sub-City</label>
                  <input id="agency-subcity" type="text" class="form-control" [(ngModel)]="formSubCity" name="agencySubCity" placeholder="e.g. Bole" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-address">Office Address</label>
                  <input id="agency-address" type="text" class="form-control" [(ngModel)]="formOfficeAddress" name="agencyOfficeAddress" placeholder="e.g. Bole Sub-City, Wawel Street" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-phone">Official Phone</label>
                  <input id="agency-phone" type="tel" class="form-control" [(ngModel)]="formOfficialPhone" name="agencyPhone" placeholder="+251..." />
                </div>

                <div class="form-group">
                  <label class="form-label" for="agency-email">Official Email</label>
                  <input id="agency-email" type="email" class="form-control" [(ngModel)]="formOfficialEmail" name="agencyEmail" placeholder="contact@agency.et" />
                </div>

                <div class="divider"></div>

                <div class="row-between">
                  <span class="muted">Last submitted: {{ p.submittedAtUtc | date: 'mediumDate' }}</span>
                  <button type="submit" class="btn btn-primary" [disabled]="saving() || !formComplete()">
                    {{ saving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div>
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Verification Facts</span>
                <span class="muted">Read-only</span>
              </div>
              <div class="panel-body">
                <div class="list-row">
                  <span class="muted">Tax Identification Number</span>
                  <strong>{{ p.taxIdentificationNumber || 'Not provided' }}</strong>
                </div>
                <div class="list-row">
                  <span class="muted">Business Licence Number</span>
                  <strong>{{ p.businessLicenseNumber || 'Not provided' }}</strong>
                </div>
                <div class="list-row">
                  <span class="muted">Submitted On</span>
                  <strong>{{ p.submittedAtUtc | date: 'mediumDate' }}</strong>
                </div>
                <div class="list-row">
                  <span class="muted">Verified On</span>
                  <strong>{{ p.verifiedAtUtc ? (p.verifiedAtUtc | date: 'mediumDate') : 'Not verified yet' }}</strong>
                </div>
                <div class="list-row">
                  <span class="muted">Team Members</span>
                  <strong>{{ p.memberCount }}</strong>
                </div>
                <div class="list-row">
                  <span class="muted">Managed Properties</span>
                  <strong>{{ p.propertyCount }}</strong>
                </div>

                @if (p.rejectionReason) {
                  <div class="divider"></div>
                  <span class="stat-label">Rejection Reason</span>
                  <div class="alert alert-danger rejection-box">{{ p.rejectionReason }}</div>
                }

                @if (p.verificationNotes) {
                  <div class="divider"></div>
                  <span class="stat-label">Verification Notes</span>
                  <p class="muted notes-text">{{ p.verificationNotes }}</p>
                }
              </div>
            </div>

            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Verification Submission</span>
              </div>
              <div class="panel-body">
                @if (canSubmitVerification(p)) {
                  <p class="muted">
                    Your profile is {{ statusLabel(p.status).toLowerCase() }}. Submit it for verification and an ETrental
                    administrator will review the business details, tax id and licence before your agency is approved.
                  </p>
                  <button class="btn btn-primary" [disabled]="submitting()" (click)="submitVerification()">
                    {{ submitting() ? 'Submitting...' : 'Submit for Verification' }}
                  </button>
                } @else {
                  <p class="muted">
                    Verification submissions are only accepted while your agency is pending or rejected.
                    Your current status is {{ statusLabel(p.status).toLowerCase() }}, so there is nothing to submit right now.
                  </p>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .rejection-box {
      margin-top: 0.5rem;
      margin-bottom: 0;
    }
    .notes-text {
      margin-top: 0.35rem;
      white-space: pre-line;
    }
  `]
})
export class AgencyProfileComponent implements OnInit {
  private agencyService = inject(AgencyService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly profile = signal<AgencyProfile | null>(null);

  formName = '';
  formDescription = '';
  formLogoUrl = '';
  formCity = '';
  formSubCity = '';
  formOfficeAddress = '';
  formOfficialPhone = '';
  formOfficialEmail = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agencyService.getProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.applyProfile(res.data);
        } else {
          this.error.set(res.errors && res.errors.length ? res.errors.join(' ') : 'Your agency profile could not be loaded right now.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('The server did not respond. Please check your connection and try again.');
      }
    });
  }

  applyProfile(profile: AgencyProfile): void {
    this.profile.set(profile);
    this.formName = profile.name || '';
    this.formDescription = profile.description || '';
    this.formLogoUrl = profile.logoUrl || '';
    this.formCity = profile.city || '';
    this.formSubCity = profile.subCity || '';
    this.formOfficeAddress = profile.officeAddress || '';
    this.formOfficialPhone = profile.officialPhone || '';
    this.formOfficialEmail = profile.officialEmail || '';
  }

  formComplete(): boolean {
    return this.formName.trim().length > 0 &&
      this.formCity.trim().length > 0 &&
      this.formSubCity.trim().length > 0 &&
      this.formOfficialPhone.trim().length > 0 &&
      this.formOfficialEmail.trim().length > 0;
  }

  save(): void {
    const dto: UpdateAgencyDto = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
      city: this.formCity.trim(),
      subCity: this.formSubCity.trim(),
      officeAddress: this.formOfficeAddress.trim() ? this.formOfficeAddress.trim() : null,
      officialPhone: this.formOfficialPhone.trim(),
      officialEmail: this.formOfficialEmail.trim(),
      logoUrl: this.formLogoUrl.trim() ? this.formLogoUrl.trim() : null
    };

    this.saving.set(true);
    this.saveError.set(null);
    this.success.set(null);

    this.agencyService.updateProfile(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.succeeded && res.data) {
          this.applyProfile(res.data);
          this.success.set('Agency profile updated successfully.');
        } else {
          this.saveError.set(res.errors && res.errors.length ? res.errors.join(' ') : 'The agency profile could not be saved.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('The server did not respond. Please try again.');
      }
    });
  }

  canSubmitVerification(profile: AgencyProfile): boolean {
    return profile.status === AgencyStatus.Pending || profile.status === AgencyStatus.Rejected;
  }

  submitVerification(): void {
    const profile = this.profile();
    if (!profile || !this.canSubmitVerification(profile)) {
      return;
    }
    if (!confirm('Submit your agency profile for admin verification review?')) {
      return;
    }

    this.submitting.set(true);
    this.saveError.set(null);
    this.success.set(null);

    this.agencyService.submitVerification().subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.succeeded && res.data) {
          this.applyProfile(res.data);
          this.success.set('Your agency was submitted for verification. An administrator will review it shortly.');
        } else {
          this.saveError.set(res.errors && res.errors.length ? res.errors.join(' ') : 'The verification request could not be sent.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.saveError.set('The server did not respond. Please try again.');
      }
    });
  }

  statusLabel(status: AgencyStatus): string {
    const name = AgencyStatus[status];
    return name ? name : 'Unknown';
  }

  statusClass(status: AgencyStatus): string {
    switch (status) {
      case AgencyStatus.Verified:
        return 'status-green';
      case AgencyStatus.Pending:
        return 'status-amber';
      case AgencyStatus.Rejected:
      case AgencyStatus.Suspended:
        return 'status-red';
      default:
        return '';
    }
  }
}
