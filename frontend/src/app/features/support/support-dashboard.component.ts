import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupportDashboard } from '../../core/models/support.model';
import { SupportService } from '../../core/services/support.service';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="dashboard">
      <header class="heading">
        <div>
          <p class="eyebrow"><span class="material-icons-outlined" aria-hidden="true">waving_hand</span> YOUR SUPPORT OVERVIEW</p>
          <h1>Good work starts with great support.</h1>
          <p class="subtitle">Keep every conversation moving and help our community feel at home.</p>
        </div>
        <a class="heading-action" routerLink="/support/tickets">
          <span class="material-icons-outlined" aria-hidden="true">confirmation_number</span>
          View case queue
          <span class="material-icons-outlined arrow" aria-hidden="true">arrow_forward</span>
        </a>
      </header>

      @if (error()) {
        <section class="error" role="alert">
          <span class="material-icons-outlined error-icon" aria-hidden="true">cloud_off</span>
          <div class="error-copy">
            <strong>We couldn't load your overview</strong>
            <p>{{ error() }}</p>
          </div>
          <button type="button" (click)="load()">
            <span class="material-icons-outlined" aria-hidden="true">refresh</span>
            Try again
          </button>
        </section>
      } @else if (loading()) {
        <section class="loading-state" role="status">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span>Preparing your support overview…</span>
        </section>
      } @else if (dashboard(); as data) {
        <div class="section-heading">
          <div>
            <h2>Queue overview</h2>
            <p>A live snapshot of the requests that need your attention.</p>
          </div>
          <span class="live-status"><span></span> Live overview</span>
        </div>

        <section class="stats" aria-label="Support ticket summary">
          <article class="stat-card open">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">inbox</span>
            <span class="stat-label">Open cases</span>
            <strong>{{ data.openTickets }}</strong>
            <span class="stat-note">In the support queue</span>
          </article>
          <article class="stat-card progress">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">pending_actions</span>
            <span class="stat-label">In progress</span>
            <strong>{{ data.inProgressTickets }}</strong>
            <span class="stat-note">Being worked on</span>
          </article>
          <article class="stat-card waiting">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">hourglass_top</span>
            <span class="stat-label">Waiting for user</span>
            <strong>{{ data.waitingForUserTickets }}</strong>
            <span class="stat-note">Awaiting a reply</span>
          </article>
          <article class="stat-card escalated">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">priority_high</span>
            <span class="stat-label">Escalated</span>
            <strong>{{ data.escalatedTickets }}</strong>
            <span class="stat-note">Needs priority attention</span>
          </article>
          <article class="stat-card unassigned">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">person_add_alt</span>
            <span class="stat-label">Unassigned</span>
            <strong>{{ data.unassignedTickets }}</strong>
            <span class="stat-note">Ready to be picked up</span>
          </article>
          <article class="stat-card mine">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">assignment_ind</span>
            <span class="stat-label">Assigned to me</span>
            <strong>{{ data.myAssignedTickets }}</strong>
            <span class="stat-note">Your active cases</span>
          </article>
          <article class="stat-card resolved">
            <span class="stat-icon material-icons-outlined" aria-hidden="true">task_alt</span>
            <span class="stat-label">Resolved today</span>
            <strong>{{ data.resolvedToday }}</strong>
            <span class="stat-note">Great work today</span>
          </article>
        </section>

        <section class="next-step">
          <span class="next-step-icon material-icons-outlined" aria-hidden="true">forum</span>
          <div class="next-step-copy">
            <span class="next-step-eyebrow">NEXT UP</span>
            <h2>Every reply makes a difference.</h2>
            <p><strong>{{ data.totalOpenTickets }} case(s)</strong> still need attention across the support queue.</p>
          </div>
          <a routerLink="/support/tickets">
            Open case queue
            <span class="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </section>
      }
    </main>
  `,
  styles: [`
    :host { display:block; }
    .dashboard { max-width:1440px; margin:0 auto; padding:clamp(1.25rem,3vw,2.5rem); }
    .heading { display:flex; min-height:190px; align-items:center; justify-content:space-between; gap:2rem; margin-bottom:2rem; padding:2rem clamp(1.5rem,3vw,2.5rem); overflow:hidden; border:1px solid #dceee4; border-radius:20px; background:radial-gradient(ellipse at 86% 12%,#d7f3e4 0%,transparent 34%),linear-gradient(115deg,#fff 0%,#f0f9f3 100%); box-shadow:0 12px 32px #164c3010; }
    .heading>div { max-width:700px; }
    .eyebrow { display:flex; align-items:center; gap:.4rem; margin:0 0 .8rem; color:#07845a; font-size:.66rem; font-weight:800; letter-spacing:.12em; }
    .eyebrow .material-icons-outlined { font-size:1rem; }
    h1 { margin:0; color:#173b2e; font-size:clamp(1.6rem,3vw,2.35rem); font-weight:780; letter-spacing:-.055em; line-height:1.12; }
    .subtitle { max-width:550px; margin:.65rem 0 0; color:#65766c; font-size:.9rem; line-height:1.65; }
    .heading-action { display:inline-flex; min-height:46px; flex:0 0 auto; align-items:center; gap:.5rem; padding:0 1rem; border-radius:11px; background:linear-gradient(135deg,#10a66d,#07845a); color:#fff; font-size:.78rem; font-weight:750; text-decoration:none; box-shadow:0 7px 16px #07845a26; transition:transform 150ms ease,box-shadow 150ms ease; }
    .heading-action:hover { transform:translateY(-2px); box-shadow:0 10px 20px #07845a38; }
    .heading-action .material-icons-outlined { font-size:1.1rem; }
    .heading-action .arrow { margin-left:.15rem; font-size:1rem; }
    .section-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
    .section-heading h2 { margin:0; color:#203d31; font-size:1.05rem; font-weight:760; letter-spacing:-.025em; }
    .section-heading p { margin:.3rem 0 0; color:#78877e; font-size:.76rem; }
    .live-status { display:inline-flex; align-items:center; gap:.45rem; padding:.45rem .65rem; border:1px solid #dcebe1; border-radius:999px; background:#fff; color:#63766b; font-size:.68rem; font-weight:650; white-space:nowrap; }
    .live-status span { width:7px; height:7px; border-radius:50%; background:#20b77a; box-shadow:0 0 0 3px #20b77a1c; }
    .stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.9rem; }
    .stat-card { position:relative; display:grid; grid-template-columns:1fr auto; grid-template-rows:auto auto 1fr; min-height:152px; gap:.2rem .7rem; padding:1.15rem; overflow:hidden; border:1px solid #e6ece8; border-radius:15px; background:#fff; box-shadow:0 4px 14px #173b2e08; transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease; }
    .stat-card:hover { transform:translateY(-3px); border-color:#cfe4d6; box-shadow:0 12px 24px #173b2e12; }
    .stat-icon { display:grid; width:38px; height:38px; grid-column:2; grid-row:1 / span 2; place-items:center; border-radius:11px; background:#e9f7ef; color:#07845a; font-size:1.2rem; }
    .stat-label { align-self:center; color:#596b60; font-size:.76rem; font-weight:650; }
    .stat-card strong { grid-column:1; margin:.45rem 0 0; color:#1b3d2e; font-size:2rem; font-weight:780; letter-spacing:-.05em; line-height:1.1; }
    .stat-note { grid-column:1 / -1; align-self:end; margin-top:.65rem; color:#8a9890; font-size:.68rem; }
    .progress .stat-icon { background:#edf2ff; color:#526fc4; }
    .waiting .stat-icon { background:#fff5e8; color:#c47b1c; }
    .escalated .stat-icon { background:#fff0ee; color:#cc5143; }
    .unassigned .stat-icon { background:#f2efff; color:#775bc5; }
    .mine .stat-icon { background:#eaf5fb; color:#367ea0; }
    .resolved .stat-icon { background:#e9f7ef; color:#07845a; }
    .next-step { display:flex; align-items:center; gap:1rem; margin-top:1.35rem; padding:1.35rem 1.5rem; border:1px solid #174c3c; border-radius:16px; background:radial-gradient(ellipse at 90% 10%,#ffffff18,transparent 35%),linear-gradient(110deg,#174c3c,#10372d); color:#fff; box-shadow:0 10px 24px #123b301c; }
    .next-step-icon { display:grid; width:46px; height:46px; flex:0 0 46px; place-items:center; border:1px solid #ffffff20; border-radius:13px; background:#ffffff13; color:#a7f3d0; font-size:1.35rem; }
    .next-step-copy { min-width:0; flex:1; }
    .next-step-eyebrow { color:#a7f3d0; font-size:.61rem; font-weight:800; letter-spacing:.14em; }
    .next-step h2 { margin:.25rem 0 0; font-size:1rem; letter-spacing:-.02em; }
    .next-step p { margin:.35rem 0 0; color:#c6ddd1; font-size:.77rem; }
    .next-step p strong { color:#fff; }
    .next-step>a { display:inline-flex; min-height:42px; flex:0 0 auto; align-items:center; gap:.45rem; padding:0 .85rem; border:1px solid #ffffff35; border-radius:10px; background:#ffffff12; color:#fff; font-size:.74rem; font-weight:700; text-decoration:none; transition:background 150ms ease; }
    .next-step>a:hover { background:#ffffff24; }
    .next-step>a .material-icons-outlined { font-size:1rem; }
    .loading-state,.error { display:flex; min-height:130px; align-items:center; gap:.8rem; padding:1.2rem; border:1px solid #e6ece8; border-radius:15px; background:#fff; box-shadow:0 4px 14px #173b2e08; color:#617268; font-size:.84rem; }
    .loading-spinner { width:21px; height:21px; border:2px solid #cfe7d8; border-top-color:#07845a; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .error { border-color:#f1d8d6; color:#a33f38; }
    .error-icon { color:#d25449; font-size:1.5rem; }
    .error-copy { min-width:0; flex:1; }
    .error-copy strong { color:#7f302b; font-size:.85rem; }
    .error-copy p { margin:.3rem 0 0; color:#8c625f; font-size:.76rem; }
    .error button { display:inline-flex; min-height:38px; align-items:center; gap:.35rem; padding:0 .7rem; border:1px solid #e8c3c0; border-radius:9px; background:#fff; color:#9b3933; font:inherit; font-size:.75rem; font-weight:700; cursor:pointer; }
    .error button .material-icons-outlined { font-size:1rem; }
    @media(max-width:1050px) { .stats { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media(max-width:720px) { .heading { min-height:0; align-items:flex-start; flex-direction:column; gap:1.1rem; margin-bottom:1.5rem; } .stats { grid-template-columns:repeat(2,minmax(0,1fr)); } .next-step { align-items:flex-start; flex-wrap:wrap; } .next-step-copy { flex-basis:calc(100% - 65px); } .next-step>a { margin-left:3.85rem; } }
    @media(max-width:480px) { .dashboard { padding:1rem; } .heading { padding:1.35rem; border-radius:16px; } .heading-action { width:100%; justify-content:center; } .section-heading { align-items:flex-start; } .section-heading p { max-width:230px; line-height:1.5; } .live-status { font-size:.62rem; } .stats { gap:.6rem; } .stat-card { min-height:138px; gap:.2rem .4rem; padding:.85rem; } .stat-icon { width:33px; height:33px; border-radius:10px; font-size:1.05rem; } .stat-label { font-size:.69rem; } .stat-card strong { font-size:1.7rem; } .stat-note { font-size:.62rem; } .next-step { gap:.75rem; padding:1rem; } .next-step>a { width:calc(100% - 3.5rem); justify-content:center; margin-left:3.4rem; } .error { align-items:flex-start; flex-wrap:wrap; } .error button { margin-left:2.3rem; } }
    @media(prefers-reduced-motion:reduce) { .loading-spinner { animation-duration:2s; } .stat-card,.heading-action { transition:none; } }
  `],
})
export class SupportDashboardComponent implements OnInit {
  private readonly supportService = inject(SupportService);

  readonly dashboard = signal<SupportDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.supportService.getDashboard().subscribe({
      next: result => {
        this.loading.set(false);
        if (result.succeeded && result.data) {
          this.dashboard.set(result.data);
        } else {
          this.error.set(result.errors?.join(' ') || 'Unable to load the support dashboard.');
        }
      },
      error: response => {
        this.loading.set(false);
        this.error.set(response.error?.errors?.join(' ') || 'Unable to load the support dashboard.');
      },
    });
  }
}
