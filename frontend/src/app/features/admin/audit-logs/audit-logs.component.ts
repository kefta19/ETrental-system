import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { AuditLogEntry } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Audit history</h1>
          <p>Read-only history of recorded administrative and platform activity.</p>
        </div>
        <button (click)="load()">Refresh</button>
      </header>
      <section class="content">
        @if (error) { <div class="alert">{{ error }}</div> }
        @if (loading) {
          <div class="state">Loading audit history…</div>
        } @else if (!entries.length) {
          <div class="state empty">No audit events were found on this page.</div>
        } @else {
          <div class="log-list">
            @for (entry of entries; track entry.id) {
              <article class="log-row">
                <div class="timeline"><span></span></div>
                <div class="event">
                  <div class="event-top">
                    <strong>{{ entry.action }}</strong>
                    <time>{{ entry.timestampUtc | date:'medium' }}</time>
                  </div>
                  <p>{{ entry.entityName }}{{ entry.entityId ? ' · ' + entry.entityId : '' }}</p>
                  <div class="meta">
                    <span>Actor: {{ entry.userEmail || entry.userId || 'System' }}</span>
                    @if (entry.reason) { <span>Details: {{ entry.reason }}</span> }
                    @if (entry.ipAddress) { <span>IP: {{ entry.ipAddress }}</span> }
                  </div>
                </div>
              </article>
            }
          </div>
          <div class="pagination">
            <button [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
            <span>Page {{ page }} · {{ entries.length }} events</span>
            <button [disabled]="entries.length < pageSize" (click)="changePage(1)">Next</button>
          </div>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100%; color:#172033; }
    .page { min-height:100%; background:var(--bg-page, #f5f7fb); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:1.5rem 2rem; background:white; border-bottom:1px solid #e5e9f0; }
    h1 { margin:0; font-size:1.45rem; letter-spacing:-.03em; }
    .page-header p { margin:.35rem 0 0; color:#697586; font-size:.9rem; }
    .page-header button, .pagination button { border:1px solid #d9e0e9; background:white; color:#344054; padding:.55rem .75rem; border-radius:8px; font-weight:700; cursor:pointer; }
    .content { padding:1.5rem 2rem 2rem; }
    .log-list { padding:1.2rem 1.4rem; background:white; border:1px solid #e5e9f0; border-radius:14px; }
    .log-row { display:flex; min-height:95px; }
    .timeline { width:28px; position:relative; flex:none; }
    .timeline::after { content:""; position:absolute; width:1px; top:12px; bottom:0; left:7px; background:#e1e7ef; }
    .log-row:last-child .timeline::after { display:none; }
    .timeline span { position:absolute; top:5px; left:2px; z-index:1; width:11px; height:11px; border:2px solid #258168; border-radius:50%; background:white; }
    .event { flex:1; padding:0 0 1.2rem .3rem; }
    .event-top { display:flex; justify-content:space-between; gap:1rem; }
    .event-top strong { color:#263247; font-size:.9rem; }
    time, .meta { color:#7a8495; font-size:.76rem; }
    .event p { margin:.3rem 0 .45rem; color:#546176; font-size:.82rem; }
    .meta { display:flex; flex-wrap:wrap; gap:.35rem 1rem; }
    .state { padding:3rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin-bottom:1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    .pagination button:disabled { opacity:.45; cursor:not-allowed; }
    @media(max-width:760px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } .event-top { flex-direction:column; gap:.2rem; } }
  `]
})
export class AuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  entries: AuditLogEntry[] = [];
  loading = true;
  error = '';
  page = 1;
  readonly pageSize = 50;

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getAuditLogs(this.page, this.pageSize).subscribe({
      next: result => {
        this.loading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load the audit history.';
          return;
        }
        this.entries = result.data;
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load the audit history.';
        this.changeDetector.markForCheck();
      }
    });
  }

  changePage(delta: number): void {
    this.page += delta;
    this.load();
  }
}
