import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordDto, UpdateProfileDto, UserProfile } from '../../../core/models/profile.model';

interface ProfileDetails extends UserProfile {
  createdAtUtc?: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Account Settings</span>
          <h1>My Profile</h1>
          <p>Manage your personal details, account information, and security settings.</p>
        </div>
        @if (profile(); as data) {
          <span class="badge badge-green">{{ data.subscriptionTier }} plan</span>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your profile...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Your profile could not be loaded.</strong>
          <span>{{ message }}</span>
          <div class="alert-actions">
            <button class="btn btn-outline btn-sm" (click)="loadProfile()">Try again</button>
          </div>
        </div>
      } @else {
        @if (profile(); as data) {
          <section class="profile-hero">
            @if (data.profilePictureUrl && !avatarError()) {
              <img class="profile-avatar" [src]="data.profilePictureUrl" [alt]="data.fullName + ' profile photo'" referrerpolicy="no-referrer" (error)="avatarError.set(true)" />
            } @else {
              <span class="profile-avatar profile-avatar-initials">
                {{ data.firstName.charAt(0) }}{{ data.lastName.charAt(0) }}
              </span>
            }
            <div class="profile-hero-details">
              <span class="eyebrow">
                {{ data.roles.includes('Landlord') ? 'LANDLORD ACCOUNT' : 'RENTER ACCOUNT' }}
              </span>
              <h2>{{ data.fullName }}</h2>
              <p>{{ data.email }}</p>
            </div>
            <div class="profile-hero-badges">
              @for (role of data.roles; track role) {
                <span class="badge badge-green">{{ role }}</span>
              }
            </div>
          </section>
        }
        @if (saveErrors().length > 0) {
          <div class="alert alert-danger">
            <strong>We could not save your profile.</strong>
            @for (message of saveErrors(); track message) {
              <div>{{ message }}</div>
            }
          </div>
        }
        @if (savedMessage(); as message) {
          <div class="alert alert-success">{{ message }}</div>
        }

        <div class="grid-2">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Personal details</span>
              <span class="muted">Used for your account and property listings</span>
            </div>
            <div class="panel-body">
              <div class="form-group">
                <label class="form-label" for="firstName">First name</label>
                <input id="firstName" class="form-control" type="text" [(ngModel)]="firstName" name="firstName" />
                @if (showValidation) {
                  @if (firstNameError(); as message) {
                    <span class="field-error">{{ message }}</span>
                  }
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="lastName">Last name</label>
                <input id="lastName" class="form-control" type="text" [(ngModel)]="lastName" name="lastName" />
                @if (showValidation) {
                  @if (lastNameError(); as message) {
                    <span class="field-error">{{ message }}</span>
                  }
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="phoneNumber">Phone number</label>
                <input
                  id="phoneNumber"
                  class="form-control"
                  type="tel"
                  [(ngModel)]="phoneNumber"
                  name="phoneNumber"
                  placeholder="+251 9XX XXX XXX"
                />
                <span class="muted">Used for appointment confirmations only.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="profilePictureUrl">Profile picture URL</label>
                <input
                  id="profilePictureUrl"
                  class="form-control"
                  type="url"
                  [(ngModel)]="profilePictureUrl"
                  name="profilePictureUrl"
                  placeholder="https://..."
                />
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="saveProfile()">
                  {{ saving() ? 'Saving...' : 'Save changes' }}
                </button>
                @if (saving()) {
                  <span class="muted">Sending your update to the platform...</span>
                }
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">Account facts</span>
              <span class="muted">Read only</span>
            </div>
            <div class="panel-body">
              @if (profile(); as data) {
                <div class="fact-row">
                  <span class="stat-label">Account ID</span>
                  <span class="fact-value">{{ data.id }}</span>
                </div>
                <div class="divider"></div>
                <div class="fact-row">
                  <span class="stat-label">Email</span>
                  <span class="fact-value">{{ data.email }}</span>
                </div>
                <div class="divider"></div>
                <div class="fact-row">
                  <span class="stat-label">Full name</span>
                  <span class="fact-value">{{ data.fullName }}</span>
                </div>
                <div class="divider"></div>
                <div class="fact-row">
                  <span class="stat-label">Roles</span>
                  <span class="fact-badges">
                    @for (role of data.roles; track role) {
                      <span class="badge badge-green">{{ role }}</span>
                    }
                  </span>
                </div>
                <div class="divider"></div>
                <div class="fact-row">
                  <span class="stat-label">Subscription tier</span>
                  <span class="fact-value">{{ data.subscriptionTier }}</span>
                </div>
                <div class="divider"></div>
                <div class="fact-row">
                  <span class="stat-label">Account created</span>
                  <span class="fact-value">
                    @if (accountCreated(); as created) {
                      {{ created | date: 'longDate' }}
                    } @else {
                      <span class="muted">Not exposed by the platform yet</span>
                    }
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Change password</span>
            <span class="muted">Use at least 6 characters</span>
          </div>
          <div class="panel-body">
            @if (passwordErrors().length > 0) {
              <div class="alert alert-danger">
                @for (message of passwordErrors(); track message) {
                  <div>{{ message }}</div>
                }
              </div>
            }
            @if (passwordMessage(); as message) {
              <div class="alert alert-success">{{ message }}</div>
            }

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  class="form-control"
                  type="password"
                  [(ngModel)]="currentPassword"
                  name="currentPassword"
                  autocomplete="current-password"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="newPassword">New password</label>
                <input
                  id="newPassword"
                  class="form-control"
                  type="password"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <button type="button" class="btn btn-primary" [disabled]="changingPassword()" (click)="changePassword()">
              {{ changingPassword() ? 'Updating...' : 'Update password' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-hero {
      display: flex;
      align-items: center;
      gap: .9rem;
      margin-bottom: 1rem;
      padding: .9rem 1rem;
      border: 1px solid #e2e9e3;
      border-radius: 12px;
      background: linear-gradient(120deg, #fff 0%, #f1f8f3 100%);
    }
    .profile-avatar {
      display: grid;
      width: 58px;
      height: 58px;
      flex: 0 0 58px;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background: #e2f1e7;
      color: #176b4d;
      font-size: 1.1rem;
      font-weight: 800;
      object-fit: cover;
    }
    .profile-hero-details {
      min-width: 0;
      flex: 1;
    }
    .profile-hero-details h2 {
      margin: .1rem 0;
      color: #142820;
      font-size: 1.15rem;
      font-weight: 800;
    }
    .profile-hero-details p {
      overflow: hidden;
      color: #718078;
      font-size: .82rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .profile-hero-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: .35rem;
    }
    .fact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      justify-content: space-between;
    }
    .fact-value {
      max-width: 70%;
      overflow-wrap: anywhere;
      font-weight: 600;
      color: var(--secondary);
      text-align: right;
    }
    .fact-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .field-error {
      color: #991b1b;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .alert-actions {
      margin-top: 0.5rem;
    }

    @media (max-width: 600px) {
      .profile-hero {
        flex-wrap: wrap;
      }
      .profile-hero-badges {
        width: 100%;
        justify-content: flex-start;
        padding-left: 3.5rem;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private changeDetector = inject(ChangeDetectorRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly accountCreated = signal<string | null>(null);
  readonly loading = signal<boolean>(true);
  readonly avatarError = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly saving = signal<boolean>(false);
  readonly savedMessage = signal<string | null>(null);
  readonly saveErrors = signal<string[]>([]);

  readonly changingPassword = signal<boolean>(false);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordErrors = signal<string[]>([]);

  showValidation = false;

  firstName = '';
  lastName = '';
  phoneNumber = '';
  profilePictureUrl = '';

  currentPassword = '';
  newPassword = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          const details = res.data as ProfileDetails;
          this.profile.set(details);
          this.firstName = details.firstName;
          this.lastName = details.lastName;
          this.phoneNumber = details.phoneNumber ?? '';
          this.profilePictureUrl = details.profilePictureUrl ?? '';
          this.accountCreated.set(details.createdAtUtc ?? null);
          this.changeDetector.markForCheck();
          return;
        }
        this.error.set(res.errors.length > 0 ? res.errors.join(' ') : 'The profile service returned an empty response.');
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not reach the server. Please check your connection and try again.');
        this.changeDetector.markForCheck();
      }
    });
  }

  firstNameError(): string | null {
    return this.firstName.trim().length === 0 ? 'First name is required.' : null;
  }

  lastNameError(): string | null {
    return this.lastName.trim().length === 0 ? 'Last name is required.' : null;
  }

  saveProfile(): void {
    this.showValidation = true;
    this.saveErrors.set([]);
    this.savedMessage.set(null);

    if (this.firstNameError() || this.lastNameError()) {
      return;
    }

    const dto: UpdateProfileDto = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phoneNumber: this.phoneNumber.trim().length > 0 ? this.phoneNumber.trim() : null,
      profilePictureUrl: this.profilePictureUrl.trim().length > 0 ? this.profilePictureUrl.trim() : null
    };

    this.saving.set(true);
    this.profileService.updateProfile(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.succeeded && res.data) {
          const details = res.data as ProfileDetails;
          this.profile.set(details);
          this.firstName = details.firstName;
          this.lastName = details.lastName;
          this.phoneNumber = details.phoneNumber ?? '';
          this.profilePictureUrl = details.profilePictureUrl ?? '';
          this.authService.syncProfile({
            firstName: details.firstName,
            lastName: details.lastName,
            email: details.email,
            phoneNumber: details.phoneNumber ?? '',
            profilePictureUrl: details.profilePictureUrl ?? null,
          });
          this.showValidation = false;
          this.savedMessage.set('Your profile has been updated.');
        } else {
          this.saveErrors.set(res.errors.length > 0 ? res.errors : ['We could not save your profile.']);
        }
      },
      error: () => {
        this.saving.set(false);
        this.saveErrors.set(['We could not reach the server while saving your profile.']);
      }
    });
  }

  changePassword(): void {
    this.passwordErrors.set([]);
    this.passwordMessage.set(null);

    const errors: string[] = [];
    if (this.currentPassword.trim().length === 0) {
      errors.push('Your current password is required.');
    }
    if (this.newPassword.trim().length < 6) {
      errors.push('The new password must be at least 6 characters long.');
    }
    if (errors.length > 0) {
      this.passwordErrors.set(errors);
      return;
    }

    const dto: ChangePasswordDto = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.changingPassword.set(true);
    this.profileService.changePassword(dto).subscribe({
      next: (res) => {
        this.changingPassword.set(false);
        if (res.succeeded) {
          this.currentPassword = '';
          this.newPassword = '';
          this.passwordMessage.set('Your password has been changed.');
        } else {
          this.passwordErrors.set(res.errors.length > 0 ? res.errors : ['We could not change your password.']);
        }
      },
      error: () => {
        this.changingPassword.set(false);
        this.passwordErrors.set(['We could not reach the server while changing your password.']);
      }
    });
  }
}
