import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboard } from '../../../core/models/admin.model';

interface QuickAction {
  label: string;
  link: string;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-content">
        @if (loading()) {
          <div class="loading-state" role="status">
            <div class="spinner"></div>
            <p>Loading dashboard metrics...</p>
          </div>
        } @else if (error(); as message) {
          <div class="error-state" role="alert">
            <span class="material-icons-outlined" aria-hidden="true">error_outline</span>
            <div>
              <strong>Dashboard unavailable</strong>
              <p>{{ message }}</p>
            </div>
            <button class="refresh-button" type="button" (click)="load()">Try again</button>
          </div>
        } @else if (stats(); as s) {
          @if (s.pendingReviewProperties > 0) {
            <div class="review-alert">
              <span class="review-alert-icon material-icons-outlined" aria-hidden="true">fact_check</span>
              <div class="review-alert-copy">
                <strong>{{ s.pendingReviewProperties }} listing{{ s.pendingReviewProperties === 1 ? '' : 's' }} need review</strong>
                <span>Approve or return submissions before they appear in search.</span>
              </div>
              <a routerLink="/admin/moderation" class="review-alert-link">
                Open review queue <span aria-hidden="true">→</span>
              </a>
            </div>
          }

          <section class="overview-section" aria-labelledby="overview-title">
            <div class="section-heading">
              <div>
                <h2 id="overview-title">At a glance</h2>
                <p>Key numbers across your marketplace</p>
              </div>
            </div>
            <div class="overview-grid">
              <a class="overview-card" routerLink="/admin/users">
                <span class="overview-icon users-icon material-icons-outlined" aria-hidden="true">group</span>
                <span class="overview-label">Registered users</span>
                <strong>{{ s.totalUsers | number }}</strong>
                <span class="overview-note">{{ s.activeUsers | number }} active accounts</span>
              </a>
              <a class="overview-card" routerLink="/admin/listings">
                <span class="overview-icon listings-icon material-icons-outlined" aria-hidden="true">home_work</span>
                <span class="overview-label">Published listings</span>
                <strong>{{ s.publishedProperties | number }}</strong>
                <span class="overview-note">of {{ s.totalProperties | number }} total properties</span>
              </a>
              <a class="overview-card" routerLink="/admin/moderation" [class.needs-attention]="s.pendingReviewProperties > 0">
                <span class="overview-icon review-icon material-icons-outlined" aria-hidden="true">fact_check</span>
                <span class="overview-label">Needs review</span>
                <strong>{{ s.pendingReviewProperties | number }}</strong>
                <span class="overview-note">Property submissions in queue</span>
              </a>
              <a class="overview-card" routerLink="/admin/support">
                <span class="overview-icon support-icon material-icons-outlined" aria-hidden="true">support_agent</span>
                <span class="overview-label">Open support cases</span>
                <strong>{{ s.openTickets | number }}</strong>
                <span class="overview-note">Waiting for staff attention</span>
              </a>
            </div>
          </section>

          <div class="dashboard-sections">
            <section class="panel">
              <div class="panel-header">
                <div class="panel-heading">
                  <span class="panel-icon material-icons-outlined" aria-hidden="true">group</span>
                  <div><h2 class="panel-title">Users</h2><p>Account activity and roles</p></div>
                </div>
                <a routerLink="/admin/users" class="section-link">Manage users <span aria-hidden="true">→</span></a>
              </div>
              <div class="panel-body">
                <div class="stat-grid">
                  <div class="stat-card"><span class="stat-label">Total users</span><strong class="stat-value">{{ s.totalUsers | number }}</strong><span class="stat-hint">All registered accounts</span></div>
                  <div class="stat-card"><span class="stat-label">Active users</span><strong class="stat-value">{{ s.activeUsers | number }}</strong><span class="stat-hint">Currently active accounts</span></div>
                  <div class="stat-card"><span class="stat-label">Restricted users</span><strong class="stat-value">{{ s.restrictedUsers | number }}</strong><span class="stat-hint">Access limited by admins</span></div>
                  <div class="stat-card"><span class="stat-label">Renters</span><strong class="stat-value">{{ s.totalRenters | number }}</strong><span class="stat-hint">Property seekers</span></div>
                  <div class="stat-card"><span class="stat-label">Landlords</span><strong class="stat-value">{{ s.totalLandlords | number }}</strong><span class="stat-hint">Property owners</span></div>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="panel-header">
                <div class="panel-heading">
                  <span class="panel-icon listings-panel-icon material-icons-outlined" aria-hidden="true">home_work</span>
                  <div><h2 class="panel-title">Listings</h2><p>Moderation and marketplace inventory</p></div>
                </div>
                <a routerLink="/admin/moderation" class="section-link">Review queue <span aria-hidden="true">→</span></a>
              </div>
              <div class="panel-body">
                <div class="stat-grid">
                  <div class="stat-card"><span class="stat-label">Pending review</span><strong class="stat-value">{{ s.pendingReviewProperties | number }}</strong><span class="stat-hint">Awaiting admin decision</span></div>
                  <div class="stat-card"><span class="stat-label">Published</span><strong class="stat-value">{{ s.publishedProperties | number }}</strong><span class="stat-hint">Visible in property search</span></div>
                  <div class="stat-card"><span class="stat-label">Rejected</span><strong class="stat-value">{{ s.rejectedProperties | number }}</strong><span class="stat-hint">Returned for correction</span></div>
                  <div class="stat-card"><span class="stat-label">All properties</span><strong class="stat-value">{{ s.totalProperties | number }}</strong><span class="stat-hint">Total listing records</span></div>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="panel-header">
                <div class="panel-heading">
                  <span class="panel-icon safety-panel-icon material-icons-outlined" aria-hidden="true">shield</span>
                  <div><h2 class="panel-title">Safety and support</h2><p>Cases that may need follow-up</p></div>
                </div>
                <a routerLink="/admin/reports" class="section-link">Review reports <span aria-hidden="true">→</span></a>
              </div>
              <div class="panel-body">
                <div class="stat-grid">
                  <div class="stat-card"><span class="stat-label">Open reports</span><strong class="stat-value">{{ s.openReports | number }}</strong><span class="stat-hint">User and listing concerns</span></div>
                  <div class="stat-card"><span class="stat-label">Open support cases</span><strong class="stat-value">{{ s.openTickets | number }}</strong><span class="stat-hint">Support requests to resolve</span></div>
                  <div class="stat-card"><span class="stat-label">Premium subscriptions</span><strong class="stat-value">{{ s.activePremiumSubscriptions | number }}</strong><span class="stat-hint">Currently active</span></div>
                  <div class="stat-card"><span class="stat-label">Subscription revenue</span><strong class="stat-value revenue-value">{{ s.totalSubscriptionRevenueETB | number:'1.0-0' }} <small>ETB</small></strong><span class="stat-hint">Recorded total revenue</span></div>
                </div>
              </div>
            </section>
          </div>

          <section class="quick-actions-section" aria-labelledby="quick-actions-title">
            <div class="section-heading">
              <div><h2 id="quick-actions-title">Common tasks</h2><p>Go directly to an admin workspace</p></div>
            </div>
            <div class="quick-actions-grid">
              @for (action of quickActions; track action.link) {
                <a class="list-row quick-link" [routerLink]="action.link">
                  <span class="quick-action-icon material-icons-outlined" aria-hidden="true">{{ action.icon }}</span>
                  <span class="stack">
                    <strong>{{ action.label }}</strong>
                    <span class="muted">{{ action.hint }}</span>
                  </span>
                  <span class="quick-arrow material-icons-outlined" aria-hidden="true">arrow_forward</span>
                </a>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      box-sizing: border-box;
      margin: 0.75rem;
      overflow: hidden;
      border: 1px solid #dfe8e1;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(24, 58, 44, 0.035);
      color: #172b24;
    }
    .admin-header {
      background: linear-gradient(115deg, #ffffff 35%, #f0f8f3 100%);
      border-bottom: 1px solid #e2e9e4;
      padding: 1.75rem clamp(1.25rem, 3vw, 2.5rem);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .refresh-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 42px;
      padding: 0.625rem 0.9rem;
      border: 1px solid #d5e2d9;
      border-radius: 10px;
      background: #fff;
      color: #245c40;
      font: inherit;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
      white-space: nowrap;
    }
    .refresh-button:hover:not(:disabled) {
      background: #f2f8f4;
      border-color: #9dc5aa;
      transform: translateY(-1px);
    }
    .refresh-button:focus-visible,
    a:focus-visible {
      outline: 3px solid #7ab894;
      outline-offset: 3px;
    }
    .refresh-button:disabled {
      cursor: wait;
      opacity: 0.65;
    }
    .refresh-button .material-icons-outlined { font-size: 1rem; }
    .admin-content {
      flex: 1;
      width: 100%;
      max-width: 1560px;
      box-sizing: border-box;
      margin: 0 auto;
      padding: clamp(1rem, 2.5vw, 2rem);
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 280px;
      color: #64766d;
    }
    .spinner {
      width: 42px;
      height: 42px;
      border: 4px solid #dce9df;
      border-top-color: #288252;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 0.75rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border: 1px solid #f1c5c2;
      border-radius: 14px;
      background: #fff7f6;
      color: #8d2923;
    }
    .error-state > .material-icons-outlined { font-size: 1.7rem; }
    .error-state p { margin: 0.25rem 0 0; color: #79524e; font-size: 0.78rem; }
    .error-state .refresh-button { margin-left: auto; }
    .review-alert {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      margin-bottom: 1.5rem;
      padding: 1rem 1.15rem;
      border: 1px solid #f0d39a;
      border-radius: 14px;
      background: #fffaf0;
      color: #674510;
    }
    .review-alert-icon {
      display: grid;
      width: 40px;
      height: 40px;
      flex: 0 0 40px;
      place-items: center;
      border-radius: 12px;
      background: #fff0c9;
      color: #9a6715;
    }
    .review-alert-copy { display: flex; flex: 1; flex-direction: column; gap: 0.18rem; }
    .review-alert-copy strong { font-size: 0.82rem; }
    .review-alert-copy span { color: #806b48; font-size: 0.73rem; }
    .review-alert-link,
    .section-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: #23734a;
      font-size: 0.73rem;
      font-weight: 750;
      text-decoration: none;
      white-space: nowrap;
    }
    .review-alert-link:hover,
    .section-link:hover { color: #145634; text-decoration: underline; }
    .overview-section,
    .quick-actions-section { margin-bottom: 1.5rem; }
    .section-heading {
      display: flex;
      align-items: end;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .section-heading h2 {
      margin: 0;
      color: #183a2c;
      font-size: 0.98rem;
      font-weight: 750;
      letter-spacing: -0.02em;
    }
    .section-heading p {
      margin: 0.25rem 0 0;
      color: #718078;
      font-size: 0.73rem;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }
    .overview-card {
      position: relative;
      display: grid;
      grid-template-columns: 44px 1fr;
      grid-template-rows: auto auto auto;
      align-items: center;
      column-gap: 0.8rem;
      row-gap: 0.2rem;
      min-width: 0;
      padding: 1.1rem;
      border: 1px solid #e1e9e3;
      border-radius: 15px;
      background: #fff;
      color: inherit;
      text-decoration: none;
      box-shadow: 0 2px 6px rgba(24, 58, 44, 0.035);
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }
    .overview-card:hover {
      transform: translateY(-2px);
      border-color: #b7d3bf;
      box-shadow: 0 8px 20px rgba(24, 58, 44, 0.08);
    }
    .overview-card.needs-attention {
      border-color: #efd39a;
      background: linear-gradient(135deg, #fff 60%, #fffaf0);
    }
    .overview-icon {
      display: grid;
      grid-row: 1 / span 3;
      width: 44px;
      height: 44px;
      place-items: center;
      border-radius: 13px;
      font-size: 1.35rem;
    }
    .users-icon { background: #edf4ff; color: #4575bc; }
    .listings-icon { background: #eaf6ef; color: #318057; }
    .review-icon { background: #fff2d6; color: #a77316; }
    .support-icon { background: #f2edff; color: #7455ae; }
    .overview-label {
      color: #63736a;
      font-size: 0.69rem;
      font-weight: 650;
    }
    .overview-card > strong {
      color: #173a2b;
      font-size: 1.48rem;
      font-weight: 800;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }
    .overview-note { color: #839087; font-size: 0.64rem; }
    .dashboard-sections {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .panel {
      min-width: 0;
      overflow: hidden;
      border: 1px solid #e1e9e3;
      border-radius: 15px;
      background: #fff;
      box-shadow: 0 2px 6px rgba(24, 58, 44, 0.035);
    }
    .panel:last-child { grid-column: 1 / -1; }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 70px;
      padding: 0.95rem 1.1rem;
      border-bottom: 1px solid #edf1ed;
    }
    .panel-heading { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
    .panel-icon {
      display: grid;
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      place-items: center;
      border-radius: 12px;
      background: #eaf6ef;
      color: #318057;
    }
    .listings-panel-icon { background: #edf4ff; color: #4575bc; }
    .safety-panel-icon { background: #fff2d6; color: #a77316; }
    .panel-title {
      margin: 0;
      color: #203b2e;
      font-size: 0.84rem;
      font-weight: 750;
    }
    .panel-heading p { margin: 0.2rem 0 0; color: #849087; font-size: 0.66rem; }
    .panel-body { padding: 0.85rem; }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.65rem;
    }
    .stat-card {
      min-width: 0;
      padding: 0.85rem;
      border: 1px solid #edf1ed;
      border-radius: 11px;
      background: #f8faf8;
    }
    .stat-label {
      display: block;
      margin-bottom: 0.42rem;
      color: #6f7d74;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.035em;
      text-transform: uppercase;
    }
    .stat-value {
      display: block;
      margin-bottom: 0.2rem;
      color: #203b2e;
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
    .stat-value small { font-size: 0.66rem; font-weight: 700; }
    .revenue-value { font-size: clamp(1rem, 1.35vw, 1.25rem); }
    .stat-hint { color: #87938b; font-size: 0.62rem; line-height: 1.4; }
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .list-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      min-height: 78px;
      padding: 0.85rem;
      border: 1px solid #e1e9e3;
      border-radius: 13px;
      background: #fff;
      text-decoration: none;
      transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    }
    .list-row:hover {
      transform: translateY(-1px);
      border-color: #b7d3bf;
      background: #f8fbf8;
    }
    .quick-action-icon {
      display: grid;
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      place-items: center;
      border-radius: 11px;
      background: #edf5ef;
      color: #318057;
      font-size: 1.2rem;
    }
    .stack { display: flex; flex: 1; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .stack strong { color: #263d31; font-size: 0.72rem; font-weight: 750; }
    .muted { color: #7a887f; font-size: 0.62rem; line-height: 1.35; }
    .quick-arrow { color: #7c9184; font-size: 1.05rem; }
    .quick-link:hover strong { color: #23734a; }
    @media (max-width: 1100px) {
      .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .quick-actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .admin-header { align-items: flex-start; }
      .dashboard-sections { grid-template-columns: 1fr; }
      .panel:last-child { grid-column: auto; }
      .panel-header { align-items: flex-start; }
    }
    @media (max-width: 520px) {
      .admin-page { margin: 0.5rem; border-radius: 12px; }
      .admin-header { padding: 1.1rem 0.9rem; }
      .refresh-button { padding: 0.55rem 0.65rem; font-size: 0.75rem; }
      .admin-content { padding: 0.85rem; }
      .overview-grid { grid-template-columns: 1fr 1fr; gap: 0.6rem; }
      .overview-card { grid-template-columns: 34px 1fr; column-gap: 0.55rem; padding: 0.75rem; }
      .overview-icon { width: 34px; height: 34px; font-size: 1.1rem; }
      .overview-card > strong { font-size: 1.35rem; }
      .overview-label { font-size: 0.68rem; }
      .overview-note { font-size: 0.62rem; }
      .review-alert { align-items: flex-start; flex-wrap: wrap; }
      .review-alert-link { margin-left: 3.2rem; }
      .panel-header { flex-direction: column; gap: 0.65rem; }
      .section-link { align-self: flex-start; }
      .stat-grid { gap: 0.5rem; }
      .stat-card { padding: 0.7rem; }
      .stat-label { font-size: 0.61rem; }
      .stat-value { font-size: 1.25rem; }
      .stat-hint { font-size: 0.62rem; }
      .quick-actions-grid { grid-template-columns: 1fr; }
      .error-state { align-items: flex-start; flex-wrap: wrap; }
      .error-state .refresh-button { margin-left: 2.7rem; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<AdminDashboard | null>(null);

  readonly quickActions: QuickAction[] = [
    { label: 'Moderation queue', link: '/admin/moderation', hint: 'Review new property submissions', icon: 'fact_check' },
    { label: 'User management', link: '/admin/users', hint: 'Manage accounts and restrictions', icon: 'group' },
    { label: 'Reports & investigations', link: '/admin/reports', hint: 'Review safety and listing reports', icon: 'flag' },
    { label: 'Support cases', link: '/admin/support', hint: 'Assign cases and reply to users', icon: 'support_agent' },
    { label: 'Payments', link: '/admin/payments', hint: 'Review and verify transactions', icon: 'payments' },
    { label: 'Subscription plans', link: '/admin/plans', hint: 'Manage plans and entitlements', icon: 'workspace_premium' },
    { label: 'Audit history', link: '/admin/audit-logs', hint: 'Review administrative activity', icon: 'history' },
    { label: 'Platform settings', link: '/admin/settings', hint: 'Configure platform policies', icon: 'settings' }
  ];

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getDashboard().subscribe({
      next: (res) => {
        if (!res.succeeded || !res.data) {
          this.error.set(res.errors?.[0] || 'The dashboard metrics could not be loaded.');
          this.loading.set(false);
          return;
        }
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.errors?.[0] || 'The dashboard metrics could not be loaded.');
        this.loading.set(false);
      }
    });
  }
}
