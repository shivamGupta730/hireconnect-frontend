import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container animate-fade">
      <div class="glass-panel auth-card">
        <h2 class="text-center mb-4">Create Account</h2>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          
          <div class="form-group">
            <label class="form-label">I am a...</label>
            <div class="role-selector">
              <label>
                <input type="radio" formControlName="role" [value]="UserRole.Candidate" /> Candidate
              </label>
              <label>
                <input type="radio" formControlName="role" [value]="UserRole.Recruiter" /> Recruiter
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" formControlName="email" placeholder="Email" required />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Password (min 6 chars)" required />
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="registerForm.invalid || isLoading">
            {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
          </button>
          
        </form>
        
        <p class="text-center mt-4">
          Already have an account? <a routerLink="/auth/login">Login</a>
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
    .role-selector {
      display: flex;
      gap: 1.5rem;
      margin-top: 0.5rem;
    }
    .role-selector label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.Candidate, Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notificationService.showToast('Account created successfully!', 'success');
          const user = this.authService.currentUserValue;
          if (user?.role === UserRole.Candidate) {
            this.router.navigate(['/candidate']);
          } else if (user?.role === UserRole.Recruiter) {
            this.router.navigate(['/recruiter']);
          } else {
            this.router.navigate(['/auth/login']);
          }
        } else {
          this.isLoading = false;
          this.notificationService.showToast(res.message || 'Registration failed', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Registration failed';
        this.notificationService.showToast(msg, 'error');
      }
    });
  }
}
