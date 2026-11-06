import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { interval } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar></app-admin-sidebar>
      <main class="admin-layout-content">
        <header class="account-bar">
          <div class="search-pill-container"><span class="material-icons-outlined search-pill-icon" aria-hidden="true">search</span><input type="text" class="search-pill-input" placeholder="Find settings, users, listings..." /></div>
          <button type="button" class="dashboard-refresh-button" (click)="adminService.requestPageRefresh()">
            <span class="material-icons-outlined" aria-hidden="true">refresh</span>
            <span class="refresh-label">Refresh data</span>
          </button>
          <div class="notification-menu">
            <button class="notification-button" type="button" aria-label="Admin notifications"
              [attr.aria-expanded]="notificationsOpen()"
              (click)="toggleNotifications()">
              <span class="material-icons-outlined" aria-hidden="true">notifications</span>
              @if (unreadCount() > 0) {
                <span class="notification-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              }
            </button>
            @if (notificationsOpen()) {
              <section class="notification-panel" aria-label="Admin notifications">
                <div class="notification-heading">
                  <strong>Notifications</strong>
                  @if (unreadCount() > 0) {
                    <button type="button" class="mark-all" (click)="markAllRead()">Mark all read</button>
                  }
                </div>
                @if (notificationError()) {
                  <p class="notification-error" role="alert">{{ notificationError() }}</p>
                } @else if (notificationsLoading()) {
                  <p class="notification-empty">Loading notifications…</p>
                } @else if (!notifications().length) {
                  <p class="notification-empty">No unread notifications.</p>
                } @else {
                  <div class="notification-list">
                    @for (notification of notifications(); track notification.id) {
                      <button type="button" class="notification-item"
                        [class.unread]="!notification.isRead"
                        (click)="openNotification(notification)">
                        <span class="notification-icon material-icons-outlined" aria-hidden="true">campaign</span>
                        <span class="notification-copy">
                          <strong>{{ notification.title }}</strong>
                          <span>{{ notification.message }}</span>
                          <small>{{ notification.createdAtUtc | date:'short' }}</small>
                        </span>
                        @if (!notification.isRead) { <span class="unread-dot" aria-label="Unread"></span> }
                      </button>
                    }
                  </div>
                }
              </section>
            }
          </div>
          <div class="header-actions profile-controls">
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
                  <nav class="navigation-panel" aria-label="Admin pages">
                    <a routerLink="/admin/dashboard" (click)="navigationMenuOpen.set(false)">Dashboard</a>
                    <a routerLink="/admin/moderation" (click)="navigationMenuOpen.set(false)">Approve / reject properties</a>
                    <a routerLink="/admin/listings" (click)="navigationMenuOpen.set(false)">Published listings</a>
                    <a routerLink="/admin/reports" (click)="navigationMenuOpen.set(false)">Reports &amp; investigations</a>
                    <a routerLink="/admin/support" (click)="navigationMenuOpen.set(false)">Support cases</a>
                    <a routerLink="/admin/users" (click)="navigationMenuOpen.set(false)">User management</a>
                    <a routerLink="/admin/payments" (click)="navigationMenuOpen.set(false)">Payments</a>
                    <a routerLink="/admin/plans" (click)="navigationMenuOpen.set(false)">Plans &amp; entitlements</a>
                    <a routerLink="/admin/analytics" (click)="navigationMenuOpen.set(false)">Analytics</a>
                    <a routerLink="/admin/settings" (click)="navigationMenuOpen.set(false)">Platform settings</a>
                    <a routerLink="/admin/audit-logs" (click)="navigationMenuOpen.set(false)">Audit history</a>
                  </nav>
                }
              </div>
              <a routerLink="/profile" class="account-link" aria-label="Open account profile" title="Profile">
                <span class="account-avatar">
                  @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
                    @if (!avatarError()) {
                      <img [src]="pictureUrl" alt="" referrerpolicy="no-referrer" (error)="avatarError.set(true)" />
                    } @else {
                      <span class="material-icons-outlined" aria-hidden="true">person_outline</span>
                    }
                  } @else {
                    <span class="material-icons-outlined" aria-hidden="true">person_outline</span>
                  }
                </span>
              </a>
          </div>
        </header>
        <div class="admin-page-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; width:100%; min-height:100dvh; }
    .admin-layout {
      display:flex;
      width:100%;
      min-height:100dvh;
      background:var(--bg-page, #f6f8f6);
      color:#172b24;
    }
    .admin-layout-content { min-width:0; min-height:100dvh; flex:1 1 auto; padding-top:58px; }
        .search-pill-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 460px;
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
    .dashboard-refresh-button {
      display:inline-flex;
      flex:0 0 auto;
      align-items:center;
      justify-content:center;
      gap:.4rem;
      min-height:36px;
      padding:0 .8rem;
      border:1px solid #b9d8c3;
      border-radius:10px;
      background:#f3faf5;
      color:#176b4d;
      font:inherit;
      font-size:.76rem;
      font-weight:700;
      white-space:nowrap;
      cursor:pointer;
      transition:background 150ms ease,border-color 150ms ease;
    }
    .dashboard-refresh-button:hover {
      border-color:#84bd98;
      background:#e9f6ed;
    }
    .dashboard-refresh-button:focus-visible {
      outline:3px solid #7ab894;
      outline-offset:2px;
    }
    .dashboard-refresh-button .material-icons-outlined { font-size:1.05rem; }
    .account-bar {
      position:fixed;
      z-index:50;
      top:0;
      left:256px;
      right:0;
      display:flex;
      min-height:58px;
      align-items:center;
      justify-content:space-between;
      gap:1rem;
      padding:.45rem clamp(.8rem,2vw,1.4rem);
      border-bottom:1px solid #e3e9e4;
      background:rgb(255 255 255 / 96%);
      backdrop-filter:blur(12px);
    }
    .notification-menu { position:relative; margin-left:auto; }
    .header-actions { display:flex; align-items:center; gap:.75rem; }
    .profile-controls {
      display:inline-flex;
      align-items:center;
      gap:.3rem;
      padding:4px;
      border:1px solid #cbd5e1;
      border-radius:999px;
      background:#fff;
    }
    .navigation-menu { position:relative; }
    .navigation-toggle {
      display:grid;
      width:42px;
      height:42px;
      place-items:center;
      border:0;
      border-radius:50%;
      background:transparent;
      color:#344054;
      cursor:pointer;
      transition:border-color 150ms ease,background 150ms ease;
    }
    .navigation-toggle:hover { background:#f0fdf4; }
    .navigation-toggle .material-icons-outlined { font-size:1.2rem; }
    .navigation-panel {
      position:absolute;
      top:calc(100% + 10px);
      right:0;
      z-index:60;
      display:grid;
      width:min(290px,calc(100vw - 24px));
      max-height:min(70vh,500px);
      overflow-y:auto;
      padding:.5rem;
      border:1px solid #e3e9e4;
      border-radius:13px;
      background:#fff;
      box-shadow:0 16px 40px rgb(15 23 42 / 16%);
    }
    .navigation-panel a {
      padding:.65rem .75rem;
      border-radius:8px;
      color:#344054;
      font-size:.82rem;
      font-weight:600;
      text-decoration:none;
    }
    .navigation-panel a:hover { background:#f0fdf4; color:#047857; }
    .notification-button {
      position:relative;
      display:grid;
      width:38px;
      height:38px;
      place-items:center;
      border:1px solid #e3e9e4;
      border-radius:10px;
      background:#fff;
      color:#52665b;
      cursor:pointer;
    }
    .notification-button:hover { background:#f4f8f5; color:#176b4d; }
    .notification-button > span:first-child { font-size:1.25rem; }
    .notification-badge {
      position:absolute;
      top:-5px;
      right:-5px;
      min-width:17px;
      height:17px;
      padding:0 3px;
      border:2px solid white;
      border-radius:999px;
      background:#10b981;
      color:white;
      font-size:.62rem;
      font-weight:800;
      line-height:17px;
      text-align:center;
    }
    .notification-panel {
      position:absolute;
      z-index:30;
      top:calc(100% + 10px);
      right:0;
      width:min(390px,calc(100vw - 24px));
      max-height:min(520px,calc(100dvh - 90px));
      overflow:auto;
      border:1px solid #e3e9e4;
      border-radius:13px;
      background:white;
      box-shadow:0 18px 45px #172b2424;
    }
    .notification-heading {
      position:sticky;
      top:0;
      z-index:1;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:.8rem .95rem;
      border-bottom:1px solid #edf0ed;
      background:#fff;
      color:#26382e;
      font-size:.85rem;
    }
    .mark-all { border:0; background:none; color:#176b4d; font:inherit; font-size:.72rem; font-weight:750; cursor:pointer; }
    .notification-list { display:grid; }
    .notification-item {
      display:flex;
      width:100%;
      align-items:flex-start;
      gap:.65rem;
      padding:.8rem .9rem;
      border:0;
      border-bottom:1px solid #f0f2f0;
      background:white;
      color:#26382e;
      text-align:left;
      cursor:pointer;
    }
    .notification-item:hover { background:#f7faf7; }
    .notification-item.unread { background:#f3faf5; }
    .notification-icon { color:#176b4d; font-size:1.1rem; }
    .notification-copy { display:grid; min-width:0; gap:.2rem; }
    .notification-copy strong { font-size:.77rem; }
    .notification-copy > span { color:#64746b; font-size:.73rem; line-height:1.4; }
    .notification-copy small { color:#87928b; font-size:.65rem; }
    .unread-dot { width:7px; height:7px; flex:0 0 7px; margin:.3rem 0 0 auto; border-radius:50%; background:#10a36f; }
    .notification-empty, .notification-error { margin:0; padding:1.1rem; color:#718078; font-size:.78rem; text-align:center; }
    .notification-error { color:#a33a3a; }
    .workspace-label { color:#77867d; font-size:.78rem; font-weight:650; }
    .account-link {
      display:grid;
      width:42px;
      height:42px;
      place-items:center;
      border-radius:50%;
      color:#fff;
      text-decoration:none;
      transition:background 150ms ease;
    }
    .account-link:hover .account-avatar { background:#7f8b86; }
    .account-avatar {
      display:grid;
      width:38px;
      height:38px;
      place-items:center;
      overflow:hidden;
      border-radius:50%;
      background:#929995;
      color:white;
      transition:background 150ms ease;
    }
    .account-avatar .material-icons-outlined { font-size:1.55rem; }
    .account-avatar img { width:100%; height:100%; object-fit:cover; }
    .account-details, .account-chevron { display:none; }
    @media(max-width:760px) {
      .admin-layout { flex-direction:column; }
      .admin-layout-content { padding-top:58px; }
      .admin-page-content { min-width:0; }
      .workspace-label { display:none; }
          .search-pill-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 460px;
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
    .account-bar { left:0; min-height:58px; }
    }
    @media(max-width:420px) {
      .account-details > span { display:none; }
    }
    @media(max-width:760px) {
      .dashboard-refresh-button { width:36px; padding:0; }
      .refresh-label { display:none; }
    }
  `]
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  readonly router = inject(Router);
  readonly notificationsOpen = signal(false);
  readonly notificationsLoading = signal(false);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly notificationError = signal('');
  readonly navigationMenuOpen = signal(false);
  readonly avatarError = signal(false);

  constructor() {
    interval(30_000).pipe(
      startWith(0),
      takeUntilDestroyed()
    ).subscribe(() => this.refreshUnreadCount());
  }

  toggleNotifications(): void {
    const open = !this.notificationsOpen();
    this.notificationsOpen.set(open);
    if (open) this.loadNotifications();
  }

  private refreshUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: result => {
        if (result.succeeded && result.data !== null) this.unreadCount.set(result.data);
        else if (this.notificationsOpen()) this.notificationError.set(result.errors?.[0] || 'Unable to refresh notification count.');
      },
      error: error => {
        if (this.notificationsOpen()) {
          this.notificationError.set(error.error?.errors?.[0] || 'Unable to refresh notification count.');
        }
      }
    });
  }

  private loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.notificationError.set('');
    this.notificationService.getNotifications(true).subscribe({
      next: result => {
        this.notificationsLoading.set(false);
        if (!result.succeeded || !result.data) {
          this.notificationError.set(result.errors?.[0] || 'Unable to load notifications.');
          return;
        }
        this.notifications.set(result.data);
        this.unreadCount.set(result.data.filter(notification => !notification.isRead).length);
      },
      error: error => {
        this.notificationsLoading.set(false);
        this.notificationError.set(error.error?.errors?.[0] || 'Unable to load notifications.');
      }
    });
  }

  openNotification(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.notificationError.set(result.errors?.[0] || 'Unable to mark this notification as read.');
          return;
        }
        this.notifications.update(items => items.filter(item => item.id !== notification.id));
        this.unreadCount.update(count => Math.max(0, count - (notification.isRead ? 0 : 1)));
        const link = notification.linkUrl;
        this.notificationsOpen.set(false);
        if (link?.startsWith('/admin/')) this.router.navigateByUrl(link);
      },
      error: error => this.notificationError.set(error.error?.errors?.[0] || 'Unable to mark this notification as read.')
    });
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: result => {
        if (!result.succeeded) {
          this.notificationError.set(result.errors?.[0] || 'Unable to mark notifications as read.');
          return;
        }
        this.notifications.set([]);
        this.unreadCount.set(0);
      },
      error: error => this.notificationError.set(error.error?.errors?.[0] || 'Unable to mark notifications as read.')
    });
  }

  get accountInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'A';
    const first = user.firstName.trim().charAt(0);
    const last = user.lastName.trim().charAt(0);
    return `${first}${last}`.toUpperCase() || 'A';
  }
}
