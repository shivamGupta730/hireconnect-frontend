import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { ToastComponent } from './core/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-toast></app-toast>
  `,
  styles: [`
    .main-content {
      padding-top: 4rem; /* match navbar height */
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {
  title = 'frontend';
}
