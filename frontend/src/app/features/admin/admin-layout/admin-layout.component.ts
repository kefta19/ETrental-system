import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, AdminSidebarComponent],
  template: `
    <!-- Mobile overlay -->
    <div
      class="sidebar-overlay"
      [class.visible]="drawerOpen()"
      (click)="drawerOpen.set(false)"
    ></div>

    <div class="admin-layout">

      <app-admin-sidebar
        [drawerOpen]="drawerOpen()"
        (closeDrawer)="drawerOpen.set(false)"
      ></app-admin-sidebar>

      <div class="layout-column">

        <!-- ── Top Bar ── -->
        <header class="topbar">
          <div class="topbar-left">
            <button
              class="hamburger-btn"
              aria-label="Open menu"
              (click)="drawerOpen.set(true)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span class="topbar-label">Admin Panel</span>
          </div>

          <div class="topbar-right">
            <span class="admin-badge">Administrator</span>

            @if (authService.isAuthenticated()) {
              <div class="user-chip">
                <div class="user-chip-avatar">
                  {{ authService.currentUser()?.firstName?.charAt(0) || 'A' }}
                </div>
                <span class="user-chip-name">{{ authService.currentUser()?.firstName }}</span>
              </div>
              <button
                class="btn btn-icon btn-ghost topbar-logout"
                aria-label="Sign out"
                (click)="authService.logout()"
                title="Sign out"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            }
          </div>
        </header>

        <!-- ── Scrollable page content ── -->
        <div class="page-wrapper">
          <router-outlet></router-outlet>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .admin-layout {
      display: flex;
      height: 100vh;
      background: var(--bg-page);
      overflow: hidden;
      position: relative;
    }

    .layout-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .page-wrapper {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .topbar-label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--secondary-light);
    }

    .admin-badge {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      background: var(--status-warn-bg);
      color: var(--status-warn-fg);
      border-radius: 9999px;
    }

    .user-chip-name {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .topbar-logout svg {
      width: 18px;
      height: 18px;
      stroke: var(--text-muted);
    }

    .topbar-logout:hover svg { stroke: var(--danger); }
  `]
})
export class AdminLayoutComponent {
  drawerOpen = signal(false);
  authService = inject(AuthService);
}
