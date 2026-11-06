import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import {
  FurnishingStatus,
  ListingFeeStatus,
  PropertySummary,
  PropertyStatus,
  PropertyStatusValue,
  FurnishingStatusValue
} from '../../../core/models/property.model';
import { enumValueFromApi } from '../../../core/models/api-enum.util';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  template: `<div class="my-properties-page container">
  <div class="page-header">
    <div>
      <span class="eyebrow">Landlord Portfolio</span>
      <h1>My Properties</h1>
      <p>Manage your listings, track moderation status, and mark units as rented</p>
    </div>
    <a routerLink="/landlord/add-property" class="btn btn-primary">
      <span class="material-icons-outlined" aria-hidden="true">add</span> Add New Property
    </a>
  </div>

  <div class="status-filter-bar">
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === undefined" 
      (click)="setStatus(undefined)"
    >
      All Properties
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 0" 
      (click)="setStatus(0)"
    >
      Draft
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 1" 
      (click)="setStatus(1)"
    >
      Pending Review
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 2" 
      (click)="setStatus(2)"
    >
      Approved
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 4" 
      (click)="setStatus(4)"
    >
      Published
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 6" 
      (click)="setStatus(6)"
    >
      Rented
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 5" 
      (click)="setStatus(5)"
    >
      Unavailable
    </button>
    <button 
      class="filter-chip" 
      [class.active]="selectedStatus === 3" 
      (click)="setStatus(3)"
    >
      Rejected
    </button>
  </div>

  @if (isLoading) {
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your properties...</p>
    </div>
  } @else if (loadError) {
    <div class="empty-state" role="alert">
      <h3>Properties could not be loaded</h3>
      <p>{{ loadError }}</p>
      <button type="button" class="btn btn-primary" (click)="loadProperties()">Try again</button>
    </div>
  } @else if (properties.length === 0) {
    <div class="empty-state">
      <div class="empty-icon"><span class="material-icons-outlined" aria-hidden="true">home</span></div>
      <h3>No properties found</h3>
      <p>You don't have any properties in this category yet.</p>
      <a routerLink="/landlord/add-property" class="btn btn-primary">Create Your First Listing</a>
    </div>
  } @else {
    <div class="properties-list">
      @for (prop of pagedProperties; track prop.id) {
        <div class="property-list-card">
          <div class="property-image-section">
            <img 
              [src]="prop.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'" 
              [alt]="prop.title"
              class="property-thumbnail"
            />
            <span class="status-badge" [class]="'status-' + (getPropertyStatusCode(prop.status) ?? 'unknown')">
              {{ getStatusLabel(prop.status) }}
            </span>
          </div>

          <div class="property-details-section">
            <div class="property-main-info">
              <h3 class="property-title">{{ prop.title }}</h3>
              <p class="property-location">
                <span class="material-icons-outlined" aria-hidden="true">location_on</span>
                {{ prop.neighborhood }}, {{ prop.subCity }}, {{ prop.city }}
              </p>
              <div class="property-specs">
                <span class="spec-item"><span class="material-icons-outlined" aria-hidden="true">bed</span> {{ prop.bedrooms }} Bed</span>
                <span class="spec-item"><span class="material-icons-outlined" aria-hidden="true">bathtub</span> {{ prop.bathrooms }} Bath</span>
                @if (prop.areaSquareMeters) {
                  <span class="spec-item"><span class="material-icons-outlined" aria-hidden="true">square_foot</span> {{ prop.areaSquareMeters }} m²</span>
                }
                <span class="spec-item"><span class="material-icons-outlined" aria-hidden="true">chair</span> {{ getFurnishingLabel(prop.furnishing) }}</span>
              </div>
            </div>

            <div class="property-price-section">
              <div class="price-amount">{{ prop.rentAmountETB | number }} ETB</div>
              <div class="price-period">/ month</div>
              <div class="price-details">+ {{ prop.advanceMonthsRequired }} mo. advance</div>

              <!-- Entrance fee payment display -->
              <div class="listing-fee-badge" [ngClass]="{
                'fee-verified': getFeeStatusCode(prop) === ListingFeeStatus.Verified,
                'fee-pending': getFeeStatusCode(prop) === ListingFeeStatus.Pending,
                'fee-unpaid': getFeeStatusCode(prop) === ListingFeeStatus.NotRequired || getFeeStatusCode(prop) === ListingFeeStatus.Rejected
              }">
                <span class="material-icons-outlined" style="font-size: 15px;">receipt_long</span>
                <span>Fee: <strong>{{ (prop.listingFeeAmountETB || 1000) | number }} ETB</strong></span>
                <span class="fee-tag">{{ getFeeStatusLabel(prop) }}</span>
              </div>

              @if (getPropertyStatusCode(prop.status) === PropertyStatus.PendingReview) {
                <div class="price-details">Payment submitted · awaiting admin verification and review</div>
              }
            </div>

            <div class="property-actions-section">
              <a [routerLink]="['/properties', prop.id]" class="btn-action" title="View Property">
                <span class="material-icons-outlined" aria-hidden="true">visibility</span> View
              </a>
              
              <a routerLink="/landlord/payments" class="btn-action" title="View Entrance Fee & Payments">
                <span class="material-icons-outlined" aria-hidden="true">payments</span> Fee
              </a>

              @if (getPropertyStatusCode(prop.status) === PropertyStatus.Draft) {
                <button class="btn-action btn-action-primary" (click)="submitForReview(prop.id)" title="Submit payment and request review">
                  <span class="material-icons-outlined" aria-hidden="true">payments</span> Pay & submit
                </button>
              }
              
              @if (getPropertyStatusCode(prop.status) === PropertyStatus.Published) {
                <button class="btn-action" (click)="toggleAvailability(prop.id)" title="Mark Unavailable">
                  <span class="material-icons-outlined" aria-hidden="true">pause_circle</span> Unpublish
                </button>
                <button class="btn-action btn-action-success" (click)="openRentedModal(prop)" title="Mark as Rented">
                  <span class="material-icons-outlined" aria-hidden="true">key</span> Mark as Rented
                </button>
              }
              
              @if (getPropertyStatusCode(prop.status) === PropertyStatus.Unavailable) {
                <button class="btn-action btn-action-primary" (click)="toggleAvailability(prop.id)" title="Publish Again">
                  <span class="material-icons-outlined" aria-hidden="true">publish</span> Publish
                </button>
              }
              
              @if (getPropertyStatusCode(prop.status) === PropertyStatus.Rejected) {
                <button class="btn-action btn-action-warning" (click)="submitForReview(prop.id)" title="Resubmit">
                  <span class="material-icons-outlined" aria-hidden="true">refresh</span> Resubmit
                </button>
              }
              
              <button class="btn-action btn-action-danger" (click)="deleteProperty(prop.id)" title="Delete">
                <span class="material-icons-outlined" aria-hidden="true">delete</span> Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Reusable Pagination System -->
    <app-pagination
      [totalItems]="properties.length"
      [pageSize]="pageSize"
      [currentPage]="currentPage"
      (pageChange)="onPageChange($event)">
    </app-pagination>
  }
</div>

<!-- Mark as Rented Modal -->
@if (selectedPropForPayment) {
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Submit listing for review</h3>
        <button class="close-x" (click)="selectedPropForPayment = null" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <p><strong>{{ selectedPropForPayment.title }}</strong></p>
        <p>Listing fee: {{ listingFeeETB | number }} ETB. Admin will verify the payment and listing before publishing.</p>
        @if (selectedPropForPayment.listingFeeStatus === 1 || selectedPropForPayment.listingFeeStatus === 2) {
          <p>We’ll reuse the payment reference already submitted for this listing. Add the provider’s transaction link below.</p>
        } @else {
          <div class="form-group">
            <label class="form-label" for="draftPaymentProvider">Payment method</label>
            <select id="draftPaymentProvider" [(ngModel)]="listingFeeProvider" class="form-control">
              <option value="">Choose a payment method</option>
              <option value="Telebirr">Telebirr — Kefale Gedefaw, 0955117065</option>
              <option value="CBE">CBE — Kefale Gedefaw, 1000207193481</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="draftPaymentReference">Transaction reference</label>
            <input id="draftPaymentReference" type="text" maxlength="200"
              [(ngModel)]="listingFeeReference" class="form-control" />
          </div>
        }
        <div class="form-group">
          <label class="form-label" for="draftPaymentTransactionUrl">Payment transaction link</label>
          <input id="draftPaymentTransactionUrl" type="url" maxlength="2048" required
            [(ngModel)]="listingFeeTransactionUrl" class="form-control"
            placeholder="Paste the HTTPS link supplied by your payment provider" />
          <small>Required. Admins will open this exact link to review your transaction.</small>
        </div>
        @if (paymentError) {
          <p class="payment-error" role="alert">{{ paymentError }}</p>
        }
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" (click)="selectedPropForPayment = null" [disabled]="isSubmitting">Cancel</button>
        <button class="btn btn-primary" (click)="confirmSubmitForReview()" [disabled]="isSubmitting || !listingFeeTransactionUrl.trim()">
          {{ isSubmitting ? 'Submitting…' : 'Submit for admin review' }}
        </button>
      </div>
    </div>
  </div>
}

@if (selectedPropForRented) {
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Mark Property as Rented</h3>
        <button class="close-x" (click)="selectedPropForRented = null">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-property-info">
          <strong>{{ selectedPropForRented.title }}</strong><br>
          <span>{{ selectedPropForRented.neighborhood }}, {{ selectedPropForRented.subCity }}</span>
        </p>
        
        <div class="form-group">
          <label class="form-label">Tenant Full Name</label>
          <input type="text" [(ngModel)]="rentedTenantName" class="form-control" placeholder="Enter tenant's full name" />
        </div>
        
        <div class="form-group">
          <label class="form-label">Agreed Monthly Rent (ETB)</label>
          <input type="number" [(ngModel)]="rentedAmountETB" class="form-control" />
        </div>
        
        <div class="form-row">
          <div class="form-group col">
            <label class="form-label">Lease Duration (Months)</label>
            <select [(ngModel)]="rentedLeaseMonths" class="form-control">
              <option [ngValue]="6">6 Months</option>
              <option [ngValue]="12">12 Months</option>
              <option [ngValue]="24">24 Months</option>
              <option [ngValue]="36">36 Months</option>
            </select>
          </div>
          <div class="form-group col">
            <label class="form-label">Tenancy Start Date</label>
            <input type="date" [(ngModel)]="rentedStartDate" class="form-control" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" (click)="selectedPropForRented = null">Cancel</button>
        <button 
          class="btn btn-primary" 
          [disabled]="isSubmitting || !rentedTenantName.trim()" 
          (click)="confirmMarkAsRented()"
        >
          {{ isSubmitting ? 'Saving...' : 'Confirm & Mark as Rented' }}
        </button>
      </div>
    </div>
  </div>
}
`,
  styles: [`.my-properties-page {
  padding: 2.5rem 1.5rem 4rem;
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--secondary);
  margin: 0.375rem 0 0.5rem;
}

.page-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
}

.status-filter-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.filter-chip:hover {
  background: var(--bg-page-alt);
  color: var(--text-secondary);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--text-muted);
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.properties-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.property-list-card {
  display: grid;
  grid-template-columns: 200px 1fr;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.property-list-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

.property-image-section {
  position: relative;
  height: 160px;
}

.property-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-0 { background: #f1f5f9; color: #475569; }
.status-1 { background: #fef3c7; color: #92400e; }
.status-2 { background: #dcfce7; color: #166534; }
.status-3 { background: #fee2e2; color: #991b1b; }
.status-4 { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; }
.status-5 { background: #e0e7ff; color: #3730a3; }
.status-6 { background: #dbeafe; color: #1e40af; }
.status-7 { background: #f1f5f9; color: #475569; }

.property-details-section {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  align-items: center;
}

.property-main-info {
  min-width: 0;
}

.property-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-location {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.property-specs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.spec-item {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.property-price-section {
  text-align: right;
  min-width: 120px;
}

.price-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
}

.price-period {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.price-details {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.property-actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 140px;
}

.btn-action {
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-color);
  background: white;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
  text-decoration: none;
}

.btn-action:hover {
  background: var(--bg-page-alt);
  border-color: #cbd5e1;
}

.btn-action-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
  color: white;
  border: none;
}

.btn-action-primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-action-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}

.btn-action-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
}

.btn-action-danger {
  color: var(--danger);
  border-color: #fecaca;
}

.btn-action-danger:hover {
  background: #fef2f2;
  border-color: var(--danger);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color-light);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--secondary);
}

.close-x {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.close-x:hover {
  background: var(--bg-page-alt);
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-property-info {
  background: var(--bg-page-alt);
  padding: 0.875rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.modal-property-info strong {
  color: var(--secondary);
}

.modal-property-info span {
  color: var(--text-muted);
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: all var(--transition-base);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 2px solid var(--border-color-light);
  background: var(--bg-page-alt);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 2px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline {
  background: white;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.btn-outline:hover {
  background: var(--bg-page-alt);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 968px) {
  .property-list-card {
    grid-template-columns: 1fr;
  }
  
  .property-image-section {
    height: 200px;
  }
  
  .property-details-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .property-price-section {
    text-align: left;
  }
  
  .property-actions-section {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .my-properties-page {
    padding: 1.25rem 0.75rem 2rem;
  }

  .page-header {
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .page-header h1 {
    font-size: 1.6rem;
  }

  .page-header > a {
    width: 100%;
    justify-content: center;
  }

  .status-filter-bar {
    gap: 0.35rem;
    margin-bottom: 1.25rem;
    padding: 0.4rem;
  }

  .filter-chip {
    flex: 1 1 auto;
    padding: 0.45rem 0.65rem;
    font-size: 0.8rem;
  }

  .property-image-section {
    height: 180px;
  }

  .property-details-section {
    padding: 1rem;
  }

  .property-title {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .property-actions-section {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
    min-width: 0;
  }

  .btn-action {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.55rem 0.4rem;
    overflow-wrap: anywhere;
  }

  .modal-card {
    max-height: calc(100dvh - 2rem);
  }

  .modal-header,
  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    flex-wrap: wrap;
    padding: 1rem;
  }
}

@media (max-width: 380px) {
  .my-properties-page {
    padding-right: 0.6rem;
    padding-left: 0.6rem;
  }

  .property-price-section {
    min-width: 0;
  }

  .price-amount {
    font-size: 1.25rem;
  }

  .property-actions-section {
    grid-template-columns: 1fr;
  }
}
.payment-error {
  color: #b91c1c;
  font-size: .875rem;
}

.listing-fee-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  width: fit-content;
  border: 1px solid transparent;
}

.listing-fee-badge.fee-verified {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.listing-fee-badge.fee-pending {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.listing-fee-badge.fee-unpaid {
  background: #f8fafc;
  color: #475569;
  border-color: #cbd5e1;
}

.listing-fee-badge .fee-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
}
`]
})
export class MyPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private changeDetector = inject(ChangeDetectorRef);
  readonly PropertyStatus = PropertyStatus;
  readonly ListingFeeStatus = ListingFeeStatus;

  properties: PropertySummary[] = [];
  selectedStatus?: number = undefined;
  isLoading = true;
  loadError = '';
  isSubmitting = false;

  currentPage = 1;
  pageSize = 5;

  get pagedProperties(): PropertySummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.properties.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectedPropForRented: PropertySummary | null = null;
  selectedPropForPayment: PropertySummary | null = null;
  listingFeeProvider = '';
  listingFeeReference = '';
  listingFeeTransactionUrl = '';
  paymentError = '';
  readonly listingFeeETB = 1000;
  rentedTenantName = '';
  rentedAmountETB = 0;
  rentedLeaseMonths = 12;
  rentedStartDate = '';

  ngOnInit() {
    this.loadProperties();
  }

  setStatus(status?: number) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadProperties();
  }

  loadProperties() {
    this.isLoading = true;
    this.loadError = '';
    this.propertyService.getMyProperties(this.selectedStatus).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.properties = res.data;
        } else {
          this.loadError = res.errors?.join(' ') || 'Your properties could not be loaded.';
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

  submitForReview(id: string) {
    this.selectedPropForPayment = this.properties.find((property) => property.id === id) ?? null;
    this.listingFeeProvider = '';
    this.listingFeeReference = '';
    this.listingFeeTransactionUrl = '';
    this.paymentError = '';
    const selectedProperty = this.selectedPropForPayment;
    if (!selectedProperty) return;

    const feeStatus = this.getFeeStatusCode(selectedProperty);
    if (feeStatus === ListingFeeStatus.Pending || feeStatus === ListingFeeStatus.Verified) {
      this.listingFeeProvider = selectedProperty.listingFeeProvider ?? '';
      this.listingFeeReference = selectedProperty.listingFeeReference ?? '';
      const submittedReference = selectedProperty.listingFeeReference ?? '';
      this.listingFeeTransactionUrl = selectedProperty.listingFeeTransactionUrl
        ?? (this.isValidTransactionUrl(submittedReference) ? submittedReference : '');
    }
  }

  confirmSubmitForReview() {
    if (!this.selectedPropForPayment || !this.listingFeeProvider || !this.listingFeeReference.trim()) {
      this.paymentError = 'Choose a payment method and enter the transaction reference.';
      return;
    }
    if (!this.listingFeeTransactionUrl.trim() || !this.isValidTransactionUrl(this.listingFeeTransactionUrl)) {
      this.paymentError = 'Enter a valid HTTPS transaction link from your payment provider.';
      return;
    }

    this.isSubmitting = true;
    this.propertyService.submitForReview(this.selectedPropForPayment.id, {
      listingFeeProvider: this.listingFeeProvider,
      listingFeeReference: this.listingFeeReference.trim(),
      listingFeeTransactionUrl: this.listingFeeTransactionUrl.trim() || null,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedPropForPayment = null;
        alert('Listing submitted for payment verification and admin review.');
        this.loadProperties();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.paymentError = error.error?.errors?.[0] || 'The listing could not be submitted for review.';
      },
    });
  }

  private isValidTransactionUrl(value: string): boolean {
    if (!value.trim()) return false;
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  toggleAvailability(id: string) {
    this.propertyService.toggleAvailability(id).subscribe({
      next: () => {
        this.loadProperties();
      }
    });
  }

  openRentedModal(prop: PropertySummary) {
    this.selectedPropForRented = prop;
    this.rentedTenantName = '';
    this.rentedAmountETB = prop.rentAmountETB;
    this.rentedLeaseMonths = 12;
    this.rentedStartDate = new Date().toISOString().substring(0, 10);
  }

  confirmMarkAsRented() {
    if (!this.selectedPropForRented) return;
    this.isSubmitting = true;
    this.propertyService.markAsRented(this.selectedPropForRented.id, {
      tenantName: this.rentedTenantName,
      agreedRentAmountETB: this.rentedAmountETB,
      agreedLeaseMonths: this.rentedLeaseMonths,
      tenancyStartDateUtc: new Date(this.rentedStartDate).toISOString()
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.succeeded) {
          this.selectedPropForRented = null;
          this.loadProperties();
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  deleteProperty(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    this.propertyService.deleteProperty(id).subscribe({
      next: () => {
        this.loadProperties();
      }
    });
  }

  getStatusLabel(status: PropertyStatusValue): string {
    const value = enumValueFromApi(PropertyStatus, status);
    return value === undefined ? String(status) : PropertyStatus[value] || String(status);
  }

  getPropertyStatusCode(status: PropertyStatusValue): number | undefined {
    return enumValueFromApi(PropertyStatus, status);
  }

  getFurnishingLabel(furnishing: FurnishingStatusValue): string {
    const value = enumValueFromApi(FurnishingStatus, furnishing);
    return value === undefined
      ? String(furnishing)
      : ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'][value] ?? String(furnishing);
  }

  getFeeStatusCode(property: PropertySummary): number | undefined {
    return property.listingFeeStatus == null
      ? ListingFeeStatus.NotRequired
      : enumValueFromApi(ListingFeeStatus, property.listingFeeStatus);
  }

  getFeeStatusLabel(property: PropertySummary): string {
    const value = this.getFeeStatusCode(property);
    switch (value) {
      case ListingFeeStatus.NotRequired: return 'Unpaid';
      case ListingFeeStatus.Pending: return 'Pending';
      case ListingFeeStatus.Verified: return 'Verified';
      case ListingFeeStatus.Rejected: return 'Rejected';
      default: return `Unknown (${String(property.listingFeeStatus)})`;
    }
  }
}


