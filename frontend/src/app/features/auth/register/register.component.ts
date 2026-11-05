import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAuthErrorMessage } from '../auth-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    role: ['renter', Validators.required]
  });

  get passwordStrengthMessage(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (!password) return 'Enter a password.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
    if (!/[@$!%*?&]/.test(password)) return 'Password must include at least one special character (@$!%*?&).';
    return 'Strong password.';
  }

  togglePassword() {
    this.hidePassword = !this.hidePassword;
  }

  setRole(role: string) {
    this.registerForm.patchValue({ role });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const val = this.registerForm.getRawValue();
    const payload = {
      firstName: val.firstName.trim(),
      lastName: val.lastName.trim(),
      email: val.email.trim(),
      phoneNumber: val.phoneNumber.trim(),
      password: val.password,
      role: val.role,
      city: 'Addis Ababa'
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.succeeded || !res.data?.user) {
          this.errorMessage = getAuthErrorMessage(
            res.errors,
            'Registration did not complete. Please check your details and try again.'
          );
          this.changeDetector.markForCheck();
          return;
        }
        this.router.navigateByUrl(this.authService.dashboardRoute(res.data.user));
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = getAuthErrorMessage(
          err,
          'Registration failed. Please check your details.'
        );
        this.changeDetector.markForCheck();
      }
    });
  }
}
