import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { enumValueFromApi } from '../../../core/models/api-enum.util';
import { ListingFeeStatus, PropertySummary } from '../../../core/models/property.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-landlord-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  template: `
    <div class="payments-page container">
      <!-- Page Header -->
      <header class="page-header">
        <div>
          <span class="eyebrow">FINANCIALS & LISTING FEES</span>
          <h1>Entrance Fee Payments</h1>
          <p>Track, pay, and verify entrance fee payment amounts for each property listing.</p>
        </div>
        <a routerLink="/landlord/add-property" class="btn btn-primary">
          <span class="material-icons-outlined" aria-hidden="true">add</span> Add New Listing
        </a>
      </header>

      <!-- Success notification if redirected after adding a new listing -->
      @if (justAddedListing) {
        <div class="banner-success" role="status">
          <span class="material-icons-outlined banner-icon" aria-hidden="true">check_circle</span>
          <div class="banner-content">
            <strong>New property listing registered successfully!</strong>
            <p>Your listing requires a <strong>{{ feeRateETB | number }} ETB</strong> entrance fee. Check the payment status below; once verified by an administrator, your listing goes live.</p>
          </div>
          <button type="button" class="close-banner" (click)="justAddedListing = false" aria-label="Close">×</button>
        </div>
      }

      <!-- Top Financial Summary Cards -->
      <section class="stats-grid" aria-label="Payment overview">
        <div class="stat-card">
          <div class="stat-icon green">
            <span class="material-icons-outlined" aria-hidden="true">receipt_long</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ feeRateETB | number }} ETB</div>
            <div class="stat-label">Standard Entrance Fee per List</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon blue">
            <span class="material-icons-outlined" aria-hidden="true">verified</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalVerifiedFees | number }} ETB</div>
            <div class="stat-label">Total Verified Payments ({{ verifiedCount }} Listings)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">
            <span class="material-icons-outlined" aria-hidden="true">hourglass_top</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">Awaiting Admin Verification</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon red">
            <span class="material-icons-outlined" aria-hidden="true">error_outline</span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ unpaidCount }}</div>
            <div class="stat-label">Payment Required</div>
          </div>
        </div>
      </section>

      <!-- Main Payment Table Section -->
      <section class="payments-table-card">
        <div class="table-header-row">
          <div>
            <h2>Listings Payment Schedule</h2>
            <p>Individual entrance fee amounts and verification statuses</p>
          </div>
          <div class="filter-group">
            <button
              class="filter-pill"
              [class.active]="filterStatus === 'all'"
              (click)="setFilter('all')">
              All ({{ properties.length }})
            </button>
            <button
              class="filter-pill"
              [class.active]="filterStatus === 'paid'"
              (click)="setFilter('paid')">
              Verified ({{ verifiedCount }})
            </button>
            <button
              class="filter-pill"
              [class.active]="filterStatus === 'pending'"
              (click)="setFilter('pending')">
              Pending ({{ pendingCount }})
            </button>
            <button
              class="filter-pill"
              [class.active]="filterStatus === 'unpaid'"
              (click)="setFilter('unpaid')">
              Unpaid ({{ unpaidCount }})
            </button>
          </div>
        </div>

        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading listing payments...</p>
          </div>
        } @else if (loadError) {
          <div class="empty-state" role="alert">
            <h3>Listing payments could not be loaded</h3>
            <p>{{ loadError }}</p>
            <button type="button" class="btn btn-primary" (click)="loadProperties()">Try again</button>
          </div>
        } @else if (filteredProperties.length === 0) {
          <div class="empty-state">
            <span class="material-icons-outlined empty-icon" aria-hidden="true">payments</span>
            <h3>No listing records found</h3>
            <p>You do not have any property listings in this filter category.</p>
            <a routerLink="/landlord/add-property" class="btn btn-primary">Create New Listing</a>
          </div>
        } @else {
          <div class="table-container">
            <table class="fluent-table">
              <thead>
                <tr>
                  <th>Property Listing</th>
                  <th>Monthly Rent</th>
                  <th>Entrance Fee Amount</th>
                  <th>Payment Status</th>
                  <th>Provider & Reference</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (prop of pagedProperties; track prop.id) {
                  <tr [class.highlight]="prop.id === newListingId">
                    <td class="property-cell">
                      <img
                        [src]="prop.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'"
                        [alt]="prop.title"
                        class="table-prop-thumb"
                      />
                      <div class="prop-meta">
                        <strong>{{ prop.title }}</strong>
                        <span>{{ prop.subCity }}, {{ prop.neighborhood }}</span>
                      </div>
                    </td>
                    <td>
                      <strong class="rent-amount">{{ prop.rentAmountETB | number }} ETB</strong>
                      <span class="rent-sub">/ month</span>
                    </td>
                    <td>
                      <div class="fee-badge-box">
                        <strong class="fee-number">{{ (prop.listingFeeAmountETB || feeRateETB) | number }} ETB</strong>
                        <span class="fee-tag">Entrance Fee</span>
                      </div>
                    </td>
                    <td>
                      @if (getFeeStatusCode(prop) === 2) {
                        <span class="status-pill green">
                          <span class="material-icons-outlined pill-icon">check_circle</span>
                          Verified &amp; Paid
                        </span>
                      } @else if (getFeeStatusCode(prop) === 1) {
                        <span class="status-pill amber">
                          <span class="material-icons-outlined pill-icon">hourglass_top</span>
                          Pending Review
                        </span>
                      } @else if (getFeeStatusCode(prop) === 0 || getFeeStatusCode(prop) === 3) {
                        <span class="status-pill red">
                          <span class="material-icons-outlined pill-icon">pending</span>
                          Unpaid
                        </span>
                      } @else {
                        <span class="status-pill">
                          Payment status unavailable: {{ prop.listingFeeStatus }}
                        </span>
                      }
                    </td>
                    <td>
                      @if (prop.listingFeeProvider || prop.listingFeeReference) {
                        <div class="ref-box">
                          <strong>{{ prop.listingFeeProvider || 'Mobile Money' }}</strong>
                          <code>{{ prop.listingFeeReference || 'Ref submitted' }}</code>
                        </div>
                      } @else {
                        <span class="text-muted">Not submitted</span>
                      }
                    </td>
                    <td class="text-right">
                      @if (getFeeStatusCode(prop) === 0 || getFeeStatusCode(prop) === 3) {
                        <button
                          type="button"
                          class="btn-pay-action"
                          (click)="openPayModal(prop)">
                          <span class="material-icons-outlined">payments</span>
                          <span>Pay {{ feeRateETB | number }} ETB</span>
                        </button>
                      } @else if (prop.listingFeeTransactionUrl) {
                        <a
                          [href]="prop.listingFeeTransactionUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="btn-receipt-action"
                          title="Open payment receipt link">
                          <span class="material-icons-outlined">open_in_new</span>
                          <span>Receipt</span>
                        </a>
                      } @else {
                        <button
                          type="button"
                          class="btn-receipt-action"
                          (click)="openPayModal(prop)"
                          title="Update payment reference">
                          <span class="material-icons-outlined">edit</span>
                          <span>Update</span>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Reusable Fluent Pagination Component -->
          <app-pagination
            [totalItems]="filteredProperties.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </section>

      <!-- Pay / Submit Entrance Fee Modal -->
      @if (selectedPropForPayment) {
        <div class="modal-backdrop" (click)="selectedPropForPayment = null">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="badge-modal">ENTRANCE FEE PAYMENT</span>
                <h3>Pay Listing Entrance Fee</h3>
              </div>
              <button type="button" class="close-x" (click)="selectedPropForPayment = null" aria-label="Close">×</button>
            </div>

            <div class="modal-body">
              <div class="payment-callout">
                <div class="callout-prop">
                  <strong>{{ selectedPropForPayment.title }}</strong>
                  <span>Location: {{ selectedPropForPayment.subCity }}, Addis Ababa</span>
                </div>
                <div class="callout-amount">
                  <span>Entrance Fee Due</span>
                  <strong>{{ feeRateETB | number }} ETB</strong>
                </div>
              </div>

              <div class="payment-methods-card">
                <h4>Select Payment Provider</h4>
                <div class="provider-radio-group">
                  <label class="provider-label" [class.selected]="listingFeeProvider === 'Telebirr'">
                    <input type="radio" name="provider" value="Telebirr" [(ngModel)]="listingFeeProvider" />
                    <div class="provider-info">
                      <strong>Telebirr</strong>
                      <span>Account: <strong>0955117065</strong> (Kefale Gedefaw)</span>
                    </div>
                  </label>

                  <label class="provider-label" [class.selected]="listingFeeProvider === 'CBE'">
                    <input type="radio" name="provider" value="CBE" [(ngModel)]="listingFeeProvider" />
                    <div class="provider-info">
                      <strong>Commercial Bank of Ethiopia (CBE)</strong>
                      <span>Account: <strong>1000207193481</strong> (Kefale Gedefaw)</span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="feeRef">Transaction Reference Number *</label>
                <input
                  id="feeRef"
                  type="text"
                  class="form-control"
                  placeholder="e.g. TL948382718 or FT2610294"
                  [(ngModel)]="listingFeeReference"
                  maxlength="200"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="feeUrl">Payment Receipt / Transaction HTTPS Link *</label>
                <input
                  id="feeUrl"
                  type="url"
                  class="form-control"
                  placeholder="https://telebirr.et/receipt/... or online banking link"
                  [(ngModel)]="listingFeeTransactionUrl"
                  maxlength="2048"
                  required
                />
                <small class="form-hint">Admins will open this link to verify your {{ feeRateETB | number }} ETB payment.</small>
              </div>

              @if (paymentError) {
                <div class="alert-error" role="alert">
                  {{ paymentError }}
                </div>
              }
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline"
                [disabled]="isSubmitting"
                (click)="selectedPropForPayment = null">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="isSubmitting || !listingFeeProvider || !listingFeeReference.trim() || !listingFeeTransactionUrl.trim()"
                (click)="submitPayment()">
                {{ isSubmitting ? 'Submitting...' : 'Confirm Payment & Submit for Review' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .payments-page {
      padding: 1.8rem 2rem 4rem;
      max-width: 1360px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.8rem;
      flex-wrap: wrap;
      gap: 1.25rem;
    }
    .eyebrow {
      color: #10b981;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin-bottom: 0.35rem;
      display: block;
    }
    .page-header h1 {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #0f172a;
      margin: 0 0 0.25rem;
    }
    .page-header p {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 150ms ease;
    }
    .btn-primary {
      background: #10b981;
      color: #ffffff;
      border-color: #059669;
    }
    .btn-primary:hover:not(:disabled) {
      background: #059669;
    }
    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }
    .btn-outline:hover:not(:disabled) {
      background: #f8fafc;
    }

    /* ── Success Banner ── */
    .banner-success {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      margin-bottom: 1.8rem;
      color: #065f46;
    }
    .banner-icon {
      font-size: 1.75rem;
      color: #10b981;
      flex-shrink: 0;
    }
    .banner-content {
      flex: 1;
    }
    .banner-content strong {
      font-size: 0.95rem;
      display: block;
      margin-bottom: 0.2rem;
    }
    .banner-content p {
      margin: 0;
      font-size: 0.85rem;
    }
    .close-banner {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #065f46;
      cursor: pointer;
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      padding: 1.25rem 1.4rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    .stat-icon {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      font-size: 1.4rem;
    }
    .stat-icon.green { background: #dcfce7; color: #166534; }
    .stat-icon.blue { background: #dbeafe; color: #1e40af; }
    .stat-icon.amber { background: #fef3c7; color: #b45309; }
    .stat-icon.red { background: #fee2e2; color: #991b1b; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    /* ── Table Card ── */
    .payments-table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .table-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .table-header-row h2 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0 0 0.2rem;
      color: #0f172a;
    }
    .table-header-row p {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0;
    }

    .filter-group {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .filter-pill {
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .filter-pill:hover {
      background: #f0fdf4;
      border-color: #a7f3d0;
      color: #047857;
    }
    .filter-pill.active {
      background: #10b981;
      border-color: #059669;
      color: #ffffff;
    }

    /* ── Table ── */
    .table-container {
      overflow-x: auto;
    }
    .fluent-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.86rem;
    }
    .fluent-table th {
      padding: 0.85rem 1rem;
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .fluent-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }
    .fluent-table tr:hover td {
      background: #fafcfb;
    }
    .fluent-table tr.highlight td {
      background: #f0fdf4;
    }

    .property-cell {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 240px;
    }
    .table-prop-thumb {
      width: 54px;
      height: 42px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .prop-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .prop-meta strong {
      font-size: 0.88rem;
      color: #0f172a;
    }
    .prop-meta span {
      font-size: 0.75rem;
      color: #64748b;
    }

    .rent-amount {
      color: #0f172a;
      font-size: 0.9rem;
    }
    .rent-sub {
      color: #94a3b8;
      font-size: 0.75rem;
      margin-left: 0.2rem;
    }

    .fee-badge-box {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .fee-number {
      font-size: 0.95rem;
      color: #047857;
      font-weight: 800;
    }
    .fee-tag {
      font-size: 0.68rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .status-pill .pill-icon {
      font-size: 0.95rem;
    }
    .status-pill.green { background: #dcfce7; color: #166534; }
    .status-pill.amber { background: #fef3c7; color: #92400e; }
    .status-pill.red { background: #fee2e2; color: #991b1b; }

    .ref-box {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .ref-box strong {
      font-size: 0.8rem;
      color: #0f172a;
    }
    .ref-box code {
      font-size: 0.72rem;
      background: #f1f5f9;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      color: #475569;
    }

    .text-right {
      text-align: right;
    }

    .btn-pay-action {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      border: 1px solid #059669;
      background: #10b981;
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 150ms;
    }
    .btn-pay-action:hover {
      background: #059669;
    }
    .btn-pay-action .material-icons-outlined {
      font-size: 1.05rem;
    }

    .btn-receipt-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 150ms;
    }
    .btn-receipt-action:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-receipt-action .material-icons-outlined {
      font-size: 1rem;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.6);
      display: grid;
      place-items: center;
      padding: 1rem;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      width: 100%;
      max-width: 540px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: modalIn 200ms ease;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .badge-modal {
      color: #10b981;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      display: block;
      margin-bottom: 0.2rem;
    }
    .modal-title-group h3 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .close-x {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .payment-callout {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      gap: 1rem;
    }
    .callout-prop strong {
      display: block;
      font-size: 0.92rem;
      color: #0f172a;
    }
    .callout-prop span {
      font-size: 0.78rem;
      color: #64748b;
    }
    .callout-amount {
      text-align: right;
    }
    .callout-amount span {
      display: block;
      font-size: 0.72rem;
      color: #64748b;
      text-transform: uppercase;
    }
    .callout-amount strong {
      font-size: 1.25rem;
      color: #047857;
      font-weight: 800;
    }

    .payment-methods-card h4 {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.65rem;
    }
    .provider-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .provider-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.9rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      cursor: pointer;
      transition: all 150ms;
    }
    .provider-label.selected {
      border-color: #10b981;
      background: #f0fdf4;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .provider-info {
      display: flex;
      flex-direction: column;
      font-size: 0.82rem;
    }
    .provider-info span {
      color: #64748b;
      font-size: 0.76rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
    }
    .form-control {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.86rem;
      outline: none;
    }
    .form-control:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .form-hint {
      color: #64748b;
      font-size: 0.72rem;
    }

    .alert-error {
      padding: 0.65rem 0.9rem;
      border-radius: 6px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      font-size: 0.82rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    /* States */
    .loading-state, .empty-state {
      padding: 4rem 1.5rem;
      text-align: center;
      color: #64748b;
    }
    .empty-icon {
      font-size: 3rem;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }
    .empty-state h3 {
      font-size: 1.2rem;
      color: #0f172a;
      margin: 0 0 0.35rem;
    }
    .empty-state p {
      margin: 0 0 1.25rem;
      font-size: 0.85rem;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
      margin: 0 auto 0.75rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LandlordPaymentsComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);

  properties: PropertySummary[] = [];
  isLoading = true;
  loadError = '';
  filterStatus: 'all' | 'paid' | 'pending' | 'unpaid' = 'all';

  readonly feeRateETB = 1000;
  justAddedListing = false;
  newListingId: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;

  // Payment Modal
  selectedPropForPayment: PropertySummary | null = null;
  listingFeeProvider = 'Telebirr';
  listingFeeReference = '';
  listingFeeTransactionUrl = '';
  isSubmitting = false;
  paymentError = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['newListingId'] || params['success']) {
        this.justAddedListing = true;
        this.newListingId = params['newListingId'] || null;
      }
    });

    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.loadError = '';
    this.propertyService.getMyProperties().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.properties = res.data;
        } else {
          this.loadError = res.errors?.join(' ') || 'Listing payment data could not be loaded.';
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = error.error?.errors?.[0] || 'We could not reach the server. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  getFeeStatusCode(prop: PropertySummary): number | undefined {
    if (prop.listingFeeStatus == null) return ListingFeeStatus.NotRequired;
    return enumValueFromApi(ListingFeeStatus, prop.listingFeeStatus);
  }

  get verifiedCount(): number {
    return this.properties.filter(p => this.getFeeStatusCode(p) === 2).length;
  }

  get pendingCount(): number {
    return this.properties.filter(p => this.getFeeStatusCode(p) === 1).length;
  }

  get unpaidCount(): number {
    return this.properties.filter(p => {
      const code = this.getFeeStatusCode(p);
      return code === 0 || code === 3;
    }).length;
  }

  get totalVerifiedFees(): number {
    return this.verifiedCount * this.feeRateETB;
  }

  get filteredProperties(): PropertySummary[] {
    if (this.filterStatus === 'paid') {
      return this.properties.filter(p => this.getFeeStatusCode(p) === 2);
    }
    if (this.filterStatus === 'pending') {
      return this.properties.filter(p => this.getFeeStatusCode(p) === 1);
    }
    if (this.filterStatus === 'unpaid') {
      return this.properties.filter(p => {
        const code = this.getFeeStatusCode(p);
        return code === 0 || code === 3;
      });
    }
    return this.properties;
  }

  get pagedProperties(): PropertySummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProperties.slice(start, start + this.pageSize);
  }

  setFilter(status: 'all' | 'paid' | 'pending' | 'unpaid'): void {
    this.filterStatus = status;
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  openPayModal(prop: PropertySummary): void {
    this.selectedPropForPayment = prop;
    this.listingFeeProvider = prop.listingFeeProvider || 'Telebirr';
    this.listingFeeReference = prop.listingFeeReference || '';
    this.listingFeeTransactionUrl = prop.listingFeeTransactionUrl || '';
    this.paymentError = '';
  }

  submitPayment(): void {
    if (!this.selectedPropForPayment) return;
    if (!this.listingFeeProvider || !this.listingFeeReference.trim()) {
      this.paymentError = 'Choose a payment provider and enter the reference number.';
      return;
    }
    if (!this.listingFeeTransactionUrl.trim().startsWith('https://')) {
      this.paymentError = 'Please enter a valid HTTPS transaction/receipt link.';
      return;
    }

    this.isSubmitting = true;
    this.paymentError = '';

    this.propertyService.submitForReview(this.selectedPropForPayment.id, {
      listingFeeProvider: this.listingFeeProvider,
      listingFeeReference: this.listingFeeReference.trim(),
      listingFeeTransactionUrl: this.listingFeeTransactionUrl.trim(),
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.succeeded) {
          this.selectedPropForPayment = null;
          this.loadProperties();
        } else {
          this.paymentError = res.errors?.[0] || 'Payment could not be recorded.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.paymentError = err.error?.errors?.[0] || 'Payment submission failed.';
      }
    });
  }
}
