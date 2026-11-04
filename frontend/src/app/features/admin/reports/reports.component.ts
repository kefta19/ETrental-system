import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.model';
import { ReportCategory, ReportStatus, UserReport } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Reports & investigations</h1>
          <p>Review user reports, suspicious activity, fraud, and duplicate listings.</p>
        </div>
        <div class="filters">
          <select aria-label="Filter reports by status" [(ngModel)]="statusFilter" (change)="loadReports()">
            <option [ngValue]="null">All statuses</option>
            <option [ngValue]="ReportStatus.Open">Open</option>
            <option [ngValue]="ReportStatus.UnderReview">Under review</option>
            <option [ngValue]="ReportStatus.ActionRequired">Action required</option>
            <option [ngValue]="ReportStatus.Resolved">Resolved</option>
            <option [ngValue]="ReportStatus.Dismissed">Dismissed</option>
          </select>
          <select aria-label="Filter reports by category" [(ngModel)]="categoryFilter" (change)="loadReports()">
            <option [ngValue]="null">All categories</option>
            @for (category of categories; track category.value) {
              <option [ngValue]="category.value">{{ category.label }}</option>
            }
          </select>
        </div>
      </header>

      <section class="content">
        @if (error) { <div class="alert">{{ error }}</div> }
        @if (isLoading) {
          <div class="state">Loading reports…</div>
        } @else if (!reports.length) {
          <div class="state empty">No reports match these filters.</div>
        } @else {
          <div class="report-list">
            @for (report of reports; track report.id) {
              <article class="report-card">
                <div class="report-heading">
                  <div>
                    <span class="category">{{ categoryLabel(report.category) }}</span>
                    <h2>{{ report.reason }}</h2>
                    <p class="subline">Submitted by {{ report.reporterName || 'Unknown user' }} · {{ report.createdAtUtc | date:'medium' }}</p>
                  </div>
                  <span class="status" [attr.data-status]="report.status">{{ statusLabel(report.status) }}</span>
                </div>
                <p class="description">{{ report.description }}</p>
                <div class="targets">
                  @if (report.reportedPropertyId) {
                    <a [href]="'/properties/' + report.reportedPropertyId" target="_blank" rel="noopener">
                      Listing: {{ report.reportedPropertyTitle || report.reportedPropertyId }}
                    </a>
                  }
                  @if (report.reportedUserName) { <span>Account: {{ report.reportedUserName }}</span> }
                  @if (report.assignedToName) { <span>Assigned to {{ report.assignedToName }}</span> }
                </div>
                <div class="actions">
                  <label>
                    Assign to support
                    <select [ngModel]="report.assignedToId || ''"
                      (ngModelChange)="assign(report, $event)"
                      [attr.aria-label]="'Assign report ' + report.id">
                      <option value="">Select staff member</option>
                      @for (member of staff; track member.id) {
                        <option [value]="member.id">{{ member.fullName }} ({{ member.email }})</option>
                      }
                    </select>
                  </label>
                  <div class="buttons">
                    <button (click)="setStatus(report, ReportStatus.UnderReview)">Investigate</button>
                    <button (click)="setStatus(report, ReportStatus.ActionRequired)">Action required</button>
                    <button class="primary" (click)="resolve(report)">Resolve</button>
                    <button class="quiet" (click)="dismiss(report)">Dismiss</button>
                  </div>
                </div>
                @if (report.resolutionNotes || report.actionTaken) {
                  <div class="resolution">
                    @if (report.actionTaken) { <span><strong>Action:</strong> {{ report.actionTaken }}</span> }
                    @if (report.resolutionNotes) { <span><strong>Notes:</strong> {{ report.resolutionNotes }}</span> }
                  </div>
                }
              </article>
            }
          </div>
          <div class="pagination">
            <button [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
            <span>Page {{ page }} · {{ totalCount }} reports</span>
            <button [disabled]="page * pageSize >= totalCount" (click)="changePage(1)">Next</button>
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
    .filters { display:flex; gap:.6rem; flex-wrap:wrap; }
    select { min-width:150px; padding:.65rem .75rem; border:1px solid #d9e0e9; border-radius:9px; background:white; color:#253047; }
    .content { padding:1.5rem 2rem 2.5rem; }
    .report-list { display:grid; gap:.9rem; }
    .report-card { padding:1.1rem 1.25rem; background:white; border:1px solid #e6eaf0; border-radius:14px; box-shadow:0 4px 18px #15243b08; }
    .report-heading { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
    h2 { margin:.3rem 0 0; font-size:1.02rem; }
    .category { color:#246b57; font-size:.72rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
    .subline { margin:.25rem 0 0; color:#7a8495; font-size:.79rem; }
    .status { padding:.35rem .65rem; border-radius:99px; background:#edf1f6; color:#526073; font-size:.75rem; font-weight:700; white-space:nowrap; }
    .status[data-status="0"] { background:#fff4d9; color:#8b5b00; }
    .status[data-status="1"], .status[data-status="2"] { background:#e8f1ff; color:#2457a5; }
    .status[data-status="3"] { background:#e4f6ec; color:#237044; }
    .description { color:#465267; line-height:1.5; margin:.8rem 0; white-space:pre-wrap; }
    .targets { display:flex; flex-wrap:wrap; gap:.6rem 1rem; color:#667184; font-size:.8rem; }
    .targets a { color:#2361a9; font-weight:600; }
    .actions { display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:.8rem; margin-top:1rem; padding-top:.85rem; border-top:1px solid #edf0f4; }
    .actions label { display:grid; gap:.35rem; color:#667184; font-size:.75rem; font-weight:700; }
    .actions select { min-width:220px; padding:.5rem .6rem; }
    .buttons { display:flex; flex-wrap:wrap; gap:.4rem; }
    button { border:1px solid #d9e0e9; background:white; color:#344054; padding:.5rem .7rem; border-radius:8px; font-size:.78rem; font-weight:700; cursor:pointer; }
    button:hover:not(:disabled) { border-color:#9ba8ba; background:#f8fafc; }
    button.primary { color:white; border-color:#217c64; background:#217c64; }
    button.quiet { color:#8a4750; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .resolution { display:flex; gap:1rem; flex-wrap:wrap; margin-top:.8rem; padding:.7rem; background:#f7f9fc; border-radius:8px; color:#667184; font-size:.8rem; }
    .state { padding:3rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin:0 0 1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    @media(max-width:760px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } .report-heading { flex-direction:column; } .actions { align-items:stretch; } }
  `]
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly ReportStatus = ReportStatus;
  readonly categories = [
    { value: ReportCategory.FakeListing, label: 'Fake listing' },
    { value: ReportCategory.MisleadingInformation, label: 'Misleading information' },
    { value: ReportCategory.DuplicateListing, label: 'Duplicate listing' },
    { value: ReportCategory.SuspiciousUser, label: 'Suspicious user' },
    { value: ReportCategory.IncorrectPrice, label: 'Incorrect price' },
    { value: ReportCategory.Harassment, label: 'Harassment' },
    { value: ReportCategory.UnauthorizedPhotos, label: 'Unauthorized photos' },
    { value: ReportCategory.Fraud, label: 'Fraud' },
    { value: ReportCategory.Other, label: 'Other' }
  ];
  reports: UserReport[] = [];
  staff: AdminUser[] = [];
  statusFilter: ReportStatus | null = null;
  categoryFilter: ReportCategory | null = null;
  isLoading = true;
  error = '';
  page = 1;
  readonly pageSize = 25;
  totalCount = 0;

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.loadReports();
        this.loadStaff();
      });
  }

  ngOnInit(): void {
    this.loadReports();
    this.loadStaff();
  }

  private loadStaff(): void {
    this.adminService.getUsers(undefined, 'Support', false, 1, 100).subscribe({
      next: result => {
        if (result.succeeded && result.data) this.staff = result.data.items;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.changeDetector.markForCheck();
      }
    });
  }

  loadReports(): void {
    this.isLoading = true;
    this.error = '';
    this.reportService.getAllReports(this.statusFilter ?? undefined, this.categoryFilter ?? undefined, this.page, this.pageSize).subscribe({
      next: result => {
        this.isLoading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load reports.';
          return;
        }
        this.reports = result.data.items;
        this.totalCount = result.data.totalCount;
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.isLoading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load reports. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  categoryLabel(category: ReportCategory): string {
    return this.categories.find(item => item.value === category)?.label ?? 'Other';
  }

  statusLabel(status: ReportStatus): string {
    return ['Open', 'Under review', 'Action required', 'Resolved', 'Dismissed'][status] ?? 'Unknown';
  }

  changePage(delta: number): void {
    this.page += delta;
    this.loadReports();
  }

  assign(report: UserReport, assignedToId: string): void {
    if (!assignedToId || assignedToId === report.assignedToId) return;
    this.reportService.updateReport(report.id, { assignedToId }).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Could not assign this report.';
          return;
        }
        this.loadReports();
      },
      error: err => this.error = err.error?.errors?.[0] || 'Could not assign this report.'
    });
  }

  setStatus(report: UserReport, status: ReportStatus): void {
    const notes = status === ReportStatus.ActionRequired ? window.prompt('Describe the action required:') : undefined;
    if (status === ReportStatus.ActionRequired && !notes?.trim()) return;
    this.reportService.updateReport(report.id, {
      status,
      ...(notes ? { resolutionNotes: notes.trim() } : {})
    }).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Could not update this report.';
          return;
        }
        this.loadReports();
      },
      error: err => this.error = err.error?.errors?.[0] || 'Could not update this report.'
    });
  }

  resolve(report: UserReport): void {
    const notes = window.prompt('Resolution notes (required):', report.resolutionNotes || '');
    if (!notes?.trim()) return;
    const action = window.prompt('Action taken (optional):', report.actionTaken || '') || '';
    this.reportService.updateReport(report.id, {
      status: ReportStatus.Resolved,
      resolutionNotes: notes.trim(),
      actionTaken: action.trim()
    }).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Could not resolve this report.';
          return;
        }
        this.loadReports();
      },
      error: err => this.error = err.error?.errors?.[0] || 'Could not resolve this report.'
    });
  }

  dismiss(report: UserReport): void {
    const notes = window.prompt('Reason for dismissing this report (required):');
    if (!notes?.trim()) return;
    this.reportService.updateReport(report.id, {
      status: ReportStatus.Dismissed,
      resolutionNotes: notes.trim()
    }).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Could not dismiss this report.';
          return;
        }
        this.loadReports();
      },
      error: err => this.error = err.error?.errors?.[0] || 'Could not dismiss this report.'
    });
  }
}
