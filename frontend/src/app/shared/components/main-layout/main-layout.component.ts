import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainSidebarComponent } from '../main-sidebar/main-sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, MainSidebarComponent],
  template: `
    <!-- Mobile overlay (closes drawer when tapped) -->
    <div
      class="sidebar-overlay"
      [class.visible]="drawerOpen()"
      (click)="drawerOpen.set(false)"
    ></div>

    <div class="main-layout" [class.drawer-open]="drawerOpen()">

      <!-- Sidebar (receives open state for mobile drawer) -->
      <app-main-sidebar
        [drawerOpen]="drawerOpen()"
        (closeDrawer)="drawerOpen.set(false)"
      ></app-main-sidebar>

      <!-- Right-hand column: topbar + scrollable page content -->
      <div class="layout-column">

        <!-- ── Top Bar ── -->
        <header class="topbar">
          <div class="topbar-left">
            <!-- hamburger (mobile only) -->
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

            <!-- Brand (visible on mobile when sidebar is hidden) -->
            <a routerLink="/" class="topbar-brand">
              ET<span class="topbar-brand-accent">rental</span>
            </a>
          </div>

          <div class="topbar-right">
            <!-- ETB locale tag -->
            <span class="locale-tag">ETB · Birr</span>

            @if (authService.isAuthenticated()) {
              <!-- User chip -->
              <div class="user-chip">
                <div class="user-chip-avatar">
                  {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
                </div>
                <span class="user-chip-name">{{ authService.currentUser()?.firstName }}</span>
              </div>

              <!-- Logout button -->
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
            } @else {
              <a routerLink="/login"    class="btn btn-outline btn-sm">Sign In</a>
              <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
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

    .main-layout {
      display: flex;
      height: 100vh;
      background: var(--bg-page);
      overflow: hidden;
      position: relative;
    }

    /* Right column (topbar + page scroll area) */
    .layout-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    /* Page area scrolls naturally */
    .page-wrapper {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Topbar brand — visible only on mobile when sidebar is off-screen */
    .topbar-brand {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.02em;
      display: none;
      text-decoration: none;
    }

    .topbar-brand-accent { color: var(--primary); }

    .locale-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: none;
    }

    .topbar-logout svg {
      width: 18px;
      height: 18px;
      stroke: var(--text-muted);
    }

    .topbar-logout:hover svg { stroke: var(--danger); }

    .user-chip-name {
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .topbar-brand { display: block; }
      .locale-tag   { display: block; }
    }
  `]
})
export class MainLayoutComponent {
  drawerOpen = signal(false);
  authService = inject(AuthService);
}
