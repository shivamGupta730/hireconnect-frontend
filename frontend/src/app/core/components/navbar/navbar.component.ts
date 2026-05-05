import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { UserRole, Notification, LoginResponse } from '../../models/models';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar glass-panel">
      <div class="nav-brand">
        <a routerLink="/" class="logo">HireConnect</a>
      </div>
      <nav class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
        
        <ng-container *ngIf="isLoggedIn$ | async as loggedIn; else noAuth">
          <a *ngIf="userRole === UserRole.Candidate" routerLink="/candidate" routerLinkActive="active">Dashboard</a>
          <a *ngIf="userRole === UserRole.Recruiter" routerLink="/recruiter" routerLinkActive="active">Dashboard</a>
          
          <div class="notification-container">
             <button class="btn btn-secondary bell-icon" (click)="toggleNotifications()">
                🔔
                <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
             </button>
             <div class="notification-dropdown glass-panel animate-slide-down" *ngIf="showNotifications">
                <h4>Notifications</h4>
                <div *ngIf="notifications.length === 0" class="empty-state">No notifications yet.</div>
                 <div class="notification-item" *ngFor="let notif of notifications" [class.unread]="!notif.isRead" (click)="markAsRead(notif)">
                   <p>{{ notif.message }}</p>
                   <small>{{ notif.createdAt | date:'short' }}</small>
                 </div>
             </div>
          </div>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </ng-container>
        
        <ng-template #noAuth>
          <a routerLink="/auth/login" class="btn btn-secondary">Login</a>
          <a routerLink="/auth/register" class="btn btn-primary">Register</a>
        </ng-template>
      </nav>
    </header>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      z-index: 1000;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .nav-links a {
      font-weight: 500;
      color: var(--text);
    }
    .nav-links a:not(.btn):hover {
      color: var(--primary);
    }
    .nav-links a.active:not(.btn) {
      color: var(--secondary);
    }
    .notification-container {
      position: relative;
    }
    .bell-icon {
      position: relative;
      padding: 0.5rem 1rem;
    }
    .bell-icon .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      padding: 0.1rem 0.4rem;
      font-size: 0.75rem;
    }
    .notification-dropdown {
      position: absolute;
      top: 3rem;
      right: 0;
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
      padding: 1rem;
      border: 1px solid var(--border);
    }
    .notification-item {
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
    }
    .notification-item:last-child {
      border-bottom: none;
    }
    .notification-item.unread {
      font-weight: 700;
      color: var(--primary);
    }
    .notification-item small {
      color: rgba(255,255,255,0.5);
    }
    .empty-state {
      padding: 1rem 0;
      text-align: center;
      color: var(--text-muted);
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn$ = this.authService.currentUser$;
  UserRole = UserRole;
  userRole: UserRole | null = null;
  currentUser: LoginResponse | null = null;
  
  showNotifications = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.userRole = user?.role || null;
      this.currentUser = user;
      
      const userId = this.authService.getUserId();
      if (userId) {
        this.fetchNotifications();
        if (this.pollSub) this.pollSub.unsubscribe();
        this.pollSub = interval(15000).subscribe(() => this.fetchNotifications());
      } else {
        if (this.pollSub) this.pollSub.unsubscribe();
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  ngOnDestroy() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
  }

  fetchNotifications() {
    const userId = this.authService.getUserId();
    console.log("UserId:", userId);
    if (!userId) return;
    this.notificationService.getNotifications(userId).subscribe({
      next: (response) => {
        console.log(response);
        if (response && response.success && response.data) {
          this.notifications = response.data;
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          console.log('Notifications loaded:', this.notifications.length, 'unread:', this.unreadCount);
        } else {
          this.notifications = [];
          this.unreadCount = 0;
        }
      },
      error: (err) => {
        console.error('Failed to fetch notifications:', err);
      }
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notif: Notification) {
    if (notif.isRead) return;
    this.notificationService.markAsRead(notif.notificationId).subscribe({
      next: () => {
        notif.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
