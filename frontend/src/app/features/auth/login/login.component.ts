import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: ``,
  // link of the template is: frontend/src/app/features/auth/login/login.component.html
  templateUrl: './login.component.html',
  //  // link of the style is: frontend/src/app/features/auth/login/login.component.css
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  fillDemo(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value as { email: string; password: string };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          // Redirect based on role returned from the server
          const roles = res.data?.user?.roles || [];
          if (roles.includes('Admin')) {
            this.router.navigate(['/admin/dashboard']);
          } else if (roles.includes('Agency')) {
            this.router.navigate(['/agency/dashboard']);
          } else if (roles.includes('Landlord')) {
            this.router.navigate(['/landlord/dashboard']);
          } else if (roles.includes('Renter')) {
            this.router.navigate(['/renter/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.errors?.[0] || 'Invalid email or password. Please try again.';
      },
    });
  }
}
