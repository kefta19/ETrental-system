import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

/* ── Heroicons v2 (MIT) inline SVG strings ── */
const ADMIN_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="admin-sidebar"
      [class.drawer-visible]="drawerOpen"
      [class.collapsed]="collapsed()">

      <!-- ══ Header ══ -->
      <div class="sidebar-header">
        <a routerLink="/admin/dashboard" class="brand-logo" aria-label="Admin Dashboard">
          <span class="logo-mark">
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect width="32" height="32" rx="8" fill="#10b981"/>
              <path d="M16 6L6 14v12h7v-7h6v7h7V14z" fill="white"/>
            </svg>
          </span>
          <div class="logo-texts">
            <span class="logo-title">ETrental</span>
            <span class="logo-sub">Admin Panel</span>
          </div>
        </a>
        <!-- Mobile close button -->
        <button class="icon-btn sidebar-close-btn" aria-label="Close menu"
          (click)="closeDrawer.emit()" [innerHTML]="icons.close">
        </button>
      </div>

      <!-- ══ Navigation ══ -->
      <nav class="sidebar-nav" role="navigation" aria-label="Admin navigation">

        <div class="nav-group">
          <span class="nav-group-label">Overview</span>
          <a class="nav-item" routerLink="/admin/dashboard"
             [class.active]="isActive('/admin/dashboard')"
             [attr.title]="collapsed() ? 'Dashboard' : null">
            <span class="nav-icon" [innerHTML]="icons.dashboard"></span>
            <span class="nav-label">Dashboard</span>
          </a>
        </div>

        <div class="nav-group">
          <span class="nav-group-label">Content</span>
          <a class="nav-item" routerLink="/admin/moderation"
             [class.active]="isActive('/admin/moderation')"
             [attr.title]="collapsed() ? 'Moderation Queue' : null">
            <span class="nav-icon" [innerHTML]="icons.shield"></span>
            <span class="nav-label">Moderation Queue</span>
            @if (pendingCount > 0 && !collapsed()) {
              <span class="nav-badge">{{ pendingCount }}</span>
            }
            @if (pendingCount > 0 && collapsed()) {
              <span class="nav-badge-dot"></span>
            }
          </a>
        </div>

        <div class="nav-group">
          <span class="nav-group-label">Management</span>
          <a class="nav-item" routerLink="/admin/users"
             [class.active]="isActive('/admin/users')"
             [attr.title]="collapsed() ? 'User Management' : null">
            <span class="nav-icon" [innerHTML]="icons.users"></span>
            <span class="nav-label">User Management</span>
          </a>
          <a class="nav-item" routerLink="/admin/agencies"
             [class.active]="isActive('/admin/agencies')"
             [attr.title]="collapsed() ? 'Agency Verification' : null">
            <span class="nav-icon" [innerHTML]="icons.building"></span>
            <span class="nav-label">Agency Verification</span>
          </a>
        </div>

        <div class="nav-group">
          <span class="nav-group-label">Analytics</span>
          <a class="nav-item" routerLink="/admin/analytics"
             [class.active]="isActive('/admin/analytics')"
             [attr.title]="collapsed() ? 'Analytics' : null">
            <span class="nav-icon" [innerHTML]="icons.chart"></span>
            <span class="nav-label">Analytics</span>
          </a>
        </div>

        <div class="nav-group">
          <span class="nav-group-label">System</span>
          <a class="nav-item" routerLink="/admin/settings"
             [class.active]="isActive('/admin/settings')"
             [attr.title]="collapsed() ? 'Platform Settings' : null">
            <span class="nav-icon" [innerHTML]="icons.gear"></span>
            <span class="nav-label">Platform Settings</span>
          </a>
        </div>
      </nav>

      <!-- ══ Footer ══ -->
      <div class="sidebar-footer">
        <a class="nav-item logout" (click)="logout()"
           [attr.title]="collapsed() ? 'Logout' : null">
          <span class="nav-icon" [innerHTML]="icons.logout"></span>
          <span class="nav-label">Logout</span>
        </a>

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
    .admin-sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width var(--transition-slow);
    }

    .admin-sidebar::-webkit-scrollbar { width: 4px; }
    .admin-sidebar::-webkit-scrollbar-track { background: transparent; }
    .admin-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    /* ── Collapsed desktop ── */
    .admin-sidebar.collapsed { width: 68px; }
    .admin-sidebar.collapsed .nav-label       { display: none; }
    .admin-sidebar.collapsed .nav-group-label { display: none; }
    .admin-sidebar.collapsed .logo-texts      { display: none; }
    .admin-sidebar.collapsed .nav-badge       { display: none; }
    .admin-sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem 0;
      gap: 0;
    }
    .admin-sidebar.collapsed .nav-item:hover { padding: 0.75rem 0; }
    .admin-sidebar.collapsed .sidebar-header  {
      justify-content: center;
      padding: 1.25rem 0.5rem 1rem;
    }
    .admin-sidebar.collapsed .logout { justify-content: center; }
    .admin-sidebar.collapsed .sidebar-footer { align-items: center; }
    .admin-sidebar.collapsed .collapse-toggle { width: 44px; }

    /* ── Header ── */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
      gap: 0.5rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      overflow: hidden;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .logo-mark { flex-shrink: 0; display: flex; }

    .logo-texts {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logo-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
      line-height: 1.1;
    }

    .logo-sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ── Nav ── */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
    }

    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      margin-bottom: 1rem;
    }

    .nav-group-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0 0.75rem;
      margin-bottom: 0.375rem;
      white-space: nowrap;
      overflow: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: all var(--transition-base);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      position: relative;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.08);
      color: #ffffff;
    }

    .nav-item.active {
      background: var(--primary);
      color: #ffffff;
      font-weight: 700;
    }

    .nav-item.active .nav-icon { color: #ffffff; }

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

    .nav-badge {
      margin-left: auto;
      background: #ef4444;
      color: white;
      padding: 0.1rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .nav-badge-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #1e293b;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .nav-item.logout {
      color: #f87171;
    }

    .nav-item.logout:hover {
      background: rgba(248,113,113,0.12);
      color: #fca5a5;
    }

    /* ── Icon buttons ── */
    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.6);
      transition: all var(--transition-fast);
      flex-shrink: 0;
      padding: 0;
    }

    .icon-btn:hover { background: rgba(255,255,255,0.1); color: white; }

    /* ── Collapse toggle (desktop) ── */
    .collapse-toggle {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.45);
      transition: all var(--transition-fast);
    }

    .collapse-toggle:hover {
      background: rgba(255,255,255,0.1);
      color: white;
      border-color: rgba(255,255,255,0.25);
    }

    /* ── Mobile close button ── */
    .sidebar-close-btn { display: none; }

    @media (max-width: 768px) {
      .admin-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform var(--transition-slow);
        box-shadow: none;
        width: 260px !important;
      }

      .admin-sidebar.drawer-visible {
        transform: translateX(0);
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
      }

      .admin-sidebar.drawer-visible .nav-label,
      .admin-sidebar.drawer-visible .nav-group-label,
      .admin-sidebar.drawer-visible .logo-texts,
      .admin-sidebar.drawer-visible .nav-badge { display: flex !important; }

      .admin-sidebar.drawer-visible .nav-item {
        justify-content: flex-start !important;
        padding: 0.625rem 0.75rem !important;
        gap: 0.625rem !important;
      }

      .sidebar-close-btn { display: flex !important; }
      .collapse-toggle   { display: none; }
    }
  `]
})
export class AdminSidebarComponent {
  @Input() drawerOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  readonly icons = ADMIN_ICONS;
  pendingCount = 0;

  collapsed = signal(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('et-admin-sidebar-collapsed') === 'true'
      : false
  );

  constructor(private router: Router, private route: ActivatedRoute) {
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('et-admin-sidebar-collapsed', String(this.collapsed()));
      }
    });
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  logout() {
    this.router.navigate(['/login']);
  }

  setPendingCount(count: number) {
    this.pendingCount = count;
  }
}
