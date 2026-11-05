import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationMenuComponent } from '../../../shared/components/notification-menu/notification-menu.component';

@Component({
  selector: 'app-renter-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule, NotificationMenuComponent],
  template: `
    <div class="renter-layout">
      <aside class="renter-sidebar" aria-label="Renter navigation">
        <a routerLink="/" class="workspace-brand" aria-label="ETrental home">
          <img src="/etrental-logo.png" alt="" />
          <span>ETrental</span>
        </a>
        <!-- Fluent Profile Pill at top (Matches Windows 11 Settings) -->
        <a routerLink="/renter/profile" class="user-profile-badge" title="Manage your account profile">
          @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
            <img class="user-avatar" [src]="pictureUrl" alt="User avatar" />
          } @else {
            <span class="user-avatar user-initials">{{ accountInitials }}</span>
          }
          <div class="user-info">
            <strong>{{ authService.currentUser()?.fullName || 'Renter Account' }}</strong>
            <span>Renter Account</span>
          </div>
        </a>

        <nav class="sidebar-nav">
          <div class="sidebar-nav-group">
            <p class="sidebar-section-label">OVERVIEW</p>
            <a routerLink="/renter/dashboard" routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">dashboard</span>
              <span>Dashboard</span>
            </a>
          </div>
          <div class="sidebar-nav-group">
            <p class="sidebar-section-label">DISCOVER</p>
            <a routerLink="/renter/favorites" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">favorite_border</span>
              <span>Saved homes</span>
            </a>
            <a routerLink="/renter/saved-searches" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">search</span>
              <span>Search alerts</span>
            </a>
          </div>
          <div class="sidebar-nav-group">
            <p class="sidebar-section-label">RENTAL ACTIVITY</p>
            <a routerLink="/renter/messages" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">mail</span>
              <span>Messages</span>
            </a>
            <a routerLink="/renter/appointments" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">calendar_month</span>
              <span>Viewings</span>
            </a>
            <a routerLink="/renter/applications" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">description</span>
              <span>Applications</span>
            </a>
          </div>
          <div class="sidebar-nav-group">
            <p class="sidebar-section-label">ACCOUNT</p>
            <a routerLink="/renter/profile" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">person</span>
              <span>My Profile</span>
            </a>
            <a routerLink="/renter/subscription" routerLinkActive="active" class="sidebar-link">
              <span class="sidebar-icon material-icons-outlined" aria-hidden="true">verified</span>
              <span>Subscription</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/properties" class="sidebar-footer-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">open_in_new</span>
            <span>Browse rentals</span>
          </a>
          <button type="button" class="sidebar-footer-link btn-logout" (click)="authService.logout()">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">logout</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main class="renter-layout-content">
        <!-- Top bar with Fluent Search Pill -->
        <header class="account-bar">
          <div class="search-pill-container">
            <span class="material-icons-outlined search-pill-icon" aria-hidden="true">search</span>
            <input
              type="text"
              class="search-pill-input"
              placeholder="Find properties, locations, inquiries..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
            />
          </div>

          <div class="account-bar-actions">
            <app-notification-menu />

            <div class="profile-controls" aria-label="Menu and profile">
              <div class="navigation-menu">
                <button
                  type="button"
                  class="navigation-toggle"
                  aria-label="Open page navigation"
                  [attr.aria-expanded]="navigationMenuOpen()"
                  (click)="navigationMenuOpen.update(open => !open)"
                >
                  <span class="material-icons-outlined" aria-hidden="true">{{ navigationMenuOpen() ? 'close' : 'menu' }}</span>
                </button>
                @if (navigationMenuOpen()) {
                  <nav class="navigation-panel" aria-label="Renter pages">
                    <a routerLink="/renter/dashboard" (click)="navigationMenuOpen.set(false)">Dashboard</a>
                    <a routerLink="/renter/favorites" (click)="navigationMenuOpen.set(false)">Saved homes</a>
                    <a routerLink="/renter/saved-searches" (click)="navigationMenuOpen.set(false)">Search alerts</a>
                    <a routerLink="/renter/messages" (click)="navigationMenuOpen.set(false)">Messages</a>
                    <a routerLink="/renter/appointments" (click)="navigationMenuOpen.set(false)">Viewings</a>
                    <a routerLink="/renter/applications" (click)="navigationMenuOpen.set(false)">Applications</a>
                    <a routerLink="/renter/profile" (click)="navigationMenuOpen.set(false)">My profile</a>
                    <a routerLink="/renter/subscription" (click)="navigationMenuOpen.set(false)">Subscription</a>
                    <a routerLink="/properties" (click)="navigationMenuOpen.set(false)">Browse rentals</a>
                  </nav>
                }
              </div>
              <a routerLink="/renter/profile" class="account-chip" title="Account profile" aria-label="Open account profile">
                <span class="chip-avatar">
                  @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
                    <img [src]="pictureUrl" alt="" />
                  } @else {
                    <span class="material-icons-outlined" aria-hidden="true">person_outline</span>
                  }
                </span>
              </a>
            </div>
          </div>
        </header>

        <!-- Routed page content rendered inside the dashboard view -->
        <div class="renter-page-body">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100dvh;
    }

    .renter-layout {
      display: flex;
      width: 100%;
      min-height: 100dvh;
      background: var(--bg-page, #f4f6f5);
      color: #172b24;
      font-family: inherit;
    }

    /* ── Fluent Windows 11 Sidebar ── */
    .renter-sidebar {
      position: sticky;
      z-index: 12;
      top: 0;
      display: flex;
      width: 256px;
      height: 100dvh;
      flex: 0 0 256px;
      flex-direction: column;
      padding: 1rem 0.85rem 0.8rem;
      border-right: 1px solid #e2e8e4;
      background: #ffffff;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .workspace-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0 0 0.65rem;
      padding: 0.35rem 0.7rem;
      color: #172b24;
      font-size: 1.05rem;
      font-weight: 800;
      text-decoration: none;
    }
    .workspace-brand img {
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      object-fit: contain;
    }

    /* Profile Badge at top */
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.7rem;
      margin-bottom: 0.6rem;
      border-radius: 8px;
      color: #172b24;
      text-decoration: none;
      transition: background 150ms ease;
    }
    .user-profile-badge:hover {
      background: #f0fdf4;
    }
    .user-avatar {
      display: grid;
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      place-items: center;
      border-radius: 50%;
      background: #dcfce7;
      color: #166534;
      font-size: 0.95rem;
      font-weight: 800;
      object-fit: cover;
    }
    .user-info {
      display: flex;
      min-width: 0;
      flex-direction: column;
      line-height: 1.25;
    }
    .user-info strong {
      overflow: hidden;
      font-size: 0.88rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #0f172a;
    }
    .user-info span {
      font-size: 0.72rem;
      color: #64748b;
    }

    .sidebar-section-label {
      margin: 0.4rem 0 0.4rem;
      padding: 0 0.7rem;
      color: #94a3b8;
      font-size: 0.64rem;
      font-weight: 800;
      letter-spacing: 0.12em;
    }

    .sidebar-nav {
      display: grid;
      gap: 0.75rem;
    }
    .sidebar-nav-group {
      display: grid;
      gap: 0.2rem;
    }

    /* Fluent Nav Item with Left Accent Bar */
    .sidebar-link {
      position: relative;
      display: flex;
      min-height: 40px;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: 6px;
      color: #475569;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 150ms ease, color 150ms ease;
    }
    .sidebar-link:hover {
      background: #f0fdf4;
      color: #047857;
    }
    .sidebar-link.active {
      background: #e8f5ec;
      color: #047857;
      font-weight: 750;
    }
    .sidebar-link.active::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      width: 3.5px;
      height: 18px;
      background: #10b981;
      border-radius: 4px;
    }

    .sidebar-icon {
      display: grid;
      width: 22px;
      flex: 0 0 22px;
      place-items: center;
      color: currentColor;
      font-size: 1.18rem;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 0.7rem;
      border-top: 1px solid #edf2ee;
      display: grid;
      gap: 0.2rem;
    }
    .sidebar-footer-link {
      display: flex;
      min-height: 38px;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      color: #64748b;
      font-size: 0.83rem;
      font-weight: 600;
      text-decoration: none;
      background: none;
      border: 0;
      cursor: pointer;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      transition: background 150ms ease, color 150ms ease;
    }
    .sidebar-footer-link:hover {
      background: #f0fdf4;
      color: #047857;
    }
    .btn-logout:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* ── Content Shell ── */
    .renter-layout-content {
      background: var(--bg-page, #f8fafc);
      min-width: 0;
      min-height: 100dvh;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }

    /* ── Topbar with Fluent Search Pill (Matches Screenshot) ── */
    .account-bar {
      position: fixed;
      z-index: 50;
      top: 0;
      left: 256px;
      right: 0;
      display: flex;
      min-height: 58px;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.4rem 1.6rem;
      border-bottom: 1px solid #e2e8e4;
      background: #ffffff;
    }

    .search-pill-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 480px;
    }
    .search-pill-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-size: 1.15rem;
      pointer-events: none;
    }
    .search-pill-input {
      width: 100%;
      height: 36px;
      padding: 0 1rem 0 2.4rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      font-size: 0.84rem;
      outline: none;
      transition: border-color 150ms, background 150ms;
    }
    .search-pill-input:focus {
      border-color: #10b981;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
    }

    .account-bar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .profile-controls {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      padding: 4px;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      background: #fff;
    }
    .navigation-menu { position: relative; }
    .navigation-toggle {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #334155;
      cursor: pointer;
      transition: border-color 150ms ease, background 150ms ease;
    }
    .navigation-toggle:hover { background: #f0fdf4; }
    .navigation-toggle .material-icons-outlined { font-size: 1.25rem; }
    .navigation-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      z-index: 60;
      display: grid;
      width: min(280px, calc(100vw - 24px));
      max-height: min(70vh, 480px);
      overflow-y: auto;
      padding: .5rem;
      border: 1px solid #e2e8e4;
      border-radius: 13px;
      background: #fff;
      box-shadow: 0 16px 40px rgb(15 23 42 / 16%);
    }
    .navigation-panel a {
      padding: .65rem .75rem;
      border-radius: 8px;
      color: #344054;
      font-size: .84rem;
      font-weight: 600;
      text-decoration: none;
    }
    .navigation-panel a:hover { background: #f0fdf4; color: #047857; }

    .account-chip {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 50%;
      color: #fff;
      text-decoration: none;
      transition: background 150ms ease;
    }
    .account-chip:hover .chip-avatar { background: #7f8b86; }
    .chip-avatar {
      display: grid;
      width: 38px;
      height: 38px;
      overflow: hidden;
      place-items: center;
      border-radius: 50%;
      background: #929995;
      color: white;
      transition: background 150ms ease;
    }
    .chip-avatar .material-icons-outlined { font-size: 1.55rem; }
    .chip-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .renter-page-body {
      flex: 1 1 auto;
      min-width: 0;
      padding-top: 58px;
      background: #f6f8f7;
    }

    @media (max-width: 820px) {
      .renter-layout {
        flex-direction: column;
      }
      .renter-sidebar {
        width: 100%;
        height: auto;
        position: relative;
        flex: none;
        padding-top: calc(1rem + 58px);
      }
      .account-bar {
        left: 0;
      }
    }
  `],
})
export class RenterLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly navigationMenuOpen = signal(false);
  searchQuery = '';

  get accountInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'R';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'R';
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/properties'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
