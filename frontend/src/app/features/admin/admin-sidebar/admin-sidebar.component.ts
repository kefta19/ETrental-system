import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="admin-sidebar" aria-label="Admin navigation">
      <a routerLink="/" class="workspace-brand" aria-label="ETrental home">
        <img src="/etrental-logo.png" alt="" />
        <span>ETrental</span>
      </a>
      <!-- Fluent Profile Pill at top (Matches Windows 11 Settings) -->
      <a routerLink="/admin/dashboard" class="user-profile-badge" title="Administrator Profile">
        @if (authService.currentUser()?.profilePictureUrl; as pictureUrl) {
          @if (!avatarError()) {
            <img class="user-avatar" [src]="pictureUrl" alt="Admin avatar" referrerpolicy="no-referrer" (error)="avatarError.set(true)" />
          } @else {
            <span class="user-avatar user-initials">{{ accountInitials }}</span>
          }
        } @else {
          <span class="user-avatar user-initials">{{ accountInitials }}</span>
        }
        <div class="user-info">
          <strong>{{ authService.currentUser()?.fullName || 'Administrator' }}</strong>
          <span>Admin Workspace</span>
        </div>
      </a>

      <nav class="sidebar-nav">
        <div class="sidebar-nav-group">
          <p class="sidebar-section-label">OVERVIEW</p>
          <a routerLink="/admin/dashboard" routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">dashboard</span>
            <span>Dashboard</span>
          </a>
        </div>
        <div class="sidebar-nav-group">
          <p class="sidebar-section-label">LISTINGS</p>
          <a routerLink="/admin/moderation" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">fact_check</span>
            <span>Approve / reject properties</span>
          </a>
          <a routerLink="/admin/listings" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">real_estate_agent</span>
            <span>Published listings</span>
          </a>
        </div>
        <div class="sidebar-nav-group">
          <p class="sidebar-section-label">PEOPLE &amp; SAFETY</p>
          <a routerLink="/admin/users" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">group</span>
            <span>User management</span>
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">flag</span>
            <span>Reports &amp; investigations</span>
          </a>
          <a routerLink="/admin/support" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">support_agent</span>
            <span>Support cases</span>
          </a>
        </div>
        <div class="sidebar-nav-group">
          <p class="sidebar-section-label">FINANCE</p>
          <a routerLink="/admin/payments" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">payments</span>
            <span>Payments</span>
          </a>
          <a routerLink="/admin/plans" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">workspace_premium</span>
            <span>Plans &amp; entitlements</span>
          </a>
        </div>
        <div class="sidebar-nav-group">
          <p class="sidebar-section-label">INSIGHTS &amp; SETTINGS</p>
          <a routerLink="/admin/analytics" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">analytics</span>
            <span>Analytics</span>
          </a>
          <a routerLink="/admin/settings" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">settings</span>
            <span>Platform settings</span>
          </a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="sidebar-link">
            <span class="sidebar-icon material-icons-outlined" aria-hidden="true">history</span>
            <span>Audit history</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a routerLink="/properties" class="sidebar-footer-link">
          <span class="sidebar-icon material-icons-outlined" aria-hidden="true">open_in_new</span>
          <span>Browse portal</span>
        </a>
        <button type="button" class="sidebar-footer-link btn-logout" (click)="authService.logout()">
          <span class="sidebar-icon material-icons-outlined" aria-hidden="true">logout</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host { display:block; flex:0 0 256px; }
    .admin-sidebar {
      position:sticky;
      top:0;
      display:flex;
      width:256px;
      height:100dvh;
      flex-direction:column;
      padding:1rem .85rem .8rem;
      box-sizing:border-box;
      overflow-y:auto;
      border-right:1px solid #e2e8e4;
      background:#fff !important;
      color:#172b24;
      font-family:inherit;
    }
    .admin-sidebar::-webkit-scrollbar { width:4px; }
    .admin-sidebar::-webkit-scrollbar-thumb { border-radius:4px; background:#dce5df; }

    .workspace-brand {
      display:flex;
      align-items:center;
      gap:.6rem;
      margin:0 0 .65rem;
      padding:.35rem .7rem;
      color:#172b24;
      font-size:1.05rem;
      font-weight:800;
      text-decoration:none;
    }
    .workspace-brand img {
      width:40px;
      height:40px;
      flex:0 0 40px;
      object-fit:contain;
    }

    /* Profile Badge at top */
    .user-profile-badge {
      display:flex;
      align-items:center;
      gap:.75rem;
      padding:.6rem .7rem;
      margin-bottom:.6rem;
      border-radius:8px;
      color:#172b24;
      text-decoration:none;
      transition:background 150ms ease;
    }
    .user-profile-badge:hover {
      background:#f0fdf4;
    }
    .user-avatar {
      display:grid;
      width:40px;
      height:40px;
      flex:0 0 40px;
      place-items:center;
      border-radius:50%;
      background:#dcfce7;
      color:#166534;
      font-size:.95rem;
      font-weight:800;
      object-fit:cover;
    }
    .user-info {
      display:flex;
      min-width:0;
      flex-direction:column;
      line-height:1.25;
    }
    .user-info strong {
      overflow:hidden;
      font-size:.88rem;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:#0f172a;
    }
    .user-info span {
      font-size:.72rem;
      color:#64748b;
    }

    .sidebar-section-label {
      margin:.4rem 0 .4rem;
      padding:0 .7rem;
      color:#94a3b8;
      font-size:.64rem;
      font-weight:800;
      letter-spacing:.12em;
    }

    .sidebar-nav { display:grid; gap:.75rem; }
    .sidebar-nav-group { display:grid; gap:.2rem; }

    /* Fluent Nav Item with Left Accent Bar */
    .sidebar-link {
      position:relative;
      display:flex;
      min-height:38px;
      align-items:center;
      gap:.75rem;
      padding:.55rem .75rem;
      border:0;
      border-radius:6px;
      background:transparent;
      color:#475569;
      font-family:inherit;
      font-size:.83rem;
      font-weight:600;
      text-align:left;
      text-decoration:none;
      transition:background 150ms ease,color 150ms ease;
      cursor:pointer;
    }
    .sidebar-link:hover { background:#f0fdf4; color:#047857; }
    .sidebar-link.active {
      background:#e8f5ec;
      color:#047857;
      font-weight:750;
    }
    .sidebar-link.active::before {
      content:'';
      position:absolute;
      left:2px;
      top:50%;
      transform:translateY(-50%);
      width:3.5px;
      height:18px;
      background:#10b981;
      border-radius:4px;
    }

    .sidebar-icon {
      display:grid;
      width:22px;
      flex:0 0 22px;
      place-items:center;
      color:currentColor;
      font-size:1.15rem;
    }

    .sidebar-footer {
      margin-top:auto;
      padding-top:.7rem;
      border-top:1px solid #edf2ee;
      display:grid;
      gap:.2rem;
    }
    .sidebar-footer-link {
      display:flex;
      min-height:38px;
      align-items:center;
      gap:.75rem;
      padding:.5rem .75rem;
      border-radius:6px;
      color:#64748b;
      font-size:.83rem;
      font-weight:600;
      text-decoration:none;
      background:none;
      border:0;
      cursor:pointer;
      text-align:left;
      width:100%;
      box-sizing:border-box;
      transition:background 150ms ease,color 150ms ease;
    }
    .sidebar-footer-link:hover { background:#f0fdf4; color:#047857; }
    .btn-logout:hover { background:#fef2f2; color:#dc2626; }

    @media(max-width:760px) {
      :host { flex:0 0 auto; }
      .admin-sidebar {
        position:sticky;
        z-index:12;
        width:100%;
        height:auto;
        padding:calc(.7rem + 58px) 1rem .55rem;
        overflow:visible;
        border-right:0;
        border-bottom:1px solid #e3e9e4;
      }
      .user-profile-badge, .sidebar-section-label, .sidebar-footer { display:none; }
      .workspace-brand { justify-content:center; padding:.35rem 0; }
      .workspace-brand span { display:none; }
      .sidebar-nav {
        display:flex;
        overflow-x:auto;
        gap:.4rem;
        padding-bottom:.2rem;
      }
      .sidebar-nav-group { display:contents; }
      .sidebar-link {
        min-height:36px;
        flex:0 0 auto;
        gap:.4rem;
        padding:.45rem .65rem;
        font-size:.74rem;
        white-space:nowrap;
      }
      .sidebar-icon { width:18px; flex-basis:18px; font-size:.95rem; }
    }
  `]
})
export class AdminSidebarComponent {
  readonly authService = inject(AuthService);
  readonly avatarError = signal(false);

  get accountInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'A';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'A';
  }
}
