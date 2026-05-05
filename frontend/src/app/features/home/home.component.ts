import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hero-section">
      <div class="content animate-slide-down text-center">
        <h1 class="hero-title">Find Your Dream Job Today</h1>
        <p class="hero-subtitle">Connect with top companies and unlock your career potential with HireConnect.</p>
        
        <ng-container *ngIf="isLoggedIn$ | async as loggedIn; else loggedOut">
          <div class="action-buttons mt-4 flex gap-4 justify-center">
            <a *ngIf="loggedIn.role === UserRole.Candidate" routerLink="/candidate" class="btn btn-primary btn-lg">Go to Dashboard</a>
            <a *ngIf="loggedIn.role === UserRole.Recruiter" routerLink="/recruiter" class="btn btn-primary btn-lg">Go to Dashboard</a>
          </div>
        </ng-container>

        <ng-template #loggedOut>
          <div class="action-buttons mt-4 flex gap-4 justify-center">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Get Started</a>
            <a routerLink="/auth/login" class="btn btn-secondary btn-lg">Sign In</a>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .hero-section {
      min-height: calc(100vh - 4rem);
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, rgba(109, 40, 217, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.15), transparent 40%);
      padding: 2rem;
    }
    .hero-title {
      font-size: 4rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      background: linear-gradient(to right, #fff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }
    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
    }
  `]
})
export class HomeComponent {
  UserRole = UserRole;
  isLoggedIn$ = this.authService.currentUser$;

  constructor(private authService: AuthService) {}
}
