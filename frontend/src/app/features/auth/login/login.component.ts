import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container animate-fade">
      <div class="glass-panel auth-card">
        <h2 class="text-center mb-4">Welcome Back</h2>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" formControlName="email" placeholder="Enter your email" required />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Enter password" required />
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loginForm.invalid || isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
          
        </form>
        
        <p class="text-center mt-4">
          Don't have an account? <a routerLink="/auth/register">Sign Up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 4rem);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notificationService.showToast('Login successful', 'success');
          // Use the role from the stored user (already hydrated with correct userId)
          const user = this.authService.currentUserValue;
          if (user?.role === UserRole.Candidate) {
            this.router.navigate(['/candidate']);
          } else if (user?.role === UserRole.Recruiter) {
            this.router.navigate(['/recruiter']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.isLoading = false;
          this.notificationService.showToast(res.message || 'Login failed', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Login failed';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }
}
