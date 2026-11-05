import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-support-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="support-layout">
      <aside class="sidebar" aria-label="Support navigation">
        <a routerLink="/" class="brand" aria-label="ETrental home">
          <img src="/etrental-logo.png" alt="" />
          <span class="brand-copy">
            <strong>ETrental</strong>
            <small>SUPPORT PORTAL</small>
          </span>
        </a>

        <div class="workspace-label">
          <span class="material-icons-outlined" aria-hidden="true">support_agent</span>
          <span>Agent workspace</span>
          <span class="online-indicator" aria-label="Online"></span>
        </div>

        <div class="account">
          <span class="avatar">{{ accountInitials }}</span>
          <span class="account-copy">
            <strong>{{ authService.currentUser()?.fullName || 'Support agent' }}</strong>
            <span>Customer care team</span>
          </span>
        </div>

        <nav class="navigation">
          <div class="navigation-group">
            <p class="section-label">OVERVIEW</p>
            <a routerLink="/support/dashboard" routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }">
              <span class="material-icons-outlined" aria-hidden="true">space_dashboard</span>
              <span>Dashboard</span>
            </a>
          </div>
          <div class="navigation-group">
            <p class="section-label">CUSTOMER CARE</p>
            <a routerLink="/support/tickets" routerLinkActive="active">
              <span class="material-icons-outlined" aria-hidden="true">confirmation_number</span>
              <span>Support cases</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/properties">
            <span class="material-icons-outlined" aria-hidden="true">home_work</span>
            <span>Browse rentals</span>
          </a>
          <button type="button" (click)="authService.logout()">
            <span class="material-icons-outlined" aria-hidden="true">logout</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div class="topbar-copy">
            <span class="topbar-eyebrow">ETRENTAL · CUSTOMER CARE</span>
            <strong>Support workspace</strong>
            <span>Help renters and landlords feel at home.</span>
          </div>
          <div class="topbar-actions">
            <span class="topbar-avatar">{{ accountInitials }}</span>
            <span class="topbar-agent">{{ authService.currentUser()?.fullName || 'Support agent' }}</span>
            <a routerLink="/support/tickets">
              <span class="material-icons-outlined" aria-hidden="true">confirmation_number</span>
              <span>View cases</span>
            </a>
          </div>
        </header>
        <section class="page-content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100dvh; color:#172b24; }
    .support-layout { display:flex; min-height:100dvh; background:#f6f8f7; }
    .sidebar { position:sticky; top:0; display:flex; width:272px; height:100dvh; flex:0 0 272px; flex-direction:column; box-sizing:border-box; padding:1.5rem 1.1rem 1rem; border-right:1px solid #e2e8e4; background:#fff; color:#172b24; }
    .brand { display:flex; align-items:center; gap:.75rem; padding:.25rem .55rem 1.5rem; color:#172b24; text-decoration:none; }
    .brand img { width:42px; height:42px; object-fit:contain; }
    .brand-copy { display:grid; gap:.15rem; }
    .brand-copy strong { font-size:1.1rem; font-weight:800; letter-spacing:-.03em; }
    .brand-copy small { color:#07845a; font-size:.6rem; font-weight:800; letter-spacing:.16em; }
    .workspace-label { display:flex; align-items:center; gap:.55rem; padding:.7rem .65rem; border:1px solid #e7ece8; border-radius:11px; background:#f8faf8; color:#526056; font-size:.72rem; font-weight:650; }
    .workspace-label .material-icons-outlined { color:#07845a; font-size:1.05rem; }
    .online-indicator { width:7px; height:7px; margin-left:auto; border-radius:50%; background:#20b77a; box-shadow:0 0 0 3px #20b77a1c; }
    .account { display:flex; align-items:center; gap:.7rem; margin:1.15rem 0 1.6rem; padding:.8rem .65rem; border-bottom:1px solid #e7ece8; }
    .avatar,.topbar-avatar { display:grid; width:38px; height:38px; flex:0 0 38px; place-items:center; border-radius:50%; background:#d5f4e3; color:#176b4d; font-size:.78rem; font-weight:800; }
    .account-copy { display:grid; min-width:0; gap:.25rem; }
    .account-copy strong { overflow:hidden; font-size:.8rem; text-overflow:ellipsis; white-space:nowrap; }
    .account-copy span { color:#778176; font-size:.7rem; }
    .section-label { margin:0 .7rem .6rem; color:#778176; font-size:.63rem; font-weight:800; letter-spacing:.15em; }
    .navigation { display:grid; gap:.8rem; }
    .navigation-group { display:grid; gap:.35rem; }
    .navigation a,.sidebar-footer a,.sidebar-footer button { display:flex; gap:.75rem; align-items:center; min-height:44px; padding:.65rem .75rem; border:1px solid transparent; border-radius:10px; background:transparent; color:#526056; font:inherit; font-size:.83rem; font-weight:600; text-align:left; text-decoration:none; cursor:pointer; transition:background 160ms ease,color 160ms ease,border-color 160ms ease; }
    .navigation a .material-icons-outlined,.sidebar-footer .material-icons-outlined { color:#748176; font-size:1.15rem; }
    .navigation a:hover,.sidebar-footer a:hover,.sidebar-footer button:hover { background:#f0fdf4; color:#047857; }
    .navigation a.active { border-color:#d6eadc; background:#e8f5ec; color:#176b4d; box-shadow:inset 3px 0 #10b981; }
    .navigation a.active .material-icons-outlined { color:#07845a; }
    .sidebar-footer { display:grid; gap:.25rem; margin-top:auto; padding-top:1rem; border-top:1px solid #e7ece8; }
    .sidebar-footer button { width:100%; }
    .sidebar-footer button:hover { background:#fef2f2; color:#dc2626; }
    .workspace { min-width:0; flex:1; }
    .topbar { position:sticky; z-index:2; top:0; display:flex; min-height:86px; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem clamp(1.25rem,3vw,2.7rem); border-bottom:1px solid #e8eeea; background:#ffffffed; backdrop-filter:blur(14px); }
    .topbar-copy { display:grid; gap:.2rem; }
    .topbar-eyebrow { color:#07845a; font-size:.61rem; font-weight:800; letter-spacing:.13em; }
    .topbar-copy strong { color:#19392e; font-size:1.02rem; letter-spacing:-.02em; }
    .topbar-copy>span:last-child { color:#78877e; font-size:.74rem; }
    .topbar-actions { display:flex; align-items:center; gap:.65rem; }
    .topbar-avatar { width:34px; height:34px; flex-basis:34px; }
    .topbar-agent { max-width:160px; overflow:hidden; color:#41584d; font-size:.76rem; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
    .topbar-actions>a { display:inline-flex; min-height:40px; align-items:center; justify-content:center; gap:.4rem; margin-left:.5rem; padding:0 .9rem; border-radius:10px; background:linear-gradient(135deg,#10a66d,#07845a); color:#fff; font-size:.76rem; font-weight:750; text-decoration:none; box-shadow:0 5px 12px #07845a26; transition:transform 150ms ease,box-shadow 150ms ease; }
    .topbar-actions>a:hover { transform:translateY(-1px); box-shadow:0 8px 16px #07845a36; }
    .topbar-actions>a .material-icons-outlined { font-size:1.05rem; }
    .page-content { min-height:calc(100dvh - 86px); }
    @media(max-width:760px) { .sidebar { width:230px; flex-basis:230px; } .topbar { padding: .8rem 1.2rem; } .topbar-agent { display:none; } }
    @media(max-width:560px) { .support-layout { display:block; } .sidebar { position:static; width:100%; height:auto; padding:.75rem 1rem; } .brand { padding:.15rem .35rem .7rem; } .brand img { width:34px; height:34px; } .workspace-label,.account,.section-label,.sidebar-footer { display:none; } .navigation { display:flex; gap:.4rem; } .navigation-group { display:contents; } .navigation a { min-height:40px; flex:1; justify-content:center; gap:.45rem; padding:.5rem; font-size:.75rem; } .navigation a.active { box-shadow:inset 0 -3px #6ee7a4; } .topbar { position:static; min-height:72px; padding:.75rem 1rem; } .topbar-copy>span:last-child { display:none; } .topbar-actions>a { min-height:38px; margin-left:0; padding:0 .7rem; } .topbar-actions>a .material-icons-outlined { display:none; } }
    @media(max-width:380px) { .topbar-eyebrow { font-size:.54rem; } .topbar-copy strong { font-size:.9rem; } .topbar-actions>a { font-size:.68rem; } .navigation a { font-size:.7rem; } }
  `],
})
export class SupportLayoutComponent {
  readonly authService = inject(AuthService);

  get accountInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'S';
    const initials = `${user.firstName.trim().charAt(0)}${user.lastName.trim().charAt(0)}`;
    return initials.toUpperCase() || 'S';
  }
}
