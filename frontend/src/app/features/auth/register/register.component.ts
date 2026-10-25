import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    ]],
    role: ['renter', Validators.required],
    agencyName: [''],
    taxIdentificationNumber: [''],
    subCity: ['']
  });

  get passwordStrengthMessage(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (!password) return '';
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
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const val = this.registerForm.value;
    const payload = {
      firstName: val.firstName,
      lastName: val.lastName,
      email: val.email,
      phoneNumber: val.phoneNumber,
      password: val.password,
      role: val.role,
      agencyName: val.agencyName,
      taxIdentificationNumber: val.taxIdentificationNumber,
      subCity: val.subCity,
      city: 'Addis Ababa'
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Redirect based on role returned from the server
        const roles = res.data?.user?.roles || [];
        if (roles.includes('Agency')) {
          this.router.navigate(['/agency/dashboard']);
        } else if (roles.includes('Landlord')) {
          this.router.navigate(['/landlord/dashboard']);
        } else if (roles.includes('Renter')) {
          this.router.navigate(['/renter/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0] || 'Registration failed. Please check your details.';
      }
    });
  }
}
