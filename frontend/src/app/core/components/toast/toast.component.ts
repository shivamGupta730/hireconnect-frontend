import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngIf="toast" class="toast slide-in" [ngClass]="toast.type">
        <div class="toast-icon">
          <i [ngClass]="getIconClass(toast.type)"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 9999;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      min-width: 250px;
    }
    .toast.success { background-color: rgba(34, 197, 94, 0.9); }
    .toast.error { background-color: rgba(239, 68, 68, 0.9); }
    .toast.info { background-color: rgba(59, 130, 246, 0.9); }
    .slide-in {
      animation: slideIn 0.3s ease forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit {
  toast: {message: string, type: string} | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.toast$.subscribe(toast => {
      this.toast = toast;
    });
  }

  getIconClass(type: string): string {
    switch(type) {
      case 'success': return 'fa fa-check-circle';
      case 'error': return 'fa fa-exclamation-circle';
      default: return 'fa fa-info-circle';
    }
  }
}
