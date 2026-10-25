import { Component, inject, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

/* ── Heroicons v2 (MIT) inline SVG strings ── */
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

@Component({
  selector: 'app-main-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="main-sidebar"
      [class.drawer-visible]="drawerOpen"
      [class.collapsed]="collapsed()">

      <!-- ══ Header ══ -->
      <div class="sidebar-header">
        <a routerLink="/" class="brand-logo" (click)="closeDrawer.emit()" aria-label="ETrental home">
          <span class="logo-mark">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect width="32" height="32" rx="8" fill="#10b981"/>
              <path d="M16 6L6 14v12h7v-7h6v7h7V14z" fill="white"/>
            </svg>
          </span>
          <span class="logo-text">ET<span class="logo-accent">rental</span></span>
        </a>
        <!-- Mobile close button -->
        <button class="icon-btn sidebar-close-btn" aria-label="Close menu"
          (click)="closeDrawer.emit()" [innerHTML]="icons.close">
        </button>
      </div>

      <!-- ══ Navigation ══ -->
      <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">

        <div class="nav-group">
          <span class="nav-group-label">Browse</span>
          <a class="nav-item" routerLink="/properties"
             [class.active]="isActive('/properties')"
             [attr.title]="collapsed() ? 'Browse Rentals' : null">
            <span class="nav-icon" [innerHTML]="icons.home"></span>
            <span class="nav-label">Browse Rentals</span>
          </a>
        </div>

        @if (authService.isAuthenticated()) {

          @if (authService.isRenter()) {
            <div class="nav-group">
              <span class="nav-group-label">Dashboard</span>
              <a class="nav-item" routerLink="/renter/dashboard"
                 [class.active]="isActive('/renter/dashboard')"
                 [attr.title]="collapsed() ? 'My Dashboard' : null">
                <span class="nav-icon" [innerHTML]="icons.chart"></span>
                <span class="nav-label">My Dashboard</span>
              </a>
            </div>
          }

          @if (authService.isLandlord()) {
            <div class="nav-group">
              <span class="nav-group-label">Dashboard</span>
              <a class="nav-item" routerLink="/landlord/dashboard"
                 [class.active]="isActive('/landlord/dashboard')"
                 [attr.title]="collapsed() ? 'My Dashboard' : null">
                <span class="nav-icon" [innerHTML]="icons.chart"></span>
                <span class="nav-label">My Dashboard</span>
              </a>
            </div>
          }

          @if (authService.isAgency()) {
            <div class="nav-group">
              <span class="nav-group-label">Dashboard</span>
              <a class="nav-item" routerLink="/agency/dashboard"
                 [class.active]="isActive('/agency/dashboard')"
                 [attr.title]="collapsed() ? 'Agency Dashboard' : null">
                <span class="nav-icon" [innerHTML]="icons.chart"></span>
                <span class="nav-label">Agency Dashboard</span>
              </a>
            </div>
          }

          <div class="nav-group">
            <span class="nav-group-label">My Account</span>
            <a class="nav-item" routerLink="/favorites"
               [class.active]="isActive('/favorites')"
               [attr.title]="collapsed() ? 'Favorites' : null">
              <span class="nav-icon" [innerHTML]="icons.heart"></span>
              <span class="nav-label">Favorites</span>
            </a>
            <a class="nav-item" routerLink="/messages"
               [class.active]="isActive('/messages')"
               [attr.title]="collapsed() ? 'Messages' : null">
              <span class="nav-icon" [innerHTML]="icons.chat"></span>
              <span class="nav-label">Messages</span>
            </a>
            <a class="nav-item" routerLink="/appointments"
               [class.active]="isActive('/appointments')"
               [attr.title]="collapsed() ? 'Tours' : null">
              <span class="nav-icon" [innerHTML]="icons.calendar"></span>
              <span class="nav-label">Tours</span>
            </a>
            <a class="nav-item" routerLink="/applications"
               [class.active]="isActive('/applications')"
               [attr.title]="collapsed() ? 'Applications' : null">
              <span class="nav-icon" [innerHTML]="icons.fileText"></span>
              <span class="nav-label">Applications</span>
            </a>
          </div>
        }

        @if (authService.isLandlord() || authService.isAgency() || authService.isAdmin()) {
          <div class="nav-group">
            <span class="nav-group-label">Listings</span>
            <a class="nav-item" routerLink="/landlord/my-properties"
               [class.active]="isActive('/landlord/my-properties')"
               [attr.title]="collapsed() ? 'My Listings' : null">
              <span class="nav-icon" [innerHTML]="icons.list"></span>
              <span class="nav-label">My Listings</span>
            </a>
            <a class="nav-item" routerLink="/landlord/add-property"
               [class.active]="isActive('/landlord/add-property')"
               [attr.title]="collapsed() ? 'Add Property' : null">
              <span class="nav-icon" [innerHTML]="icons.plus"></span>
              <span class="nav-label">Add Property</span>
            </a>
          </div>
        }

        @if (authService.isAdmin()) {
          <div class="nav-group">
            <span class="nav-group-label">Admin</span>
            <a class="nav-item" routerLink="/admin/moderation"
               [class.active]="isActive('/admin/moderation')"
               [attr.title]="collapsed() ? 'Moderation Queue' : null">
              <span class="nav-icon" [innerHTML]="icons.shield"></span>
              <span class="nav-label">Moderation Queue</span>
            </a>
          </div>
        }
      </nav>

      <!-- ══ Footer ══ -->
      <div class="sidebar-footer">

        @if (!collapsed()) {
          <span class="currency-tag">ETB · Birr</span>
        }

        @if (authService.isAuthenticated()) {
          <div class="user-section" [class.collapsed-user]="collapsed()">
            <div class="user-avatar">
              {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
            </div>
            @if (!collapsed()) {
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.fullName }}</span>
                <span class="badge badge-green">{{ authService.userRole() }}</span>
              </div>
              <button class="icon-btn logout-btn" (click)="authService.logout()"
                aria-label="Sign Out" title="Sign Out"
                [innerHTML]="icons.logout">
              </button>
            }
          </div>
        } @else if (!collapsed()) {
          <div class="auth-buttons">
            <a routerLink="/login"    class="btn btn-outline">Sign In</a>
            <a routerLink="/register" class="btn btn-primary">Register</a>
          </div>
        }

        <!-- Desktop collapse toggle -->
        <button class="collapse-toggle"
          (click)="toggleCollapse()"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [innerHTML]="collapsed() ? icons.chevronRight : icons.chevronLeft">
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .main-sidebar {
      width: 260px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      height: 100vh;
      border-right: 1px solid var(--border-color);
      overflow-y: auto;
      overflow-x: hidden;
      box-shadow: var(--shadow-sm);
      transition: width var(--transition-slow);
    }

    .main-sidebar::-webkit-scrollbar { width: 4px; }
    .main-sidebar::-webkit-scrollbar-track { background: transparent; }
    .main-sidebar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }

    /* ── Collapsed desktop ── */
    .main-sidebar.collapsed { width: 68px; }
    .main-sidebar.collapsed .nav-label       { display: none; }
    .main-sidebar.collapsed .nav-group-label { display: none; }
    .main-sidebar.collapsed .logo-text       { display: none; }
    .main-sidebar.collapsed .currency-tag    { display: none; }
    .main-sidebar.collapsed .user-info       { display: none; }
    .main-sidebar.collapsed .logout-btn      { display: none; }
    .main-sidebar.collapsed .auth-buttons    { display: none; }
    .main-sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem 0;
      gap: 0;
    }
    .main-sidebar.collapsed .nav-item:hover { padding: 0.75rem 0; }
    .main-sidebar.collapsed .collapsed-user {
      justify-content: center;
      background: transparent;
      border: none;
      padding: 0.375rem;
    }
    .main-sidebar.collapsed .sidebar-header {
      justify-content: center;
      padding: 1.25rem 0.75rem 1rem;
    }
    .main-sidebar.collapsed .sidebar-footer { align-items: center; }

    /* ── Header ── */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem 1rem;
      border-bottom: 1px solid var(--border-color-light);
      flex-shrink: 0;
      gap: 0.5rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      transition: opacity var(--transition-fast);
      overflow: hidden;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .brand-logo:hover { opacity: 0.8; }
    .logo-mark { flex-shrink: 0; display: flex; align-items: center; }

    .logo-text {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: -0.02em;
    }

    .logo-accent { color: var(--primary); }

    /* ── Nav ── */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      margin-bottom: 1rem;
    }

    .nav-group-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0 0.625rem;
      margin-bottom: 0.375rem;
      white-space: nowrap;
      overflow: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all var(--transition-base);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      position: relative;
    }

    .nav-item:hover {
      background: var(--primary-lighter);
      color: var(--primary-dark);
    }

    .nav-item.active {
      background: var(--primary-light);
      color: var(--primary-dark);
      font-weight: 700;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: var(--primary);
      border-radius: 0 3px 3px 0;
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: currentColor;
    }

    .nav-label {
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--border-color-light);
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      flex-shrink: 0;
    }

    .currency-tag {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0 0.375rem;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem;
      background: var(--primary-lighter);
      border-radius: var(--radius-md);
      border: 1px solid rgba(16,185,129,0.15);
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .user-name {
      font-weight: 700;
      color: var(--secondary);
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.5rem;
      border-radius: 9999px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      width: fit-content;
    }

    .badge-green {
      background: var(--primary-light);
      color: var(--primary-dark);
    }

    .auth-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.625rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-base);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 2px solid transparent;
    }

    .btn-outline {
      border-color: var(--border-color);
      background: white;
      color: var(--text-secondary);
    }

    .btn-outline:hover { border-color: var(--primary); color: var(--primary-dark); }

    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .btn-primary:hover { background: var(--primary-hover); }

    /* ── Icon buttons ── */
    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all var(--transition-fast);
      flex-shrink: 0;
      padding: 0;
    }

    .logout-btn:hover { background: #fee2e2; color: var(--danger); }

    /* ── Collapse toggle (desktop) ── */
    .collapse-toggle {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      background: var(--bg-page);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .collapse-toggle:hover {
      background: var(--primary-lighter);
      color: var(--primary-dark);
      border-color: var(--primary);
    }

    /* ── Mobile close button ── */
    .sidebar-close-btn { display: none; }

    @media (max-width: 768px) {
      .main-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform var(--transition-slow);
        box-shadow: none;
        width: 280px !important;
      }

      .main-sidebar.drawer-visible {
        transform: translateX(0);
        box-shadow: var(--shadow-2xl);
      }

      /* Force-restore collapsed items when open on mobile */
      .main-sidebar.drawer-visible .nav-label,
      .main-sidebar.drawer-visible .nav-group-label,
      .main-sidebar.drawer-visible .logo-text,
      .main-sidebar.drawer-visible .currency-tag,
      .main-sidebar.drawer-visible .user-info,
      .main-sidebar.drawer-visible .logout-btn { display: flex !important; }

      .main-sidebar.drawer-visible .nav-item {
        justify-content: flex-start !important;
        padding: 0.625rem 0.75rem !important;
        gap: 0.625rem !important;
      }

      .sidebar-close-btn { display: flex !important; }
      .collapse-toggle   { display: none; }
    }
  `]
})
export class MainSidebarComponent {
  @Input() drawerOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  authService = inject(AuthService);
  private router = inject(Router);
  readonly icons = ICONS;

  collapsed = signal(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('et-sidebar-collapsed') === 'true'
      : false
  );

  constructor() {
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('et-sidebar-collapsed', String(this.collapsed()));
      }
    });
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }
}
