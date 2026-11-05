import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.model';
import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';
import { enumValueFromApi } from '../../../core/models/api-enum.util';
import {
  SupportTicket,
  SupportTicketMessage,
  TicketCategory,
  TicketCategoryValue,
  TicketPriority,
  TicketPriorityValue,
  TicketStatus,
  TicketStatusValue
} from '../../../core/models/support.model';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Support cases</h1>
          <p>Assign, investigate, and respond to user complaints and support tickets.</p>
        </div>
        <select [(ngModel)]="statusFilter" (change)="load()" aria-label="Filter support tickets">
          <option value="all">All statuses</option>
          <option [ngValue]="TicketStatus.Open">Open</option>
          <option [ngValue]="TicketStatus.InProgress">In progress</option>
          <option [ngValue]="TicketStatus.WaitingForUser">Waiting for user</option>
          <option [ngValue]="TicketStatus.Escalated">Escalated</option>
          <option [ngValue]="TicketStatus.Resolved">Resolved</option>
        </select>
      </header>
      <section class="content">
        @if (error) { <div class="alert" role="alert">{{ error }}</div> }
        @if (loading) {
          <div class="state">Loading support cases…</div>
        } @else if (!tickets.length) {
          <div class="state empty">No support cases match this filter.</div>
        } @else {
          <div class="ticket-grid">
            @for (ticket of tickets; track ticket.id) {
              <article class="ticket">
                <div class="ticket-top">
                  <span class="reference">{{ ticket.ticketReference }}</span>
                  <span class="priority" [attr.data-priority]="enumValue(TicketPriority, ticket.priority)">{{ priorityName(ticket.priority) }}</span>
                </div>
                <h2>{{ ticket.subject }}</h2>
                <p class="user">{{ ticket.userName }} · {{ ticket.userEmail }}</p>
                <p class="preview">{{ ticket.lastMessagePreview || 'No message preview available.' }}</p>
                <div class="meta">
                  <span>{{ categoryName(ticket.category) }}</span>
                  <span>{{ statusName(ticket.status) }}</span>
                  <span>{{ ticket.createdAtUtc | date:'mediumDate' }}</span>
                </div>
                @if (authService.hasRole('Admin')) {
                  <label class="assign">
                    Assigned agent
                    <select [ngModel]="ticket.assignedAgentId || ''" (ngModelChange)="assign(ticket, $event)">
                      <option value="" disabled>{{ ticket.assignedAgentId ? 'Select an agent' : 'Unassigned — choose an agent' }}</option>
                      @for (member of staff; track member.id) { <option [value]="member.id">{{ member.fullName }}</option> }
                    </select>
                  </label>
                }
                <div class="ticket-actions">
                  <button (click)="openTicket(ticket)">Open case</button>
                  @if (enumValue(TicketStatus, ticket.status) !== TicketStatus.Resolved) {
                    <button class="resolve" (click)="update(ticket, { status: TicketStatus.Resolved })">Resolve</button>
                  }
                </div>
              </article>
            }
          </div>
          <div class="pagination">
            <button [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
            <span>Page {{ page }} · {{ tickets.length }} cases</span>
            <button [disabled]="tickets.length < pageSize" (click)="changePage(1)">Next</button>
          </div>
        }
      </section>

      @if (selectedTicket) {
        <div class="backdrop" (click)="closeTicket()">
          <section class="case-modal" role="dialog" aria-modal="true" [attr.aria-label]="'Support case ' + selectedTicket.ticketReference" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <div><span class="reference">{{ selectedTicket.ticketReference }}</span><h2>{{ selectedTicket.subject }}</h2></div>
              <button class="close" (click)="closeTicket()" aria-label="Close case">×</button>
            </header>
            @if (modalLoading) {
              <div class="state">Loading conversation…</div>
            } @else {
              <div class="conversation">
                @for (message of messages; track message.id) {
                  <article class="message" [class.internal]="message.isInternalNote">
                    <div class="message-heading"><strong>{{ message.senderName }}</strong><span>{{ message.sentAtUtc | date:'short' }}</span></div>
                    <p>{{ message.messageText }}</p>
                    @if (message.isInternalNote) { <small>Internal note — not visible to the user</small> }
                  </article>
                }
                @if (!messages.length) { <p class="state">There are no messages on this case.</p> }
              </div>
              <div class="case-fields">
                <label>Status
                  <select [ngModel]="enumValue(TicketStatus, selectedTicket.status)" (ngModelChange)="update(selectedTicket!, { status: $event })">
                    <option [ngValue]="TicketStatus.Open">Open</option>
                    <option [ngValue]="TicketStatus.InProgress">In progress</option>
                    <option [ngValue]="TicketStatus.WaitingForUser">Waiting for user</option>
                    <option [ngValue]="TicketStatus.Escalated">Escalated</option>
                    <option [ngValue]="TicketStatus.Resolved">Resolved</option>
                  </select>
                </label>
                <label>Priority
                  <select [ngModel]="enumValue(TicketPriority, selectedTicket.priority)" (ngModelChange)="update(selectedTicket!, { priority: $event })">
                    <option [ngValue]="TicketPriority.Low">Low</option>
                    <option [ngValue]="TicketPriority.Medium">Medium</option>
                    <option [ngValue]="TicketPriority.High">High</option>
                    <option [ngValue]="TicketPriority.Urgent">Urgent</option>
                  </select>
                </label>
              </div>
              <div class="reply">
                <textarea [(ngModel)]="replyText" rows="3" placeholder="Write a reply or internal note"></textarea>
                <label class="internal-toggle"><input type="checkbox" [(ngModel)]="internalNote" /> Internal note</label>
                <button [disabled]="!replyText.trim() || sending" (click)="sendReply()">
                  {{ sending ? 'Sending…' : internalNote ? 'Add internal note' : 'Send reply' }}
                </button>
              </div>
            }
          </section>
        </div>
      }
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100%; color:#172033; }
    .page { min-height:100%; background:var(--bg-page, #f5f7fb); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:1.5rem 2rem; background:white; border-bottom:1px solid #e5e9f0; }
    h1 { margin:0; font-size:1.45rem; letter-spacing:-.03em; }
    .page-header p { margin:.35rem 0 0; color:#697586; font-size:.9rem; }
    select, textarea { padding:.6rem .7rem; border:1px solid #d9e0e9; border-radius:8px; background:white; color:#253047; }
    .content { padding:1.5rem 2rem 2rem; }
    .ticket-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:.9rem; }
    .ticket { padding:1rem; background:white; border:1px solid #e5e9f0; border-radius:13px; box-shadow:0 4px 18px #15243b08; }
    .ticket-top, .meta, .ticket-actions, .message-heading { display:flex; justify-content:space-between; align-items:center; gap:.6rem; }
    .reference { color:#217c64; font-size:.75rem; font-weight:800; letter-spacing:.04em; }
    .priority { padding:.25rem .5rem; border-radius:99px; background:#edf1f6; color:#526073; font-size:.68rem; font-weight:800; }
    .priority[data-priority="2"], .priority[data-priority="3"] { background:#fff0ef; color:#a03c36; }
    h2 { margin:.55rem 0 .2rem; font-size:1rem; }
    .user { margin:0; color:#778195; font-size:.75rem; }
    .preview { min-height:2.4em; color:#536075; font-size:.82rem; line-height:1.45; }
    .meta { justify-content:flex-start; flex-wrap:wrap; color:#768195; font-size:.72rem; }
    .assign { display:grid; gap:.3rem; margin-top:.8rem; color:#697586; font-size:.72rem; font-weight:700; }
    .assign select { padding:.45rem; }
    .ticket-actions { justify-content:flex-start; margin-top:.8rem; }
    button { border:1px solid #d9e0e9; background:white; color:#344054; padding:.5rem .7rem; border-radius:8px; font-size:.77rem; font-weight:700; cursor:pointer; }
    button.resolve, .reply button { color:white; border-color:#217c64; background:#217c64; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .state { padding:2.5rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin-bottom:1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    .backdrop { position:fixed; inset:0; z-index:200; display:grid; place-items:center; padding:1rem; background:#0f172a99; }
    .case-modal { display:flex; flex-direction:column; width:min(760px,100%); max-height:90vh; background:white; border-radius:16px; box-shadow:0 24px 80px #0004; overflow:hidden; }
    .modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:1rem 1.25rem; border-bottom:1px solid #edf0f4; }
    .modal-header h2 { margin:.3rem 0 0; font-size:1.15rem; }
    .close { font-size:1.4rem; padding:.2rem .6rem; }
    .conversation { flex:1; overflow:auto; padding:1rem 1.25rem; background:#f8fafc; }
    .message { margin-bottom:.7rem; padding:.75rem; background:white; border:1px solid #e7ebf1; border-radius:10px; }
    .message.internal { border-color:#e9d5a5; background:#fffaf0; }
    .message-heading { color:#687488; font-size:.73rem; }
    .message p { margin:.45rem 0 0; white-space:pre-wrap; line-height:1.45; font-size:.85rem; }
    .message small { display:block; margin-top:.4rem; color:#946200; font-size:.7rem; }
    .case-fields { display:flex; gap:.8rem; padding:.75rem 1.25rem; border-top:1px solid #edf0f4; }
    .case-fields label { display:grid; gap:.25rem; flex:1; color:#667184; font-size:.72rem; font-weight:700; }
    .reply { padding:.8rem 1.25rem 1rem; border-top:1px solid #edf0f4; }
    .reply textarea { width:100%; box-sizing:border-box; resize:vertical; }
    .internal-toggle { display:inline-flex; gap:.35rem; align-items:center; margin:.5rem 1rem 0 0; color:#697586; font-size:.75rem; }
    .internal-toggle input { accent-color:#217c64; }
    @media(max-width:760px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } .case-fields { flex-direction:column; } }
  `]
})
export class SupportComponent implements OnInit {
  private supportService = inject(SupportService);
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  readonly TicketStatus = TicketStatus;
  readonly TicketPriority = TicketPriority;
  tickets: SupportTicket[] = [];
  staff: AdminUser[] = [];
  messages: SupportTicketMessage[] = [];
  selectedTicket: SupportTicket | null = null;
  statusFilter: TicketStatus | 'all' = 'all';
  loading = true;
  modalLoading = false;
  sending = false;
  internalNote = false;
  replyText = '';
  error = '';
  page = 1;
  readonly pageSize = 25;

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.load();
        if (this.authService.hasRole('Admin')) this.loadStaff();
      });
  }

  ngOnInit(): void {
    this.load();
    if (this.authService.hasRole('Admin')) this.loadStaff();
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

  load(): void {
    this.loading = true;
    this.error = '';
    this.supportService.getTickets(this.statusFilter === 'all' ? undefined : this.statusFilter, undefined, undefined, undefined, this.page, this.pageSize).subscribe({
      next: result => {
        this.loading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load support cases.';
          return;
        }
        this.tickets = result.data;
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load support cases.';
        this.changeDetector.markForCheck();
      }
    });
  }

  enumValue(definition: Readonly<Record<string, string | number>>, value: unknown): number | undefined {
    return enumValueFromApi(definition, value);
  }

  statusName(status: TicketStatusValue): string {
    const value = this.enumValue(TicketStatus, status);
    return value === undefined
      ? String(status)
      : ['Open', 'In progress', 'Waiting for user', 'Escalated', 'Resolved'][value] ?? String(status);
  }

  priorityName(priority: TicketPriorityValue): string {
    const value = this.enumValue(TicketPriority, priority);
    return value === undefined
      ? String(priority)
      : ['Low', 'Medium', 'High', 'Urgent'][value] ?? String(priority);
  }

  categoryName(category: TicketCategoryValue): string {
    const value = this.enumValue(TicketCategory, category);
    return value === 2
      ? 'Legacy category'
      : value === undefined
        ? String(category)
        : ['Account', 'Listing', 'Legacy category', 'Subscription billing', 'Technical', 'Safety & fraud', 'Payment', 'Inquiry & appointment', 'Privacy', 'Other'][value] ?? String(category);
  }

  changePage(delta: number): void {
    this.page += delta;
    this.load();
  }

  assign(ticket: SupportTicket, assignedAgentId: string): void {
    if (!assignedAgentId) return;
    this.update(ticket, { assignedAgentId });
  }

  update(ticket: SupportTicket, dto: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null }): void {
    this.supportService.updateTicket(ticket.id, dto).subscribe({
      next: result => {
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Could not update this support case.';
          return;
        }
        Object.assign(ticket, result.data);
        if (this.selectedTicket?.id === ticket.id) Object.assign(this.selectedTicket, result.data);
        this.load();
      },
      error: err => this.error = err.error?.errors?.[0] || 'Could not update this support case.'
    });
  }

  openTicket(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.modalLoading = true;
    this.messages = [];
    this.supportService.getTicketMessages(ticket.id).subscribe({
      next: result => {
        this.modalLoading = false;
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load the case conversation.';
          return;
        }
        this.messages = result.data;
      },
      error: err => {
        this.modalLoading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load the case conversation.';
      }
    });
  }

  closeTicket(): void {
    this.selectedTicket = null;
    this.messages = [];
    this.replyText = '';
    this.internalNote = false;
  }

  sendReply(): void {
    if (!this.selectedTicket || !this.replyText.trim()) return;
    this.sending = true;
    this.supportService.replyToTicket(this.selectedTicket.id, {
      message: this.replyText.trim(),
      isInternalNote: this.internalNote
    }).subscribe({
      next: result => {
        this.sending = false;
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to send this case response.';
          return;
        }
        this.messages = [...this.messages, result.data];
        this.replyText = '';
        this.internalNote = false;
        this.load();
      },
      error: err => {
        this.sending = false;
        this.error = err.error?.errors?.[0] || 'Unable to send this case response.';
      }
    });
  }
}
