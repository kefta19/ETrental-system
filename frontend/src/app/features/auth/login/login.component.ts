import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { getAuthErrorMessage } from '../auth-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <aside class="auth-visual">
        <img
          class="visual-image"
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85"
          alt="Modern home with a welcoming outdoor space"
        />
        <div class="visual-overlay"></div>
        <div class="visual-content">
          <a class="brand" routerLink="/" aria-label="ETrental home">
            <img class="brand-image" src="/etrental-logo.png" alt="" />
            <span>ETrental</span>
          </a>
          <div class="visual-copy">
            <span class="eyebrow">A better way to find home</span>
            <h1>Find a place<br />to call your own.</h1>
            <p>Discover trusted rentals and make your next move with confidence.</p>
          </div>
          <span class="visual-caption">Thoughtful homes. Easier moves.</span>
        </div>
      </aside>

      <main class="auth-content">
        <section class="auth-card" aria-label="Sign in">
          <a class="form-brand" routerLink="/" aria-label="ETrental home">
            <img src="/etrental-logo.png" alt="ETrental" />
          </a>
          @if (errorMessage) {
            <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label" for="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                formControlName="email"
                class="form-control"
                [attr.aria-invalid]="loginForm.controls.email.touched && loginForm.controls.email.invalid"
                aria-describedby="login-email-error"
                placeholder="name@example.com"
                autocomplete="email"
              />
              @if (loginForm.controls.email.touched && loginForm.controls.email.hasError('required')) {
                <p id="login-email-error" class="field-error">Enter your email address.</p>
              } @else if (loginForm.controls.email.touched && loginForm.controls.email.hasError('email')) {
                <p id="login-email-error" class="field-error">Enter a valid email address.</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                formControlName="password"
                class="form-control"
                [attr.aria-invalid]="loginForm.controls.password.touched && loginForm.controls.password.invalid"
                aria-describedby="login-password-error"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
              @if (loginForm.controls.password.touched && loginForm.controls.password.hasError('required')) {
                <p id="login-password-error" class="field-error">Enter your password.</p>
              } @else if (loginForm.controls.password.touched && loginForm.controls.password.hasError('minlength')) {
                <p id="login-password-error" class="field-error">Password must be at least 6 characters.</p>
              }
            </div>

            <button
              type="submit"
              class="btn-block"
              [disabled]="isLoading"
            >
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-divider">
            <span>or continue with</span>
          </div>

          <button
            type="button"
            class="btn-google"
            (click)="continueWithGoogle()"
            [disabled]="isLoading || isGoogleLoading"
          >
            <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{{ isGoogleLoading ? 'Connecting...' : 'Sign in with Google' }}</span>
          </button>

          <div class="auth-footer">
            New to ETrental?
            <a routerLink="/register" class="link-primary">Create an account</a>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        height: 100dvh;
      }

      .auth-shell {
        height: 100vh;
        height: 100dvh;
        display: grid;
        grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.1fr);
        background: var(--bg-page, #fff);
      }

      .auth-visual {
        position: sticky;
        top: 0;
        height: 100vh;
        height: 100dvh;
        min-height: 0;
        overflow: hidden;
        background: #174536;
        color: #fff;
      }

      .visual-image,
      .visual-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .visual-image {
        object-fit: cover;
        object-position: center;
      }

      .visual-overlay {
        background: linear-gradient(180deg, rgb(9 35 27 / 38%) 0%, rgb(9 35 27 / 18%) 35%, rgb(9 35 27 / 78%) 100%);
      }

      .visual-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        padding: clamp(2rem, 5vw, 4.5rem);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        gap: 0.7rem;
        color: #fff;
        font-size: 1.2rem;
        font-weight: 750;
        letter-spacing: -0.03em;
      }

      .brand-image {
        display: grid;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        object-fit: contain;
      }

      .form-brand {
        display: flex;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .form-brand img {
        display: block;
        width: 5rem;
        height: 5rem;
        object-fit: contain;
      }

      .visual-copy {
        max-width: 470px;
        margin-bottom: 2rem;
      }

      .eyebrow {
        display: block;
        margin-bottom: 0.75rem;
        color: #059669;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .visual-copy .eyebrow {
        color: #a7f3d0;
      }

      .visual-copy h1 {
        margin: 0 0 1rem;
        font-size: clamp(2.5rem, 4.3vw, 4.25rem);
        font-weight: 750;
        letter-spacing: -0.055em;
        line-height: 1.05;
      }

      .visual-copy p {
        max-width: 390px;
        color: rgb(255 255 255 / 84%);
        font-size: 1.05rem;
        line-height: 1.7;
      }

      .visual-caption {
        color: rgb(255 255 255 / 76%);
        font-size: 0.8rem;
        letter-spacing: 0.04em;
      }

      .auth-content {
        display: grid;
        place-items: center;
        min-width: 0;
        padding: clamp(1.5rem, 4vw, 3.5rem);
        background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
      }

      .auth-card {
        width: min(100%, 440px);
      }

      .form-group {
        margin-bottom: 1.35rem;
      }

      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        color: #334155;
        font-size: 0.875rem;
        font-weight: 650;
      }

      .form-control {
        width: 100%;
        min-height: 3.25rem;
        padding: 0.8rem 1rem;
        border: 1px solid #dbe3eb;
        border-radius: 0.8rem;
        background: #fff;
        color: #0f172a;
        font: inherit;
        font-size: 0.95rem;
        transition: border-color 180ms ease, box-shadow 180ms ease;
      }

      .form-control::placeholder {
        color: #9aa8b8;
      }

      .form-control:hover {
        border-color: #b7c5d3;
      }

      .form-control:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 4px rgb(16 185 129 / 12%);
      }

      .field-error {
        margin: 0.4rem 0 0;
        color: #b91c1c;
        font-size: 0.8rem;
      }

      .btn-block {
        width: 100%;
        min-height: 3.35rem;
        margin-top: 0.35rem;
        padding: 0.85rem 1rem;
        border: 0;
        border-radius: 0.8rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        font: inherit;
        font-size: 0.98rem;
        font-weight: 750;
        cursor: pointer;
        box-shadow: 0 8px 18px rgb(5 150 105 / 20%);
        transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
      }

      .btn-block:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 11px 22px rgb(5 150 105 / 26%);
      }

      .btn-block:disabled {
        opacity: 0.58;
        cursor: not-allowed;
        box-shadow: none;
      }

      .auth-divider {
        display: flex;
        align-items: center;
        margin: 1.15rem 0;
        text-align: center;
        color: #94a3b8;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e2e8f0;
      }

      .auth-divider span {
        padding: 0 0.85rem;
      }

      .btn-google {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        width: 100%;
        min-height: 3.35rem;
        padding: 0.85rem 1rem;
        border: 1px solid #dbe3eb;
        border-radius: 0.8rem;
        background: #ffffff;
        color: #1e293b;
        font: inherit;
        font-size: 0.95rem;
        font-weight: 650;
        cursor: pointer;
        box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
      }

      .btn-google:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #cbd5e1;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
      }

      .btn-google:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-google .google-icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
      }

      /* Google Auth Modal */
      .google-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 180ms ease-out;
      }

      .google-modal-card {
        width: min(100%, 440px);
        background: #ffffff;
        border-radius: 1.2rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: scaleIn 180ms ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .google-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.15rem 1.35rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .google-modal-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .google-modal-brand h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
      }

      .modal-close-btn {
        background: transparent;
        border: 0;
        font-size: 1.6rem;
        line-height: 1;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.2rem 0.45rem;
        border-radius: 0.5rem;
        transition: all 150ms ease;
      }

      .modal-close-btn:hover {
        color: #0f172a;
        background: #f1f5f9;
      }

      .google-modal-body {
        padding: 1.35rem;
      }

      .google-modal-intro {
        margin: 0 0 1.15rem;
        font-size: 0.92rem;
        color: #475569;
        line-height: 1.5;
      }

      .google-account-pill {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        width: 100%;
        padding: 0.85rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.85rem;
        background: #f8fafc;
        cursor: pointer;
        text-align: left;
        font: inherit;
        transition: all 180ms ease;
        margin-bottom: 1.15rem;
      }

      .google-account-pill:hover {
        background: #ffffff;
        border-color: #10b981;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
        transform: translateY(-1px);
      }

      .google-avatar {
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 50%;
        background: #4285f4;
        color: #fff;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 1.05rem;
        flex-shrink: 0;
      }

      .google-account-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .account-name {
        font-weight: 650;
        font-size: 0.92rem;
        color: #0f172a;
      }

      .account-email {
        font-size: 0.8rem;
        color: #64748b;
      }

      .select-arrow {
        color: #94a3b8;
        font-size: 1.25rem;
      }

      .google-manual-entry {
        margin-bottom: 1.15rem;
      }

      .google-manual-entry .form-label {
        font-size: 0.82rem;
        margin-bottom: 0.35rem;
      }

      .manual-input-group {
        display: flex;
        gap: 0.5rem;
      }

      .manual-input-group .form-control {
        flex: 1;
        min-height: 2.65rem;
        font-size: 0.9rem;
        padding: 0.5rem 0.8rem;
      }

      .btn-submit-google {
        padding: 0.55rem 1rem;
        border: 0;
        border-radius: 0.75rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 650;
        cursor: pointer;
        white-space: nowrap;
        transition: all 180ms ease;
      }

      .btn-submit-google:hover:not(:disabled) {
        opacity: 0.95;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
      }

      .btn-submit-google:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .google-modal-hint {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.65rem 0.8rem;
        background: #f1f5f9;
        border-radius: 0.65rem;
        font-size: 0.76rem;
        color: #64748b;
        line-height: 1.4;
      }

      .google-modal-hint code {
        background: #e2e8f0;
        padding: 0.1rem 0.25rem;
        border-radius: 0.25rem;
        font-size: 0.73rem;
        color: #0f172a;
      }

      .auth-footer {
        margin-top: 1.75rem;
        color: #64748b;
        font-size: 0.9rem;
        text-align: center;
      }

      .link-primary {
        margin-left: 0.25rem;
        color: #047857;
        font-weight: 700;
        text-decoration: none;
      }

      .link-primary:hover {
        color: #065f46;
        text-decoration: underline;
      }

      .alert-danger {
        margin-bottom: 1.25rem;
        padding: 0.85rem 1rem;
        border: 1px solid #fecaca;
        border-radius: 0.8rem;
        background: #fef2f2;
        color: #991b1b;
        font-size: 0.9rem;
      }

      @media (max-width: 820px) {
        .auth-shell {
          grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
        }

        .visual-content {
          padding: 2rem;
        }

        .auth-content {
          padding: 2.5rem;
        }
      }

      @media (max-width: 640px) {
        .auth-shell {
          display: block;
          height: auto;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .auth-visual {
          position: relative;
          height: 150px;
          min-height: 0;
        }
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    // Check if the user was returned from a direct Google redirect
    this.googleAuthService.handleRedirectCallback().catch((err) => {
      this.errorMessage = err?.message || 'Google authentication failed.';
      this.changeDetector.markForCheck();
    });
  }

  fillDemo(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.controls.email.value.trim(),
      password: this.loginForm.controls.password.value,
    };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res?.succeeded || !res.data?.user) {
          this.errorMessage = getAuthErrorMessage(
            res?.errors,
            'Sign in did not complete. Please check your details and try again.'
          );
          this.changeDetector.markForCheck();
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination =
          returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : this.authService.dashboardRoute(res.data.user);
        this.router.navigateByUrl(destination);
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getAuthErrorMessage(
          err,
          'Invalid email or password. Please try again.'
        );
        this.changeDetector.markForCheck();
      },
    });
  }

  async continueWithGoogle() {
    this.errorMessage = '';
    this.isGoogleLoading = true;

    try {
      await this.googleAuthService.signInWithGoogle('renter');
    } catch (err: any) {
      this.isGoogleLoading = false;
      const msg = err?.message || '';
      if (
        !msg.includes('closed') &&
        !msg.includes('cancel') &&
        !msg.includes('access_denied') &&
        !msg.includes('popup_closed')
      ) {
        this.errorMessage = msg || 'Google Sign-in failed. Please try again.';
      }
      this.changeDetector.markForCheck();
    }
  }
}
