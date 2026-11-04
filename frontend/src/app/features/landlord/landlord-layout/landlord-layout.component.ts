import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationMenuComponent } from '../../../shared/components/notification-menu/notification-menu.component';

@Component({
  selector: 'app-landlord-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule, NotificationMenuComponent],
  template: `
    <div class="landlord-layout">
      <aside class="landlord-sidebar" aria-label="Landlord navigation">
        <a routerLink="/" class="workspace-brand" aria-label="ETrental home">
          <img src="/etrental-logo.png" alt="" />
          <span>ETrental</span>
        </a>
        <!-- Fluent Profile Pill at top (Matches Windows 11 Settings screenshot) -->
        <a routerLink="/landlord/profile" class="user-profile-badge" title="Manage landlord profile">
          @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
            <img class="user-avatar" [src]="pictureUrl" alt="Landlord avatar" />
          } @else {
            <span class="user-avatar user-initials">{{ accountInitials }}</span>
          }
          <div class="user-info">
            <strong>{{ authService.currentUser()?.fullName || 'Landlord' }}</strong>
            <span>Landlord Account</span>
          </div>
        </a>

        <p class="sidebar-section-label">WORKSPACE</p>

        <nav class="sidebar-nav">
          <a routerLink="/landlord/dashboard" routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/landlord/my-properties" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">real_estate_agent</span>
            <span>My properties</span>
          </a>
          <a routerLink="/landlord/payments" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">payments</span>
            <span>Listing payments</span>
          </a>
          <a routerLink="/landlord/add-property" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">add_home</span>
            <span>Add property</span>
          </a>
          <a routerLink="/landlord/messages" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">mail</span>
            <span>Messages</span>
          </a>
          <a routerLink="/landlord/appointments" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">calendar_month</span>
            <span>Viewings</span>
          </a>
          <a routerLink="/landlord/applications" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">description</span>
            <span>Applications</span>
          </a>
          <a routerLink="/landlord/profile" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">person</span>
            <span>Profile settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/properties" class="sidebar-footer-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">open_in_new</span>
            <span>Browse listings</span>
          </a>
          <button type="button" class="sidebar-footer-link btn-logout" (click)="authService.logout()">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">logout</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main class="landlord-layout-content">
        <!-- Top bar with Fluent Search Pill (Matches Windows 11 Settings screenshot) -->
        <header class="account-bar">
          <div class="search-pill-container">
            <span class="material-icons-outlined search-pill-icon" aria-hidden="true">search</span>
            <input
              type="text"
              class="search-pill-input"
              placeholder="Find properties, tenant inquiries, viewings..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
            />
          </div>

          <div class="header-actions profile-controls">
            <app-notification-menu />
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
                <nav class="navigation-panel" aria-label="Landlord pages">
                  <a routerLink="/landlord/dashboard" (click)="navigationMenuOpen.set(false)">Dashboard</a>
                  <a routerLink="/landlord/my-properties" (click)="navigationMenuOpen.set(false)">My properties</a>
                  <a routerLink="/landlord/payments" (click)="navigationMenuOpen.set(false)">Listing payments</a>
                  <a routerLink="/landlord/add-property" (click)="navigationMenuOpen.set(false)">Add property</a>
                  <a routerLink="/landlord/messages" (click)="navigationMenuOpen.set(false)">Messages</a>
                  <a routerLink="/landlord/appointments" (click)="navigationMenuOpen.set(false)">Viewings</a>
                  <a routerLink="/landlord/applications" (click)="navigationMenuOpen.set(false)">Applications</a>
                  <a routerLink="/landlord/profile" (click)="navigationMenuOpen.set(false)">Profile settings</a>
                  <a routerLink="/properties" (click)="navigationMenuOpen.set(false)">Browse listings</a>
                </nav>
              }
            </div>
            <a routerLink="/landlord/profile" class="account-link" aria-label="Open landlord profile" title="Profile">
              <span class="account-avatar">
                @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
                  <img [src]="pictureUrl" alt="" />
                } @else {
                  <span class="material-icons-outlined" aria-hidden="true">person_outline</span>
                }
              </span>
            </a>
          </div>
        </header>

        <div class="landlord-page-content">
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

    .landlord-layout {
      display: flex;
      width: 100%;
      min-height: 100dvh;
      background: var(--bg-page, #f4f6f5);
      color: #172b24;
      font-family: inherit;
    }

    /* ── Windows 11 Fluent Sidebar ── */
    .landlord-sidebar {
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
    .landlord-layout-content {
      background: var(--bg-page, #f8fafc);
      min-width: 0;
      min-height: 100dvh;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }

    /* ── Topbar with Fluent Search Pill ── */
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

    .account-link {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 50%;
      color: #fff;
      text-decoration: none;
      transition: background 150ms ease;
    }
    .header-actions { display: flex; align-items: center; gap: .75rem; }
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
    .account-link:hover {
      background: #f8fafc;
    }
    .account-avatar {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      overflow: hidden;
      border-radius: 50%;
      background: #929995;
      color: white;
      transition: background 150ms ease;
    }
    .account-link:hover .account-avatar { background: #7f8b86; }
    .account-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .account-avatar .material-icons-outlined { font-size: 1.55rem; }
    .account-details { display: none; }
    .account-details span {
      font-size: 0.72rem;
      color: #64748b;
    }
    .account-chevron {
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .landlord-page-content {
      flex: 1 1 auto;
      min-width: 0;
      padding-top: 58px;
      background: #f6f8f7;
    }

    @media (max-width: 820px) {
      .landlord-layout {
        flex-direction: column;
      }
      .landlord-sidebar {
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
export class LandlordLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly navigationMenuOpen = signal(false);
  searchQuery = '';

  get accountInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'L';
    const first = user.firstName?.trim().charAt(0) || '';
    const last = user.lastName?.trim().charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'L';
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/landlord/my-properties'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
