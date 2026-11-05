import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

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
}
