import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser, ListingFeePayment } from '../../../core/models/admin.model';
import { PaymentStatus, PaymentTransaction } from '../../../core/models/subscription.model';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Payment transactions</h1>
          <p>Review renter subscription payments and landlord listing-fee payments.</p>
        </div>
        <div class="filters">
          <input [(ngModel)]="search" (ngModelChange)="filterRows()" placeholder="Search email, provider, or reference" aria-label="Search transactions" />
          <select [(ngModel)]="statusFilter" (change)="filterRows()" aria-label="Filter payment status">
            <option value="all">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </header>
      <section class="content">
        @if (error) { <div class="alert">{{ error }}</div> }
        @if (loading) {
          <div class="state">Loading payment transactions…</div>
        } @else if (!filteredTransactions.length) {
          <div class="state empty">No transactions match this page and filter.</div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Plan</th><th>Provider</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
              <tbody>
                @for (transaction of filteredTransactions; track transaction.id) {
                  <tr>
                    <td>{{ transaction.userEmail }}</td>
                    <td>{{ transaction.planName }}</td>
                    <td>{{ transaction.provider || '—' }}</td>
                    <td>{{ transaction.amountETB | number:'1.2-2' }} ETB</td>
                    <td><span class="status" [attr.data-status]="statusKey(transaction.status)">{{ statusName(transaction.status) }}</span></td>
                    <td>{{ transaction.createdAtUtc | date:'short' }}</td>
                    <td>
                      <button class="view-details" type="button" (click)="viewDetails(transaction)">
                        View details
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
            <span>Page {{ page }} · {{ transactions.length }} transactions loaded</span>
            <button [disabled]="transactions.length < pageSize" (click)="changePage(1)">Next</button>
          </div>
        }
      </section>
      <section class="content listing-fee-section" aria-labelledby="listing-fee-title">
        <header class="section-header">
          <div>
            <h2 id="listing-fee-title">Landlord listing-fee payments</h2>
            <p>Payment details for properties submitted by landlords. Only verified fees count as paid revenue.</p>
          </div>
        </header>
        @if (listingFeeError) { <div class="alert" role="alert">{{ listingFeeError }}</div> }
        @if (listingFeeLoading) {
          <div class="state">Loading landlord listing-fee payments…</div>
        } @else if (!filteredListingFeePayments.length) {
          <div class="state empty">No landlord listing-fee payments match this page and filter.</div>
        } @else {
          <div class="table-wrap">
            <table class="listing-fee-table">
              <thead>
                <tr>
                  <th>Landlord</th><th>Property</th><th>Provider</th><th>Amount</th>
                  <th>Status</th><th>Submitted</th><th>Reviewed</th><th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of filteredListingFeePayments; track payment.propertyId) {
                  <tr>
                    <td>
                      <strong>{{ payment.landlordFullName || 'Landlord' }}</strong>
                      <span class="muted">{{ payment.landlordEmail }}</span>
                    </td>
                    <td>
                      <strong>
                        <a class="property-link" [routerLink]="['/properties', payment.propertyId]">
                          {{ payment.propertyTitle }}
                        </a>
                      </strong>
                      <span class="muted">{{ payment.neighborhood }}, {{ payment.subCity }}, {{ payment.city }}</span>
                    </td>
                    <td>{{ payment.provider || '—' }}</td>
                    <td>{{ payment.amountETB | number:'1.2-2' }} ETB</td>
                    <td><span class="status" [attr.data-status]="payment.status.toLowerCase()">{{ payment.status }}</span></td>
                    <td>{{ payment.createdAtUtc | date:'short' }}</td>
                    <td>{{ payment.verifiedAtUtc ? (payment.verifiedAtUtc | date:'short') : '—' }}</td>
                    <td>
                      @if (getListingFeeEvidenceUrl(payment); as evidenceUrl) {
                        <a class="view-details" [href]="evidenceUrl" target="_blank" rel="noopener noreferrer">Open evidence</a>
                      } @else {
                        <span class="muted">Unavailable</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button [disabled]="listingFeePage <= 1" (click)="changeListingFeePage(-1)">Previous</button>
            <span>Page {{ listingFeePage }} · {{ listingFeeTotalCount }} listing-fee payments</span>
            <button [disabled]="listingFeePayments.length < pageSize" (click)="changeListingFeePage(1)">Next</button>
          </div>
        }
      </section>
      @if (selectedTransaction; as transaction) {
        <div class="evidence-backdrop" role="presentation" (click)="closeDetails()">
          <section
            class="details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            (click)="$event.stopPropagation()"
          >
            <header class="details-header">
              <div>
                <span class="details-eyebrow">PAYMENT REVIEW</span>
                <h2 id="details-title">Transaction details</h2>
                <p>{{ transaction.id }}</p>
              </div>
              <button type="button" class="evidence-close" aria-label="Close transaction details" (click)="closeDetails()">×</button>
            </header>
            <div class="details-content">
              <section class="details-section">
                <h3>Payer information</h3>
                @if (payerLoading) {
                  <p class="evidence-instructions" role="status">Loading payer profile from User Management…</p>
                } @else if (payerError) {
                  <p class="no-evidence" role="alert">{{ payerError }}</p>
                  <button type="button" class="view-details" (click)="loadPayerInformation(transaction.userId)">Retry</button>
                } @else if (payerUser) {
                  <dl class="details-grid">
                    <div><dt>Full name</dt><dd>{{ payerUser.fullName || 'Not provided' }}</dd></div>
                    <div><dt>Email</dt><dd>{{ payerUser.email || 'Not provided' }}</dd></div>
                    <div><dt>Phone</dt><dd>{{ payerUser.phoneNumber || 'Not provided' }}</dd></div>
                    <div><dt>Roles</dt><dd>{{ payerUser.roles.join(', ') || 'Not provided' }}</dd></div>
                    <div><dt>Account status</dt><dd>{{ payerUser.isRestricted ? 'Restricted' : payerUser.isActive ? 'Active' : 'Inactive' }}</dd></div>
                    <div><dt>Email confirmed</dt><dd>{{ payerUser.emailConfirmed ? 'Yes' : 'No' }}</dd></div>
                    <div><dt>Phone confirmed</dt><dd>{{ payerUser.phoneNumberConfirmed ? 'Yes' : 'No' }}</dd></div>
                    <div><dt>Account created</dt><dd>{{ payerUser.createdAtUtc | date:'medium' }}</dd></div>
                    <div class="detail-wide"><dt>Payer account ID</dt><dd class="breakable">{{ payerUser.id }}</dd></div>
                  </dl>
                }
              </section>

              <section class="details-section">
                <h3>Payment information</h3>
                <dl class="details-grid">
                  <div><dt>Plan</dt><dd>{{ transaction.planName }}</dd></div>
                  <div><dt>Plan ID</dt><dd class="breakable">{{ transaction.planId }}</dd></div>
                  <div><dt>Amount</dt><dd>{{ transaction.amountETB | number:'1.2-2' }} ETB</dd></div>
                  <div><dt>Payment method</dt><dd>{{ transaction.provider || 'Not provided' }}</dd></div>
                  <div><dt>Payment reference</dt><dd class="breakable">{{ transaction.externalReference || 'Not provided' }}</dd></div>
                  <div><dt>Status</dt><dd><span class="status" [attr.data-status]="statusKey(transaction.status)">{{ statusName(transaction.status) }}</span></dd></div>
                  <div><dt>Submitted</dt><dd>{{ transaction.createdAtUtc | date:'medium' }}</dd></div>
                  @if (transaction.verifiedAtUtc) {
                    <div><dt>Reviewed</dt><dd>{{ transaction.verifiedAtUtc | date:'medium' }}</dd></div>
                  }
                  @if (transaction.failureReason) {
                    <div class="detail-wide"><dt>Rejection reason</dt><dd>{{ transaction.failureReason }}</dd></div>
                  }
                </dl>
              </section>

              <section class="details-section">
                <h3>Transaction evidence</h3>
                @if (error) {
                  <p class="no-evidence" role="alert">{{ error }}</p>
                }
                @if (getTransactionUrl(transaction); as transactionUrl) {
                  <p class="evidence-instructions">This is the same HTTPS URL submitted as the payment reference. Open it to verify the transaction.</p>
                  <a
                    class="transaction-url"
                    [href]="transactionUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    (click)="markTransactionUrlOpened(transaction)"
                  >
                    <span class="material-icons-outlined" aria-hidden="true">open_in_new</span>
                    Open transaction evidence
                  </a>
                } @else {
                  <p class="no-evidence">No valid HTTPS transaction URL is available. You can still decide after verifying payment through another source.</p>
                }
                @if (reviewedTransactionUrls.has(transaction.id)) {
                  <p class="reviewed-note" role="status">Transaction URL opened. Review it before deciding.</p>
                }
              </section>
            </div>
            <footer class="details-footer">
              <button type="button" class="secondary-action" (click)="closeDetails()">Close</button>
              @if (isPending(transaction.status)) {
                <div class="decision-actions">
                  <button
                    type="button"
                    class="reject"
                    [disabled]="verifying"
                    (click)="verify(transaction, false)"
                  >
                    Reject payment
                  </button>
                  <button
                    type="button"
                    class="approve"
                    [disabled]="verifying"
                    (click)="verify(transaction, true)"
                  >
                    Approve payment
                  </button>
                </div>
              }
            </footer>
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
    .filters { display:flex; flex-wrap:wrap; gap:.6rem; }
    input, select { padding:.65rem .75rem; border:1px solid #d9e0e9; border-radius:9px; background:white; color:#253047; }
    input { width:min(330px, 60vw); }
    .content { padding:1.5rem 2rem; }
    .listing-fee-section { padding-top:0; }
    .section-header { margin:0 0 1rem; }
    .section-header h2 { margin:0; font-size:1.05rem; }
    .section-header p { margin:.3rem 0 0; color:#697586; font-size:.82rem; }
    .table-wrap { overflow:auto; background:white; border:1px solid #e5e9f0; border-radius:13px; }
    table { width:100%; border-collapse:collapse; min-width:1120px; }
    th, td { padding:.85rem .9rem; text-align:left; border-bottom:1px solid #edf0f4; font-size:.82rem; }
    th { color:#647085; background:#f8fafc; font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; }
    tr:last-child td { border-bottom:0; }
    .status { display:inline-block; padding:.28rem .55rem; border-radius:99px; background:#edf1f6; color:#526073; font-size:.72rem; font-weight:800; }
    .status[data-status="pending"] { background:#fff4d9; color:#875900; }
    .status[data-status="completed"] { background:#e3f6ea; color:#226c40; }
    .status[data-status="verified"] { background:#e3f6ea; color:#226c40; }
    .status[data-status="failed"] { background:#fff0ef; color:#a03c36; }
    .status[data-status="rejected"] { background:#fff0ef; color:#a03c36; }
    button { border:1px solid #d9e0e9; background:white; color:#344054; padding:.45rem .6rem; border-radius:7px; font-size:.75rem; font-weight:700; cursor:pointer; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    button.approve { background:#217c64; border-color:#217c64; color:white; }
    button.reject { color:#a13f45; }
    button.view-details { border-color:#b9daca; background:#eff8f2; color:#176b4d; white-space:nowrap; }
    button.view-details:hover { border-color:#80bd9d; background:#e4f3e9; }
    .muted { color:#758094; font-size:.75rem; }
    td strong, td .muted { display:block; }
    a.property-link { color:#176b4d; text-decoration:none; }
    a.property-link:hover { text-decoration:underline; }
    a.property-link:focus-visible { border-radius:3px; outline:2px solid #176b4d; outline-offset:2px; }
    td.breakable { overflow-wrap:anywhere; }
    a.view-details { display:inline-block; text-decoration:none; }
    .state { padding:3rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin-bottom:1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    .evidence-backdrop { position:fixed; z-index:4000; inset:0; display:grid; place-items:center; padding:1.5rem; background:rgba(15,23,42,.62); }
    .details-dialog { display:flex; flex-direction:column; width:min(760px,100%); max-height:calc(100vh - 3rem); overflow:hidden; border:1px solid #e5e9f0; border-radius:16px; background:white; box-shadow:0 24px 70px rgba(0,0,0,.25); }
    .details-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid #edf0f4; }
    .details-eyebrow { color:#217c64; font-size:.66rem; font-weight:800; letter-spacing:.1em; }
    .details-header h2 { margin:.25rem 0 0; font-size:1.1rem; }
    .details-header p { margin:.3rem 0 0; color:#697586; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.7rem; overflow-wrap:anywhere; }
    .evidence-close { width:36px; height:36px; padding:0; font-size:1.25rem; flex:0 0 auto; }
    .details-content { display:grid; gap:1rem; padding:1.15rem 1.25rem; overflow:auto; }
    .details-section { padding:1rem; border:1px solid #e8edf1; border-radius:11px; background:#fff; }
    .details-section h3 { margin:0 0 .75rem; color:#26364a; font-size:.86rem; }
    .details-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem 1rem; margin:0; }
    .details-grid > div { min-width:0; }
    .details-grid dt { margin-bottom:.2rem; color:#758094; font-size:.68rem; font-weight:650; }
    .details-grid dd { margin:0; color:#253047; font-size:.8rem; font-weight:600; overflow-wrap:anywhere; }
    .details-grid .detail-wide { grid-column:1 / -1; }
    .details-grid .breakable { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.7rem; }
    .evidence-instructions, .no-evidence, .reviewed-note { margin:0 0 .75rem; color:#697586; font-size:.76rem; line-height:1.5; }
    .no-evidence { color:#a13f45; }
    a.transaction-url { display:inline-flex; align-items:center; justify-content:center; gap:.45rem; min-height:38px; margin:.1rem .45rem .1rem 0; padding:.5rem .75rem; border:1px solid #b9daca; border-radius:8px; background:#eff8f2; color:#176b4d; font-size:.76rem; font-weight:750; text-decoration:none; }
    a.transaction-url:hover { border-color:#80bd9d; background:#e4f3e9; }
    a.transaction-url .material-icons-outlined { font-size:1rem; }
    .reviewed-note { margin:.65rem 0 0; color:#236d47; }
    .details-footer { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.9rem 1.25rem; border-top:1px solid #edf0f4; background:#fafbfd; }
    .decision-actions { display:flex; justify-content:flex-end; gap:.55rem; }
    .details-footer .approve, .details-footer .reject, .details-footer .secondary-action { min-height:38px; padding:.55rem .8rem; }
    .details-footer .reject { border-color:#efd3d2; background:#fff8f7; }
    .secondary-action { background:white; }
    @media(max-width:760px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } }
    @media(max-width:520px) { .evidence-backdrop { padding:.5rem; } .details-dialog { max-height:calc(100vh - 1rem); } .details-grid { grid-template-columns:1fr; } .details-grid .detail-wide { grid-column:auto; } .details-footer { align-items:stretch; flex-direction:column-reverse; } .decision-actions { display:grid; grid-template-columns:1fr 1fr; } .details-footer .secondary-action { width:100%; } }
  `]
})
export class PaymentsComponent implements OnInit {
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  transactions: PaymentTransaction[] = [];
  filteredTransactions: PaymentTransaction[] = [];
  listingFeePayments: ListingFeePayment[] = [];
  filteredListingFeePayments: ListingFeePayment[] = [];
  listingFeeTotalCount = 0;
  listingFeePage = 1;
  loading = true;
  listingFeeLoading = true;
  error = '';
  listingFeeError = '';
  search = '';
  statusFilter = 'all';
  page = 1;
  readonly pageSize = 25;
  selectedTransaction: PaymentTransaction | null = null;
  payerUser: AdminUser | null = null;
  payerLoading = false;
  payerError = '';
  verifying = false;
  readonly reviewedTransactionUrls = new Set<string>();

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
    this.adminService.getPayments(this.page, this.pageSize).subscribe({
      next: result => {
        this.loading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load payment transactions.';
          return;
        }
        this.transactions = result.data;
        this.filterRows();
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load payment transactions.';
        this.changeDetector.markForCheck();
      }
    });

    this.listingFeeLoading = true;
    this.listingFeeError = '';
    this.adminService.getListingFeePayments(this.listingFeePage, this.pageSize).subscribe({
      next: result => {
        this.listingFeeLoading = false;
        if (!result.succeeded || !result.data) {
          this.listingFeeError = result.errors?.[0] || 'Unable to load landlord listing-fee payments.';
          this.changeDetector.markForCheck();
          return;
        }
        this.listingFeePayments = result.data.items;
        this.listingFeeTotalCount = result.data.totalCount;
        this.filterRows();
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.listingFeeLoading = false;
        this.listingFeeError = err.error?.errors?.[0] || 'Unable to load landlord listing-fee payments.';
        this.changeDetector.markForCheck();
      }
    });
  }

  filterRows(): void {
    const query = this.search.trim().toLowerCase();
    this.filteredTransactions = this.transactions.filter(transaction => {
      const matchesSearch = !query || [
        transaction.userEmail,
        transaction.userFullName,
        transaction.userPhoneNumber,
        transaction.userId,
        transaction.provider,
        transaction.externalReference,
        transaction.planName
      ].some(value => value?.toLowerCase().includes(query));
      return matchesSearch && (
        this.statusFilter === 'all' ||
        this.statusMatches(this.statusKey(transaction.status), this.statusFilter)
      );
    });
    this.filteredListingFeePayments = this.listingFeePayments.filter(payment => {
      const matchesSearch = !query || [
        payment.landlordEmail,
        payment.landlordFullName,
        payment.landlordId,
        payment.provider,
        payment.reference,
        payment.propertyTitle,
        payment.city,
        payment.subCity,
        payment.neighborhood
      ].some(value => value?.toLowerCase().includes(query));
      return matchesSearch && (
        this.statusFilter === 'all' ||
        this.statusMatches(payment.status.toLowerCase(), this.statusFilter)
      );
    });
  }

  private statusMatches(status: string, filter: string): boolean {
    if (filter.toLowerCase() === 'paid') {
      return status === 'completed' || status === 'verified';
    }
    return status === filter.toLowerCase();
  }

  statusKey(status: PaymentStatus | number): string {
    if (typeof status === 'number') {
      return ['pending', 'completed', 'failed', 'refunded', 'cancelled'][status] ?? 'unknown';
    }
    return String(status).toLowerCase();
  }

  statusName(status: PaymentStatus | number): string {
    if (typeof status === 'number') {
      return ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'][status] ?? 'Unknown';
    }
    return String(status);
  }

  isPending(status: PaymentStatus | number): boolean {
    return this.statusKey(status) === 'pending';
  }

  viewDetails(transaction: PaymentTransaction): void {
    this.error = '';
    this.selectedTransaction = transaction;
    this.loadPayerInformation(transaction.userId);
  }

  loadPayerInformation(userId: string): void {
    this.payerUser = null;
    this.payerError = '';
    this.payerLoading = true;
    this.adminService.getUser(userId).subscribe({
      next: result => {
        if (this.selectedTransaction?.userId !== userId) return;
        this.payerLoading = false;
        if (!result.succeeded || !result.data) {
          this.payerError = result.errors?.[0] || 'Unable to load payer information from User Management.';
          return;
        }
        this.payerUser = result.data;
      },
      error: err => {
        if (this.selectedTransaction?.userId !== userId) return;
        this.payerLoading = false;
        this.payerError = err.error?.errors?.[0] || err.error?.error || 'Unable to load payer information from User Management.';
      }
    });
  }

  closeDetails(): void {
    if (!this.verifying) {
      this.selectedTransaction = null;
      this.payerUser = null;
      this.payerLoading = false;
      this.payerError = '';
    }
  }

  @HostListener('document:keydown.escape')
  closeDetailsOnEscape(): void {
    this.closeDetails();
  }

  getTransactionUrl(transaction: PaymentTransaction): string | null {
    const reference = transaction.externalReference?.trim();
    if (!reference) return null;

    try {
      const url = new URL(reference);
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
        ? reference
        : null;
    } catch {
      return null;
    }
  }

  verify(transaction: PaymentTransaction, approved: boolean): void {
    if (this.verifying) return;

    const enteredNote = window.prompt(
      approved ? 'Verification note (optional):' : 'Reason for rejecting this payment (required):',
    );
    if (enteredNote === null && !approved) return;
    const note = enteredNote || '';
    if (!approved && !note.trim()) {
      this.error = 'Enter a reason to reject this payment.';
      return;
    }

    if (approved) {
      const evidenceStatus = this.getTransactionUrl(transaction)
        ? this.reviewedTransactionUrls.has(transaction.id)
          ? `Reference: "${transaction.externalReference}".`
          : 'The transaction URL has not been opened in this review.'
        : 'No valid transaction URL was provided.';
      const payer = transaction.userEmail || transaction.userId;
      const confirmation = `Confirm that you independently verified this payment of ${transaction.amountETB} ETB for ${payer}. ${evidenceStatus} Approve Premium access?`;
      if (!window.confirm(confirmation)) return;
    }

    this.verifying = true;
    this.error = '';
    this.adminService.verifyPayment({ transactionId: transaction.id, approved, note: note.trim() }).subscribe({
      next: result => {
        this.verifying = false;
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Could not update this payment.';
          return;
        }
        this.selectedTransaction = null;
        this.load();
      },
      error: err => {
        this.verifying = false;
        this.error = err.error?.errors?.[0] || 'Could not update this payment.';
      }
    });
  }

  markTransactionUrlOpened(transaction: PaymentTransaction): void {
    if (this.getTransactionUrl(transaction)) {
      this.reviewedTransactionUrls.add(transaction.id);
    }
  }

  changePage(delta: number): void {
    this.page += delta;
    this.load();
  }

  changeListingFeePage(delta: number): void {
    this.listingFeePage += delta;
    this.load();
  }

  getListingFeeEvidenceUrl(payment: ListingFeePayment): string | null {
    const reference = payment.transactionUrl?.trim();
    if (!reference) return null;

    try {
      const url = new URL(reference);
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
        ? reference
        : null;
    } catch {
      return null;
    }
  }
}
