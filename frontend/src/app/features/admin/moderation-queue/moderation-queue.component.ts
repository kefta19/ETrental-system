import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertySummary } from '../../../core/models/property.model';

@Component({
  selector: 'app-moderation-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="moderation-page">
      <!-- Top Bar -->
      <header class="admin-header">
        <div class="header-left">
          <h1>Property Moderation</h1>
          <p>Review and approve property listings</p>
        </div>
        <div class="header-right">
          <div class="header-stats">
            <div class="stat-pill">
              <span class="stat-label">Pending</span>
              <span class="stat-value">{{ totalCount }}</span>
            </div>
          </div>
          <div class="user-avatar">
            <span>Admin</span>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="admin-content">
          @if (error) {
            <div class="moderation-error" role="alert">{{ error }}</div>
          }
          @if (isLoading) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading moderation queue...</p>
            </div>
          } @else if (pendingListings.length === 0) {
            <div class="empty-state">
              <div class="empty-illustration">
                <span class="empty-emoji material-icons-outlined" aria-hidden="true">celebration</span>
              </div>
              <h2>All Clear!</h2>
              <p>No listings pending review. Great job keeping the platform clean!</p>
              <button class="btn btn-outline" (click)="loadPending()">
                <span class="material-icons-outlined" aria-hidden="true">refresh</span> Refresh Queue
              </button>
            </div>
          } @else {
            <div class="queue-table-wrap">
              <table class="queue-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Landlord</th>
                    <th>Rent</th>
                    <th>Listing fee</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th><span class="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
              @for (prop of pendingListings; track prop.id) {
                    <tr>
                      <td>
                        <div class="table-property">
                          <img [src]="prop.primaryImageUrl || 'assets/images/property-placeholder.jpg'" alt="" />
                          <span><strong>{{ prop.title }}</strong><small>{{ prop.neighborhood }}, {{ prop.subCity }}, {{ prop.city }}</small></span>
                        </div>
                      </td>
                      <td><strong>{{ prop.landlordName }}</strong><small class="table-subtext">{{ prop.landlordPhone || 'No phone provided' }}</small></td>
                      <td>{{ prop.rentAmountETB | number }} ETB <small class="table-subtext">per month</small></td>
                      <td>
                        <span>{{ prop.listingFeeAmountETB | number }} ETB</span>
                        <small class="table-subtext">{{ prop.listingFeeProvider || 'Legacy listing' }} · {{ isListingFeePending(prop) ? 'Needs verification' : 'Fee verified' }}</small>
                      </td>
                      <td><span class="listing-status" [ngClass]="statusClass(prop.status)">{{ statusLabel(prop.status) }}</span></td>
                      <td>{{ prop.createdAtUtc | date:'mediumDate' }}</td>
                      <td><button class="details-button" type="button" (click)="openDetails(prop)">
                        <span class="material-icons-outlined" aria-hidden="true">visibility</span> View details
                      </button></td>
                    </tr>
              }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
      @if (totalCount > pageSize) {
        <div class="queue-pagination">
          <button class="btn btn-outline" [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
          <span>Page {{ page }} · {{ totalCount }} listings</span>
          <button class="btn btn-outline" [disabled]="page * pageSize >= totalCount" (click)="changePage(1)">Next</button>
        </div>
      }

      @if (selectedForDetails) {
        <div class="modal-backdrop details-backdrop" (click)="closeDetails()">
          <section class="modal-card details-modal" role="dialog" aria-modal="true"
            aria-labelledby="details-title" (click)="$event.stopPropagation()">
            <header class="details-header">
              <div><h2 id="details-title">Listing details</h2><p>Review the complete submission before making a decision.</p></div>
              <button type="button" class="icon-close" aria-label="Close details" (click)="closeDetails()">×</button>
            </header>
            @if (detailsLoading) {
              <div class="details-loading"><span class="spinner"></span><p>Loading full listing details…</p></div>
            } @else if (detailsError) {
              <p class="moderation-error" role="alert">{{ detailsError }}</p>
            } @else if (propertyDetails) {
              <div class="details-content">
                <section class="details-section">
                  <h3>Property</h3>
                  <div class="details-status-line">
                    <small>Listing status</small>
                    <span class="listing-status" [ngClass]="statusClass(propertyDetails.status)">{{ statusLabel(propertyDetails.status) }}</span>
                  </div>
                  <div class="details-gallery">
                    @for (image of propertyDetails.imageUrls; track image) {
                      <img [src]="image" [alt]="propertyDetails.title" />
                    }
                  </div>
                  <h4>{{ propertyDetails.title }}</h4>
                  <p class="details-description">{{ propertyDetails.description || 'No description provided.' }}</p>
                  <div class="details-grid">
                    <div><small>Type</small><strong>{{ propertyTypeLabel(propertyDetails.propertyType) }}</strong></div>
                    <div><small>Location</small><strong>{{ propertyDetails.region }}, {{ propertyDetails.city }}, {{ propertyDetails.subCity }}, {{ propertyDetails.neighborhood }}</strong></div>
                    <div><small>Street address</small><strong>{{ propertyDetails.streetAddress || 'Not provided' }}</strong></div>
                    <div><small>Rent</small><strong>{{ propertyDetails.rentAmountETB | number }} ETB / month</strong></div>
                    <div><small>Deposit</small><strong>{{ propertyDetails.depositAmountETB | number }} ETB</strong></div>
                    <div><small>Advance / lease</small><strong>{{ propertyDetails.advanceMonthsRequired }} months advance · {{ propertyDetails.minimumLeaseMonths }} months minimum</strong></div>
                    <div><small>Bedrooms / bathrooms</small><strong>{{ propertyDetails.bedrooms }} / {{ propertyDetails.bathrooms }}</strong></div>
                    <div><small>Area</small><strong>{{ propertyDetails.areaSquareMeters || 'Not provided' }}{{ propertyDetails.areaSquareMeters ? ' m²' : '' }}</strong></div>
                    <div><small>Furnishing</small><strong>{{ furnishingLabel(propertyDetails.furnishing) }}</strong></div>
                    <div><small>Available from</small><strong>{{ propertyDetails.availableFromDate | date:'mediumDate' }}</strong></div>
                    <div><small>Water / electricity bills</small><strong>{{ propertyDetails.waterBillIncluded ? 'Water included' : 'Water not included' }} · {{ propertyDetails.electricityBillIncluded ? 'Electricity included' : 'Electricity not included' }}</strong></div>
                    <div><small>Amenities</small><strong>{{ amenityLabels(propertyDetails) }}</strong></div>
                    @if (propertyDetails.landmark) { <div><small>Landmark</small><strong>{{ propertyDetails.landmark }}</strong></div> }
                    @if (propertyDetails.videoUrl) { <div><small>Property video</small><a [href]="propertyDetails.videoUrl" target="_blank" rel="noopener noreferrer">Open video in new tab</a></div> }
                  </div>
                </section>
                <section class="details-section">
                  <h3>Landlord contact</h3>
                  <div class="details-grid">
                    <div><small>Name</small><strong>{{ propertyDetails.landlordName }}</strong></div>
                    <div><small>Phone</small><strong>{{ propertyDetails.landlordPhone || 'Not provided' }}</strong></div>
                    <div><small>Email</small><strong>{{ propertyDetails.landlordEmail || 'Not provided' }}</strong></div>
                  </div>
                </section>
                <section class="details-section payment-details">
                  <h3>Listing fee payment</h3>
                  <div class="details-grid">
                    <div><small>Provider</small><strong>{{ selectedForDetails.listingFeeProvider || 'Not provided' }}</strong></div>
                    <div><small>Amount submitted</small><strong>{{ selectedForDetails.listingFeeAmountETB | number }} ETB</strong></div>
                    <div><small>Payment status</small><strong>{{ isListingFeePending(selectedForDetails) ? 'Pending manual verification' : 'Verified / no fee required' }}</strong></div>
                    <div><small>Transaction reference</small>
                      <strong class="transaction-reference">{{ selectedForDetails.listingFeeReference || 'Not provided' }}</strong>
                      <a class="reference-link" [href]="transactionLinkFor(selectedForDetails)"
                        target="_blank" rel="noopener noreferrer">
                        <span class="material-icons-outlined" aria-hidden="true">open_in_new</span>
                        Open transaction reference link
                      </a>
                    </div>
                  </div>
                </section>
              </div>
              <footer class="details-actions">
                <button class="btn btn-outline" type="button" (click)="closeDetails()">Close</button>
                <button class="action-btn reject" type="button" (click)="openRejectFromDetails()">Reject</button>
                <button class="action-btn approve" type="button" (click)="openApprovalFromDetails()">
                  {{ isListingFeePending(selectedForDetails) ? 'Verify & approve' : 'Approve & publish' }}
                </button>
              </footer>
            }
          </section>
        </div>
      }

      @if (selectedForApproval) {
        <div class="modal-backdrop approval-backdrop" (click)="closeApprovalModal()">
          <section class="modal-card approval-modal" role="dialog" aria-modal="true"
            aria-labelledby="approval-title" (click)="$event.stopPropagation()">
            <div class="approval-heading">
              <span class="material-icons-outlined" aria-hidden="true">fact_check</span>
              <div>
                <h3 id="approval-title">Review before publishing</h3>
                <p>{{ selectedForApproval.title }}</p>
              </div>
            </div>
            @if (isListingFeePending(selectedForApproval)) {
              <div class="payment-verification-panel">
                <h4>Manual payment verification</h4>
                <p>Open the transaction link supplied by the landlord and verify the destination is the expected payment provider before entering credentials.</p>
                <dl>
                  <div><dt>Provider</dt><dd>{{ selectedForApproval.listingFeeProvider || 'Not provided' }}</dd></div>
                  <div><dt>Required amount</dt><dd>1,000 ETB</dd></div>
                  <div><dt>Submitted amount</dt><dd>{{ selectedForApproval.listingFeeAmountETB | number }} ETB</dd></div>
                  <div><dt>Transaction reference</dt><dd class="payment-reference">{{ selectedForApproval.listingFeeReference || 'Not provided' }}</dd></div>
                </dl>
                <a class="reference-link" [href]="transactionLinkFor(selectedForApproval)"
                  target="_blank" rel="noopener noreferrer">
                    <span class="material-icons-outlined" aria-hidden="true">open_in_new</span>
                    Open transaction reference link
                </a>
                <label class="payment-confirmation">
                  <input type="checkbox" [(ngModel)]="paymentConfirmation" />
                  <span>I independently verified in the provider account that this transaction is successful and the amount and reference match.</span>
                </label>
              </div>
            } @else {
              <p class="approval-description">Confirm that the listing information meets platform policy before publishing it to renters.</p>
            }
            @if (approvalError) { <p class="approval-error" role="alert">{{ approvalError }}</p> }
            <div class="modal-buttons">
              <button class="btn btn-outline" type="button" (click)="closeApprovalModal()">Cancel</button>
              <button class="btn btn-publish" type="button"
                [disabled]="isApproving || (isListingFeePending(selectedForApproval) && (!paymentConfirmation || !transactionLinkFor(selectedForApproval)))"
                (click)="confirmApproval()">
                {{ isApproving ? 'Publishing…' : 'Approve and publish' }}
              </button>
            </div>
          </section>
        </div>
      }

      <!-- Rejection Modal -->
      @if (selectedForRejection) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3>Reject Listing</h3>
            <p>Reject this submission or return it to the landlord with specific correction guidance.</p>

            <div class="form-group">
              <label class="form-label">Rejection Policy Category</label>
              <select [(ngModel)]="rejectionCategory" class="form-control">
                <option value="UnrealisticPricing">Unrealistic / Suspicious ETB Pricing</option>
                <option value="SubstandardPhotos">Substandard or Watermarked Photographs</option>
                <option value="MisleadingLocation">Inaccurate or Misleading Sub-City/Neighborhood</option>
                <option value="DuplicateListing">Duplicate / Competing Broker Listing</option>
                <option value="Other">Other Policy Violation</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Detailed Explanation for Landlord</label>
              <textarea [(ngModel)]="rejectionReason" class="form-control" rows="4" placeholder="Explain what needs to be corrected..."></textarea>
            </div>

            <div class="modal-buttons">
              <button class="btn btn-outline" (click)="selectedForRejection = null">Cancel</button>
              <button class="btn btn-outline" (click)="requestCorrection()">Request Correction</button>
              <button class="btn btn-danger" (click)="confirmReject()">Reject Listing</button>
            </div>
          </div>
        </div>
      }
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .moderation-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .moderation-error { margin: 0 0 1rem; padding: .75rem 1rem; border: 1px solid #fecaca; border-radius: 8px; background: #fff1f2; color: #991b1b; }
    .queue-pagination { display:flex; justify-content:center; align-items:center; gap:1rem; padding:1rem; color:#64748b; font-size:.85rem; }

    .admin-header {
      background: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .header-left p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .header-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      background: #f1f5f9;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 70px;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .admin-content {
      width:100%;
      max-width:none;
      box-sizing:border-box;
      flex:1;
      overflow-y:auto;
      padding:1.25rem clamp(1rem,2vw,2rem);
    }
    .queue-table-wrap { overflow-x:auto; border:1px solid #e2e8f0; border-radius:12px; background:white; box-shadow:0 1px 3px #0f172a0a; }
    .queue-table { width:100%; border-collapse:collapse; min-width:950px; color:#334155; font-size:.82rem; }
    .queue-table th { padding:.85rem 1rem; background:#f8fafc; color:#64748b; font-size:.68rem; font-weight:700; text-align:left; text-transform:uppercase; letter-spacing:.04em; }
    .queue-table td { padding:.8rem 1rem; border-top:1px solid #edf0f2; vertical-align:middle; }
    .queue-table tr:hover td { background:#fbfdfb; }
    .table-property { display:flex; min-width:230px; align-items:center; gap:.7rem; }
    .table-property img { width:55px; height:43px; flex:0 0 55px; border-radius:7px; object-fit:cover; background:#e9efeb; }
    .table-property > span { display:grid; gap:.25rem; }
    .table-property strong, .queue-table td > strong { color:#26382e; }
    .table-property small, .table-subtext { display:block; margin-top:.22rem; color:#75847a; font-size:.7rem; }
    .details-button { display:inline-flex; align-items:center; gap:.35rem; padding:.5rem .7rem; border:1px solid #d4e4d9; border-radius:7px; background:white; color:#176b4d; font-size:.75rem; font-weight:700; white-space:nowrap; cursor:pointer; }
    .details-button:hover { background:#f1f8f3; }
    .details-button .material-icons-outlined { font-size:1rem; }
    .listing-status { display:inline-flex; align-items:center; gap:.35rem; width:max-content; padding:.3rem .55rem; border-radius:999px; font-size:.68rem; font-weight:750; white-space:nowrap; }
    .listing-status::before { width:6px; height:6px; border-radius:50%; background:currentColor; content:""; }
    .status-pending { background:#fff6df; color:#9a6700; }
    .status-published { background:#e7f6ed; color:#16734d; }
    .status-rejected { background:#fff0ef; color:#b42318; }
    .status-draft { background:#eef2f6; color:#5c6673; }
    .status-other { background:#edf4fb; color:#315f8c; }
    .details-status-line { display:flex; align-items:center; gap:.6rem; margin:-.25rem 0 .8rem; }
    .details-status-line small { color:#77867d; font-size:.7rem; }
    .visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; clip-path:inset(50%); }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
    }

    .empty-illustration {
      margin-bottom: 1.5rem;
    }

    .empty-emoji {
      font-size: 4rem;
    }

    .empty-state h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
    }

    /* Moderation Grid */
    .moderation-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .listing-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }

    .listing-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-image {
      position: relative;
      height: 200px;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 30%);
    }

    .status-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-badge.pending {
      background: #f59e0b;
      color: white;
    }

    .card-body {
      padding: 1.25rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .card-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.4;
      flex: 1;
    }

    .property-type {
      background: #f1f5f9;
      color: #64748b;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 0.5rem;
    }

    .card-location {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #64748b;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .location-icon {
      font-size: 1rem;
    }

    .card-price {
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .price-main {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .price-amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0369a1;
    }

    .price-currency {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0369a1;
    }

    .price-period {
      font-size: 0.75rem;
      color: #64748b;
    }

    .price-details {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .card-specs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .spec-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      color: #64748b;
    }

    .spec-icon {
      font-size: 1rem;
    }

    .card-landlord {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .landlord-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .landlord-details {
      display: flex;
      flex-direction: column;
    }

    .landlord-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .landlord-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
    .payment-review {
      display: grid;
      gap: .3rem;
      margin: 0 0 1rem;
      padding: .85rem;
      border: 1px solid #fde68a;
      border-radius: 8px;
      background: #fffbeb;
      color: #713f12;
      font-size: .78rem;
      overflow-wrap: anywhere;
    }
    .payment-review small {
      line-height: 1.4;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem;
      border-radius: 8px;
      border: none;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .action-btn.approve {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .action-btn.approve:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .action-btn.reject {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .action-btn.reject:hover {
      background: #fee2e2;
    }

    .action-btn.view {
      background: #f1f5f9;
      color: #64748b;
    }

    .action-btn.view:hover {
      background: #e2e8f0;
    }

    .btn-icon {
      font-size: 1rem;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-card h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .modal-card p {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0 0 1.5rem 0;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-outline {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .btn-danger:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .approval-backdrop { z-index: 20; }
    .approval-modal { width:min(540px,100%); }
    .approval-heading { display:flex; align-items:flex-start; gap:.75rem; margin-bottom:1rem; }
    .approval-heading > .material-icons-outlined { display:grid; width:40px; height:40px; place-items:center; border-radius:12px; background:#eaf6ef; color:#16734d; font-size:1.35rem; }
    .approval-heading h3 { margin:0; color:#1e293b; }
    .approval-heading p, .approval-description { margin:.25rem 0 0; color:#64748b; font-size:.85rem; }
    .payment-verification-panel { padding:1rem; border:1px solid #dce9df; border-radius:12px; background:#f7fbf8; }
    .payment-verification-panel h4 { margin:0 0 .35rem; color:#234332; font-size:.9rem; }
    .payment-verification-panel > p { margin:0; color:#63746a; font-size:.78rem; line-height:1.5; }
    .payment-verification-panel dl { display:grid; gap:.55rem; margin:1rem 0; }
    .payment-verification-panel dl > div { display:flex; justify-content:space-between; gap:1rem; font-size:.8rem; }
    .payment-verification-panel dt { color:#6b7c72; }
    .payment-verification-panel dd { margin:0; color:#24382c; font-weight:700; text-align:right; }
    .payment-reference { overflow-wrap:anywhere; }
    .payment-confirmation { display:flex; align-items:flex-start; gap:.6rem; padding-top:.8rem; border-top:1px solid #e2ebe4; color:#33463a; font-size:.78rem; line-height:1.45; cursor:pointer; }
    .payment-confirmation input { width:16px; height:16px; flex:0 0 16px; margin:.1rem 0 0; accent-color:#16734d; }
    .approval-error { margin:.8rem 0 0; color:#a33a3a; font-size:.8rem; }
    .btn-publish { background:#16734d; color:white; }
    .btn-publish:hover:not(:disabled) { background:#105b3c; }
    .btn-publish:disabled { opacity:.55; cursor:not-allowed; }
    .details-backdrop { z-index:10; align-items:flex-start; overflow-y:auto; padding:2vh 1rem; }
    .details-modal { width:min(1200px,calc(100vw - 2rem)); max-width:none; max-height:96vh; padding:0; overflow:hidden; display:flex; flex-direction:column; }
    .details-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.15rem 1.35rem; border-bottom:1px solid #e8ece9; }
    .details-header h2 { margin:0; color:#1e293b; font-size:1.15rem; }
    .details-header p { margin:.25rem 0 0; color:#64748b; font-size:.78rem; }
    .icon-close { width:32px; height:32px; border:0; border-radius:7px; background:#f1f5f2; color:#46564c; font-size:1.35rem; cursor:pointer; }
    .details-content { overflow:auto; padding:1rem 1.35rem; }
    .details-section { padding:.9rem 0; border-bottom:1px solid #edf0ed; }
    .details-section:last-child { border-bottom:0; }
    .details-section h3 { margin:0 0 .8rem; color:#176b4d; font-size:.9rem; }
    .details-section h4 { margin:.85rem 0 .3rem; color:#26382e; font-size:1rem; }
    .details-description { margin:0 0 .8rem; color:#53635a; font-size:.82rem; line-height:1.55; white-space:pre-wrap; }
    .details-gallery { display:flex; gap:.55rem; overflow-x:auto; }
    .details-gallery img { width:190px; height:130px; flex:0 0 190px; border-radius:8px; object-fit:cover; background:#eef2ef; }
    .details-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem 1.1rem; }
    .details-grid > div { display:grid; min-width:0; gap:.2rem; }
    .details-grid small { color:#77867d; font-size:.68rem; }
    .details-grid strong, .details-grid a { overflow-wrap:anywhere; color:#304238; font-size:.78rem; font-weight:650; }
    .details-grid a { color:#176b4d; }
    .reference-link { display:inline-flex; align-items:center; gap:.3rem; width:fit-content; margin-top:.35rem; padding:.5rem .65rem; border:1px solid #c7dfcf; border-radius:7px; background:#f2faf4; color:#176b4d; font:inherit; font-size:.78rem; font-weight:700; text-decoration:none; cursor:pointer; }
    .reference-link .material-icons-outlined { font-size:.9rem; }
    .reference-link:hover { border-color:#176b4d; background:#e8f5ec; }
    .reference-link:disabled { border-color:#d8dfda; background:#f3f5f3; color:#87928b; cursor:not-allowed; }
    .transaction-reference { overflow-wrap:anywhere; }
    .payment-verification-panel > .reference-link { margin:.7rem 0 .2rem; }
    .details-actions { display:flex; justify-content:flex-end; gap:.6rem; padding:.85rem 1.35rem; border-top:1px solid #e8ece9; background:white; }
    .details-loading { display:grid; place-items:center; padding:2rem; color:#64748b; }
    .details-loading .spinner { width:30px; height:30px; border-width:3px; }
    @media(max-width:600px) {
      .details-backdrop { padding:.5rem; }
      .details-modal { width:calc(100vw - 1rem); max-height:99vh; }
      .details-grid { grid-template-columns:1fr; }
      .details-actions { flex-wrap:wrap; padding:.75rem; }
      .details-actions > button { flex:1; }
      .admin-content { padding:1rem; }
    }
  `]
})
export class ModerationQueueComponent implements OnInit {
  private adminService = inject(AdminService);
  private propertyService = inject(PropertyService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  pendingListings: PropertySummary[] = [];
  isLoading = true;
  error = '';
  page = 1;
  readonly pageSize = 12;
  totalCount = 0;

  selectedForRejection: PropertySummary | null = null;
  selectedForDetails: PropertySummary | null = null;
  propertyDetails: Property | null = null;
  detailsLoading = false;
  detailsError = '';
  selectedForApproval: PropertySummary | null = null;
  paymentConfirmation = false;
  isApproving = false;
  approvalError = '';
  rejectionCategory = 'UnrealisticPricing';
  rejectionReason = '';

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loadPending());
  }

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.isLoading = true;
    this.error = '';
    this.propertyService.getPendingModeration(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.changeDetector.markForCheck();
        if (res.succeeded && res.data) {
          this.pendingListings = res.data.items;
          this.totalCount = res.data.totalCount;
          if (this.pendingListings.length === 0 && this.page > 1) {
            this.page -= 1;
            this.loadPending();
          }
        } else {
          this.error = res.errors?.[0] || 'Unable to load the moderation queue.';
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.errors?.[0] || 'Unable to load the moderation queue.';
        this.changeDetector.markForCheck();
      }
    });
  }

  openDetails(property: PropertySummary): void {
    this.selectedForDetails = property;
    this.propertyDetails = null;
    this.detailsError = '';
    this.detailsLoading = true;
    this.propertyService.getById(property.id).subscribe({
      next: response => {
        this.detailsLoading = false;
        if (!response.succeeded || !response.data) {
          this.detailsError = response.errors?.[0] || 'Unable to load listing details.';
          return;
        }
        this.propertyDetails = response.data;
      },
      error: error => {
        this.detailsLoading = false;
        this.detailsError = error.error?.errors?.[0] || 'Unable to load listing details.';
      }
    });
  }

  closeDetails(): void {
    this.selectedForDetails = null;
    this.propertyDetails = null;
  }

  openApprovalFromDetails(): void {
    if (!this.selectedForDetails) return;
    this.openApprovalModal(this.selectedForDetails);
  }

  openRejectFromDetails(): void {
    if (!this.selectedForDetails) return;
    const property = this.selectedForDetails;
    this.closeDetails();
    this.openRejectModal(property);
  }

  safeTransactionUrl(value?: string | null): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  transactionLinkFor(property: PropertySummary): string {
    return this.safeTransactionUrl(property.listingFeeTransactionUrl)
      ?? this.safeTransactionUrl(property.listingFeeReference)
      ?? this.providerPortalUrl(property.listingFeeProvider)
      ?? 'https://www.combanketh.et/';
  }

  private providerPortalUrl(provider?: string | null): string | null {
    switch (provider?.trim().toLowerCase()) {
      case 'telebirr':
        return 'https://www.ethiotelecom.et/telebirr/';
      case 'cbe':
        return 'https://www.combanketh.et/';
      default:
        return null;
    }
  }

  propertyTypeLabel(type: number): string {
    return ['Apartment', 'Condominium', 'Villa', 'G+1', 'Studio', 'Service quarter', 'Commercial'][type] || 'Property';
  }

  furnishingLabel(furnishing: number): string {
    return ['Unfurnished', 'Semi-furnished', 'Fully furnished'][furnishing] || 'Not specified';
  }

  amenityLabels(property: Property): string {
    const amenities = [
      property.hasWaterTank && 'Water tank',
      property.hasGenerator && 'Generator',
      property.hasSecurityGuard && 'Security guard',
      property.hasParking && 'Parking',
      property.hasElevator && 'Elevator',
      property.hasWifi && 'Wi-Fi',
      property.hasBalcony && 'Balcony'
    ].filter(Boolean);
    return amenities.length ? amenities.join(', ') : 'None listed';
  }

  changePage(delta: number) {
    this.page += delta;
    this.loadPending();
  }

  isListingFeePending(property: PropertySummary): boolean {
    const status = String(property.listingFeeStatus ?? '').toLowerCase();
    return status === 'pending' || status === '1';
  }

  statusLabel(status: number): string {
    switch (status) {
      case 0: return 'Draft';
      case 1: return 'Pending review';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      case 4: return 'Published';
      case 5: return 'Unavailable';
      case 6: return 'Rented';
      case 7: return 'Archived';
      default: return 'Unknown';
    }
  }

  statusClass(status: number): string {
    switch (status) {
      case 0: return 'status-draft';
      case 1: return 'status-pending';
      case 3: return 'status-rejected';
      case 4: return 'status-published';
      default: return 'status-other';
    }
  }

  openApprovalModal(property: PropertySummary): void {
    this.selectedForApproval = property;
    this.paymentConfirmation = false;
    this.approvalError = '';
  }

  closeApprovalModal(): void {
    if (this.isApproving) return;
    this.selectedForApproval = null;
    this.paymentConfirmation = false;
    this.approvalError = '';
  }

  confirmApproval(): void {
    const property = this.selectedForApproval;
    if (!property || this.isApproving) return;
    const paymentPending = this.isListingFeePending(property);
    if (paymentPending && !this.paymentConfirmation) return;

    this.isApproving = true;
    this.approvalError = '';
    this.propertyService.moderateListing(property.id, {
      approved: true,
      paymentVerified: paymentPending && this.paymentConfirmation
    }).subscribe({
      next: response => {
        this.isApproving = false;
        if (!response.succeeded) {
          this.approvalError = response.errors?.[0] || 'Could not approve this listing.';
          return;
        }
        this.selectedForApproval = null;
        this.closeDetails();
        this.loadPending();
      },
      error: error => {
        this.isApproving = false;
        this.approvalError = error.error?.errors?.[0] || 'Could not approve this listing.';
      }
    });
  }

  openRejectModal(prop: PropertySummary) {
    this.selectedForRejection = prop;
    this.rejectionReason = '';
  }

  confirmReject() {
    if (!this.selectedForRejection) return;
    if (!this.rejectionReason.trim()) {
      alert('Provide a rejection reason before continuing.');
      return;
    }

    this.propertyService.moderateListing(this.selectedForRejection.id, {
      approved: false,
      rejectionCategory: this.rejectionCategory,
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        alert('Listing has been rejected with feedback recorded.');
        this.selectedForRejection = null;
        this.loadPending();
      },
      error: (error) => alert(error.error?.errors?.[0] || 'Could not reject this listing.')
    });
  }

  requestCorrection() {
    if (!this.selectedForRejection || !this.rejectionReason.trim()) {
      alert('Provide clear correction guidance for the landlord.');
      return;
    }

    this.propertyService.moderateListing(this.selectedForRejection.id, {
      approved: false,
      requestCorrection: true,
      rejectionCategory: this.rejectionCategory,
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        alert('Correction guidance has been sent to the landlord.');
        this.selectedForRejection = null;
        this.loadPending();
      },
      error: (error) => alert(error.error?.errors?.[0] || 'Could not request listing corrections.')
    });
  }
}
