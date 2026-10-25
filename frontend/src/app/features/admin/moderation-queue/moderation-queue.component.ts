import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { PropertySummary } from '../../../core/models/property.model';

@Component({
  selector: 'app-moderation-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
              <span class="stat-value">{{ pendingListings.length }}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">Today</span>
              <span class="stat-value">{{ todayCount }}</span>
            </div>
          </div>
          <div class="user-avatar">
            <span>Admin</span>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="admin-content">
          @if (isLoading) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading moderation queue...</p>
            </div>
          } @else if (pendingListings.length === 0) {
            <div class="empty-state">
              <div class="empty-illustration">
                <span class="empty-emoji">🎉</span>
              </div>
              <h2>All Clear!</h2>
              <p>No listings pending review. Great job keeping the platform clean!</p>
              <button class="btn btn-outline" (click)="loadPending()">
                <span>🔄</span> Refresh Queue
              </button>
            </div>
          } @else {
            <div class="moderation-grid">
              @for (prop of pendingListings; track prop.id) {
                <div class="listing-card">
                  <div class="card-image">
                    <img [src]="prop.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'" alt="Property" />
                    <div class="image-overlay">
                      <span class="status-badge pending">Pending Review</span>
                    </div>
                  </div>

                  <div class="card-body">
                    <div class="card-header">
                      <h3>{{ prop.title }}</h3>
                      <div class="property-type">{{ prop.propertyType }}</div>
                    </div>

                    <div class="card-location">
                      <span class="location-icon">📍</span>
                      <span>{{ prop.neighborhood }}, {{ prop.subCity }}</span>
                    </div>

                    <div class="card-price">
                      <div class="price-main">
                        <span class="price-amount">{{ prop.rentAmountETB | number }}</span>
                        <span class="price-currency">ETB</span>
                        <span class="price-period">/month</span>
                      </div>
                      <div class="price-details">
                        <span>{{ prop.advanceMonthsRequired }} months advance</span>
                      </div>
                    </div>

                    <div class="card-specs">
                      <div class="spec-item">
                        <span class="spec-icon">🛏️</span>
                        <span>{{ prop.bedrooms }} Beds</span>
                      </div>
                      <div class="spec-item">
                        <span class="spec-icon">🚿</span>
                        <span>{{ prop.bathrooms }} Baths</span>
                      </div>
                      <div class="spec-item">
                        <span class="spec-icon">📐</span>
                        <span>{{ prop.areaSquareMeters }} m²</span>
                      </div>
                    </div>

                    <div class="card-landlord">
                      <div class="landlord-avatar">
                        <span>{{ prop.landlordName?.charAt(0) || 'L' }}</span>
                      </div>
                      <div class="landlord-details">
                        <span class="landlord-name">{{ prop.landlordName }}</span>
                        <span class="landlord-label">Landlord</span>
                      </div>
                    </div>

                    <div class="card-actions">
                      <button class="action-btn approve" (click)="approve(prop.id)">
                        <span class="btn-icon">✓</span>
                        <span>Approve</span>
                      </button>
                      <button class="action-btn reject" (click)="openRejectModal(prop)">
                        <span class="btn-icon">✕</span>
                        <span>Reject</span>
                      </button>
                      <a [routerLink]="['/properties', prop.id]" target="_blank" class="action-btn view">
                        <span class="btn-icon">👁</span>
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Rejection Modal -->
      @if (selectedForRejection) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3>Reject Listing</h3>
            <p>Specify the reason category and guidelines for the landlord to correct.</p>

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
              <button class="btn btn-danger" (click)="confirmReject()">Confirm Rejection</button>
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
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

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
  `]
})
export class ModerationQueueComponent implements OnInit {
  private propertyService = inject(PropertyService);

  pendingListings: PropertySummary[] = [];
  isLoading = true;
  todayCount = 0;

  selectedForRejection: PropertySummary | null = null;
  rejectionCategory = 'UnrealisticPricing';
  rejectionReason = '';

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.isLoading = true;
    this.propertyService.getPendingModeration().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.pendingListings = res.data.items;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  approve(id: string) {
    this.propertyService.moderateListing(id, { approved: true }).subscribe({
      next: () => {
        alert('Listing successfully approved and published to public search!');
        this.loadPending();
      }
    });
  }

  openRejectModal(prop: PropertySummary) {
    this.selectedForRejection = prop;
    this.rejectionReason = '';
  }

  confirmReject() {
    if (!this.selectedForRejection) return;

    this.propertyService.moderateListing(this.selectedForRejection.id, {
      approved: false,
      rejectionCategory: this.rejectionCategory,
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        alert('Listing has been rejected with feedback recorded.');
        this.selectedForRejection = null;
        this.loadPending();
      }
    });
  }
}
