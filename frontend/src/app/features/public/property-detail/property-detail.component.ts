import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { Property, PropertyType, FurnishingStatus } from '../../../core/models/property.model';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    @if (isLoading) {
      <div class="container loading-box">
        <p>Loading property details...</p>
      </div>
    } @else if (!property) {
      <div class="container not-found-box">
        <h2>Property Not Found</h2>
        <p>The requested listing could not be found or is no longer available.</p>
        <a routerLink="/properties" class="btn btn-primary">Browse Other Properties</a>
      </div>
    } @else {
      <div class="container detail-container">
        <!-- Top Breadcrumb & Status & Rentola Favorite Heart -->
        <div class="detail-nav">
          <a routerLink="/properties" class="back-link">‹ Back to Search Results</a>
          <div class="nav-right-actions">
            <button 
              class="fav-toggle-btn" 
              [class.favorited]="isFavorited" 
              (click)="toggleFavorite()"
              title="Save to Favorites"
            >
              ♥ {{ isFavorited ? 'Saved in Favorites' : 'Save to Favorites' }}
            </button>
            <div class="nav-tags">
              <span class="badge badge-green">{{ getTypeName(property.propertyType) }}</span>
              @if (property.advanceMonthsRequired > 0) {
                <span class="badge badge-amber">{{ property.advanceMonthsRequired }} Mo. Advance Required</span>
              }
            </div>
          </div>
        </div>

        <h1 class="property-headline">{{ property.title }}</h1>
        <p class="property-location-sub">
          📍 {{ property.neighborhood }}, {{ property.subCity }}, {{ property.city }}
          @if (property.landmark) {
            <span class="landmark">({{ property.landmark }})</span>
          }
        </p>

        <!-- Feedback Alert -->
        @if (feedbackMessage) {
          <div class="alert-banner" [class.success]="feedbackSuccess">
            {{ feedbackMessage }}
          </div>
        }

        <!-- Image Gallery Showcase -->
        <div class="gallery-wrapper">
          <div class="main-image-container">
            <img [src]="activeImageUrl" [alt]="property.title" class="main-gallery-img" />
          </div>
          @if (property.imageUrls.length > 1) {
            <div class="thumbnail-strip">
              @for (img of property.imageUrls; track $index) {
                <img 
                  [src]="img" 
                  [class.active]="activeImageUrl === img" 
                  (click)="activeImageUrl = img"
                  class="thumb-img" 
                  alt="Thumbnail"
                />
              }
            </div>
          }
        </div>

        <!-- Two Column Content Layout -->
        <div class="detail-columns">
          <!-- Left Column: Specs, Description, Amenities -->
          <div class="detail-main">
            <!-- Key Specs Bar -->
            <div class="specs-ribbon">
              <div class="spec-cell">
                <span class="spec-val">{{ property.bedrooms }}</span>
                <span class="spec-lbl">Bedrooms</span>
              </div>
              <div class="spec-cell">
                <span class="spec-val">{{ property.bathrooms }}</span>
                <span class="spec-lbl">Bathrooms</span>
              </div>
              <div class="spec-cell">
                <span class="spec-val">{{ property.areaSquareMeters || '—' }} m²</span>
                <span class="spec-lbl">Floor Area</span>
              </div>
              <div class="spec-cell">
                <span class="spec-val">{{ getFurnishingName(property.furnishing) }}</span>
                <span class="spec-lbl">Furnishing</span>
              </div>
            </div>

            <!-- Description -->
            <div class="content-block">
              <h3>About this Property</h3>
              <p class="description-text">{{ property.description }}</p>
            </div>

            <!-- Ethiopian Amenities Grid -->
            <div class="content-block">
              <h3>Amenities & Infrastructure</h3>
              <div class="amenities-grid">
                <div class="amenity-item" [class.included]="property.hasWaterTank">
                  <span class="amenity-icon">💧</span>
                  <span>Reserve Water Tank (Rotto)</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasGenerator">
                  <span class="amenity-icon">⚡</span>
                  <span>Standby Backup Generator</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasSecurityGuard">
                  <span class="amenity-icon">🛡️</span>
                  <span>Compound Security Guard</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasParking">
                  <span class="amenity-icon">🚗</span>
                  <span>Dedicated Vehicle Parking</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasElevator">
                  <span class="amenity-icon">🛗</span>
                  <span>Passenger Elevator</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasWifi">
                  <span class="amenity-icon">📶</span>
                  <span>High-Speed Wi-Fi</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasBalcony">
                  <span class="amenity-icon">🌅</span>
                  <span>Private Balcony / Veranda</span>
                </div>
                <div class="amenity-item" [class.included]="property.waterBillIncluded">
                  <span class="amenity-icon">🚰</span>
                  <span>Water Bill Included in Rent</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Host & Pricing Card -->
          <div class="detail-sidebar">
            <div class="pricing-card">
              <!-- Price header -->
              <div class="price-header">
                <div class="price-big">
                  {{ property.rentAmountETB | number }} <span class="cur">ETB</span>
                  <span class="period">/ month</span>
                </div>
                <div class="price-subtitle">{{ property.advanceMonthsRequired }} months advance required</div>
              </div>

              <!-- Ethiopian Financial Breakdown -->
              <div class="card-section">
                <div class="breakdown-list">
                  <div class="breakdown-item">
                    <span>Advance Payment</span>
                    <strong>{{ property.advanceMonthsRequired }} mo. ({{ (property.rentAmountETB * property.advanceMonthsRequired) | number }} ETB)</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Security Deposit</span>
                    <strong>{{ property.depositAmountETB | number }} ETB</strong>
                  </div>
                  <div class="breakdown-item">
                    <span>Minimum Lease</span>
                    <strong>{{ property.minimumLeaseMonths }} Months</strong>
                  </div>
                </div>
                <div class="total-row">
                  <span>Move-in Total</span>
                  <span class="total-amount">{{ ((property.rentAmountETB * property.advanceMonthsRequired) + property.depositAmountETB) | number }} ETB</span>
                </div>
              </div>

              <!-- Host Info -->
              <div class="card-section">
                <div class="host-box">
                  <div class="host-avatar">
                    {{ property.landlordName.charAt(0) }}
                  </div>
                  <div class="host-details">
                    <div class="host-name">{{ property.landlordName }}</div>
                    <div class="host-badge">
                      {{ property.isVerifiedHost ? '✓ Verified Host' : 'Property Landlord' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="card-actions">
                @if (phoneRevealed) {
                  <div class="phone-box">
                    <span>Direct Phone / WhatsApp:</span>
                    <strong>{{ property.landlordPhone }}</strong>
                  </div>
                } @else {
                  <button class="btn btn-outline btn-block" (click)="revealPhone()">
                    📞 Show Contact Number
                  </button>
                }

                <button class="btn btn-primary btn-block" (click)="openInquiryModal()">
                  ✉️ Send Direct Inquiry
                </button>

                <button class="btn btn-secondary btn-block" (click)="openAppointmentModal()">
                  📅 Book a Viewing Tour
                </button>

                <button class="btn btn-apply btn-block" (click)="openApplicationModal()">
                  📝 Apply to Rent Property
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= Modal 1: Send Direct Inquiry ================= -->
      @if (isInquiryModalOpen) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Direct Inquiry to {{ property.landlordName }}</h3>
              <button class="close-x" (click)="isInquiryModalOpen = false">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Regarding listing: <strong>{{ property.title }}</strong> ({{ property.rentAmountETB | number }} ETB/mo)
              </p>

              <!-- Quick Templates -->
              <label class="input-label">Quick Suggestions:</label>
              <div class="quick-chips">
                <button type="button" class="chip" (click)="setInquiryTemplate(1)">Is this property still available?</button>
                <button type="button" class="chip" (click)="setInquiryTemplate(2)">Can we negotiate on 3 months advance?</button>
                <button type="button" class="chip" (click)="setInquiryTemplate(3)">Are utility bills included in rent?</button>
              </div>

              <div class="form-group">
                <label class="input-label">Your Message:</label>
                <textarea 
                  [(ngModel)]="inquiryMessage" 
                  rows="4" 
                  class="form-control" 
                  placeholder="Introduce yourself and specify your preferred move-in timeline..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="isInquiryModalOpen = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="isSubmitting || !inquiryMessage.trim()" 
                (click)="submitInquiry()"
              >
                {{ isSubmitting ? 'Sending...' : 'Send Message' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================= Modal 2: Book Viewing Tour ================= -->
      @if (isAppointmentModalOpen) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Schedule a Viewing Tour</h3>
              <button class="close-x" (click)="isAppointmentModalOpen = false">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Select your preferred date & time to visit <strong>{{ property.title }}</strong> in {{ property.subCity }}.
              </p>

              <div class="form-group">
                <label class="input-label">Preferred Date & Time:</label>
                <input 
                  type="datetime-local" 
                  [(ngModel)]="appointmentDateTime" 
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label class="input-label">Special Notes / Availability:</label>
                <textarea 
                  [(ngModel)]="appointmentNotes" 
                  rows="3" 
                  class="form-control" 
                  placeholder="e.g., Saturday afternoon is best for me, or call 30 mins before arrival..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="isAppointmentModalOpen = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="isSubmitting || !appointmentDateTime" 
                (click)="submitAppointment()"
              >
                {{ isSubmitting ? 'Requesting...' : 'Request Tour Appointment' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================= Modal 3: Rental Application ================= -->
      @if (isApplicationModalOpen) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Formal Rental Application</h3>
              <button class="close-x" (click)="isApplicationModalOpen = false">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Apply directly to rent <strong>{{ property.title }}</strong>. The host will review your profile.
              </p>

              <div class="grid-2-col">
                <div class="form-group">
                  <label class="input-label">Proposed Move-In Date:</label>
                  <input type="date" [(ngModel)]="appMoveInDate" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="input-label">Lease Duration (Months):</label>
                  <select [(ngModel)]="appLeaseMonths" class="form-control">
                    <option [ngValue]="6">6 Months</option>
                    <option [ngValue]="12">12 Months (1 Year)</option>
                    <option [ngValue]="24">24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">Number of Occupants:</label>
                <input type="number" min="1" max="10" [(ngModel)]="appOccupants" class="form-control" />
              </div>

              <div class="form-group">
                <label class="input-label">Employment / Income Verification Statement:</label>
                <textarea 
                  [(ngModel)]="appIncomeSummary" 
                  rows="3" 
                  class="form-control" 
                  placeholder="e.g. Employed at Ethiopian Airlines / NGO / Tech firm with steady monthly income..."
                ></textarea>
              </div>

              <div class="form-group">
                <label class="input-label">Additional Notes for Landlord:</label>
                <textarea 
                  [(ngModel)]="appNotes" 
                  rows="2" 
                  class="form-control" 
                  placeholder="Any preferences or additional comments..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="isApplicationModalOpen = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="isSubmitting || !appIncomeSummary.trim()" 
                (click)="submitApplication()"
              >
                {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    /* ── Page shell ── */
    .detail-container {
      padding: 2rem 1.5rem 5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-box, .not-found-box {
      padding: 6rem 1.5rem;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }

    .not-found-box h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.75rem;
    }

    .not-found-box p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    /* ── Top nav bar ── */
    .detail-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      transition: all var(--transition-fast);
    }

    .back-link:hover {
      border-color: var(--primary);
      color: var(--primary-dark);
      background: var(--primary-lighter);
    }

    .nav-right-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .fav-toggle-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--transition-base);
    }

    .fav-toggle-btn:hover { border-color: #f43f5e; color: #f43f5e; }
    .fav-toggle-btn.favorited { background: #ffe4e6; border-color: #f43f5e; color: #e11d48; }

    .nav-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    /* ── Headline ── */
    .property-headline {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.5rem;
      line-height: 1.25;
    }

    .property-location-sub {
      color: var(--text-muted);
      font-size: 0.925rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .landmark { color: var(--primary); font-weight: 600; }

    /* ── Feedback banner ── */
    .alert-banner {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      color: #1e40af;
      padding: 0.875rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .alert-banner.success {
      background: #ecfdf5;
      border-color: #6ee7b7;
      color: #065f46;
    }

    /* ── Gallery ── */
    .gallery-wrapper {
      margin-bottom: 2rem;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .main-image-container {
      width: 100%;
      height: 460px;
      background: var(--secondary-light);
      overflow: hidden;
      cursor: zoom-in;
    }

    .main-gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .main-image-container:hover .main-gallery-img { transform: scale(1.02); }

    .thumbnail-strip {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .thumbnail-strip::-webkit-scrollbar { height: 4px; }
    .thumbnail-strip::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }

    .thumb-img {
      width: 96px;
      height: 66px;
      object-fit: cover;
      border-radius: var(--radius-sm);
      cursor: pointer;
      opacity: 0.55;
      border: 2px solid transparent;
      transition: all var(--transition-base);
      flex-shrink: 0;
    }

    .thumb-img.active, .thumb-img:hover {
      opacity: 1;
      border-color: var(--primary);
    }

    /* ── Two-column layout ── */
    .detail-columns {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    /* ── Specs ribbon ── */
    .specs-ribbon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-xs);
    }

    .spec-cell {
      padding: 1.25rem 1rem;
      text-align: center;
      border-right: 1px solid var(--border-color-light);
    }

    .spec-cell:last-child { border-right: none; }

    .spec-val {
      display: block;
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--secondary);
      line-height: 1.1;
    }

    .spec-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
      display: block;
    }

    /* ── Content blocks ── */
    .content-block {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow-xs);
    }

    .content-block h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .description-text {
      line-height: 1.75;
      color: var(--text-secondary);
      white-space: pre-line;
      font-size: 0.925rem;
    }

    /* ── Amenities grid ── */
    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.625rem;
    }

    .amenity-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      background: var(--bg-page);
      color: var(--text-light);
      font-size: 0.875rem;
      border: 1px solid var(--border-color-light);
      text-decoration: line-through;
      text-decoration-color: var(--border-color);
      opacity: 0.6;
    }

    .amenity-item.included {
      background: var(--primary-lighter);
      color: var(--primary-dark);
      font-weight: 600;
      border-color: rgba(16,185,129,0.2);
      text-decoration: none;
      opacity: 1;
    }

    .amenity-icon { font-size: 1.1rem; flex-shrink: 0; }

    /* ── Sticky pricing card ── */
    .detail-sidebar { position: sticky; top: 80px; }

    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 0;
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    /* price header band */
    .price-header {
      padding: 1.5rem 1.5rem 1.25rem;
      background: linear-gradient(135deg, var(--primary-lighter), #ffffff);
      border-bottom: 1px solid rgba(16,185,129,0.15);
    }

    .price-big {
      font-size: 2.1rem;
      font-weight: 900;
      color: var(--secondary);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .price-big .cur {
      color: var(--primary);
      font-size: 1.3rem;
    }

    .price-big .period {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 400;
    }

    .price-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* breakdown */
    .card-section { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color-light); }

    .breakdown-list { display: flex; flex-direction: column; gap: 0.625rem; }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .breakdown-item span { color: var(--text-muted); }

    .breakdown-item strong {
      color: var(--secondary);
      font-weight: 700;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      margin-top: 0.25rem;
      border-top: 2px solid var(--border-color);
      font-weight: 700;
      color: var(--secondary);
      font-size: 0.9rem;
    }

    .total-amount { color: var(--primary); font-size: 1.1rem; }

    /* host box */
    .host-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .host-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.15rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(16,185,129,0.3);
    }

    .host-name { font-weight: 700; color: var(--secondary); font-size: 0.925rem; }
    .host-badge { font-size: 0.78rem; color: var(--primary); font-weight: 600; }

    /* actions */
    .card-actions {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .btn-block {
      width: 100%;
      padding: 0.8rem;
      font-size: 0.9rem;
    }

    .btn-secondary {
      background: var(--secondary-light);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-secondary:hover { background: var(--secondary); transform: translateY(-1px); }

    .btn-apply {
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-apply:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(2,132,199,0.35); }

    .phone-box {
      background: var(--primary-lighter);
      padding: 0.875rem;
      border-radius: var(--radius-sm);
      text-align: center;
      color: var(--primary-dark);
      border: 1px dashed var(--primary);
    }

    .phone-box strong {
      display: block;
      font-size: 1.15rem;
      margin-top: 0.25rem;
      letter-spacing: 0.02em;
    }

    /* ── Modal Styling ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      max-width: 540px;
      width: 100%;
      box-shadow: var(--shadow-2xl);
      overflow: hidden;
      animation: slideUp 0.25s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--secondary);
      margin: 0;
    }

    .close-x {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      transition: color var(--transition-fast);
      line-height: 1;
    }

    .close-x:hover { color: var(--danger); }

    .modal-body {
      padding: 1.5rem;
      max-height: 72vh;
      overflow-y: auto;
    }

    .modal-sub {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
      padding: 0.75rem;
      background: var(--bg-page);
      border-radius: var(--radius-sm);
    }

    .input-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
      color: var(--secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-group { margin-bottom: 1rem; }

    .grid-2-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .quick-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .chip {
      background: var(--bg-page);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
    }

    .chip:hover {
      border-color: var(--primary);
      background: var(--primary-lighter);
      color: var(--primary-dark);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-page);
    }

    /* ── Badge overrides ── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    .badge-green { background: var(--primary-light); color: var(--primary-dark); }
    .badge-amber { background: #fef3c7; color: #92400e; }

    /* ── Responsive ── */
    @media (max-width: 960px) {
      .detail-columns {
        grid-template-columns: 1fr;
      }

      .detail-sidebar {
        position: static;
        order: -1; /* contact card floats to top on mobile */
      }

      .specs-ribbon { grid-template-columns: repeat(2, 1fr); }
      .spec-cell:nth-child(2) { border-right: none; }
      .spec-cell:nth-child(3) { border-right: 1px solid var(--border-color-light); border-top: 1px solid var(--border-color-light); }
      .spec-cell:nth-child(4) { border-top: 1px solid var(--border-color-light); border-right: none; }
    }

    @media (max-width: 640px) {
      .property-headline { font-size: 1.45rem; }
      .main-image-container { height: 280px; }
      .detail-container { padding: 1rem 1rem 4rem; }
      .grid-2-col { grid-template-columns: 1fr; }
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interactionService = inject(InteractionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  property: Property | null = null;
  activeImageUrl: string = '';
  isLoading = true;
  phoneRevealed = false;
  isSubmitting = false;

  feedbackMessage = '';
  feedbackSuccess = true;

  // Modals state
  isInquiryModalOpen = false;
  inquiryMessage = '';

  isAppointmentModalOpen = false;
  appointmentDateTime = '';
  appointmentNotes = '';

  isApplicationModalOpen = false;
  appMoveInDate = '';
  appLeaseMonths = 12;
  appOccupants = 1;
  appIncomeSummary = '';
  appNotes = '';

  get isFavorited(): boolean {
    return this.property ? this.interactionService.isFavorited(this.property.id) : false;
  }

  ngOnInit() {
    // If logged in, ensure favorites cache is loaded
    if (this.authService.currentUser()) {
      this.interactionService.loadFavorites().subscribe();
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyService.getById(id).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.succeeded && res.data) {
            this.property = res.data;
            this.activeImageUrl = this.property.primaryImageUrl || (this.property.imageUrls[0] ?? '');
            
            // Set default date for application to property's availableFromDate
            this.appMoveInDate = new Date().toISOString().substring(0, 10);
          }
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  toggleFavorite() {
    if (!this.property) return;
    if (!this.authService.currentUser()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/properties/${this.property.id}` } });
      return;
    }
    this.interactionService.toggleFavorite(this.property.id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.showFeedback(res.data ? 'Added to your favorites list!' : 'Removed from favorites.', true);
        }
      }
    });
  }

  revealPhone() {
    this.phoneRevealed = true;
  }

  openInquiryModal() {
    if (!this.checkAuth()) return;
    this.isInquiryModalOpen = true;
  }

  setInquiryTemplate(type: number) {
    if (type === 1) {
      this.inquiryMessage = `Hello ${this.property?.landlordName}, I am very interested in this listing. Is it still available for rent?`;
    } else if (type === 2) {
      this.inquiryMessage = `Hello ${this.property?.landlordName}, would it be possible to arrange a 3-month advance payment structure for this property?`;
    } else if (type === 3) {
      this.inquiryMessage = `Hello, I'd like to clarify if water and electricity bills are included in the quoted rent amount. Thank you!`;
    }
  }

  submitInquiry() {
    if (!this.property || !this.inquiryMessage.trim()) return;
    this.isSubmitting = true;
    this.interactionService.createInquiry({
      propertyId: this.property.id,
      message: this.inquiryMessage.trim()
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.isInquiryModalOpen = false;
        this.inquiryMessage = '';
        if (res.succeeded) {
          this.showFeedback('Your inquiry was delivered to the host successfully!', true);
        } else {
          this.showFeedback(res.errors?.[0] || 'Failed to send inquiry.', false);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showFeedback(err?.error?.errors?.[0] || 'Error sending inquiry.', false);
      }
    });
  }

  openAppointmentModal() {
    if (!this.checkAuth()) return;
    this.isAppointmentModalOpen = true;
  }

  submitAppointment() {
    if (!this.property || !this.appointmentDateTime) return;
    this.isSubmitting = true;
    this.interactionService.requestAppointment({
      propertyId: this.property.id,
      requestedDateTimeUtc: new Date(this.appointmentDateTime).toISOString(),
      renterNotes: this.appointmentNotes
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.isAppointmentModalOpen = false;
        this.appointmentNotes = '';
        if (res.succeeded) {
          this.showFeedback('Viewing tour request submitted! The host will confirm the visit.', true);
        } else {
          this.showFeedback(res.errors?.[0] || 'Failed to book appointment.', false);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showFeedback(err?.error?.errors?.[0] || 'Error requesting tour.', false);
      }
    });
  }

  openApplicationModal() {
    if (!this.checkAuth()) return;
    this.isApplicationModalOpen = true;
  }

  submitApplication() {
    if (!this.property || !this.appIncomeSummary.trim()) return;
    this.isSubmitting = true;
    this.interactionService.submitApplication({
      propertyId: this.property.id,
      proposedMoveInDate: new Date(this.appMoveInDate).toISOString(),
      proposedLeaseDurationMonths: this.appLeaseMonths,
      proposedOccupantsCount: this.appOccupants,
      employmentOrIncomeSummary: this.appIncomeSummary.trim(),
      additionalNotes: this.appNotes.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.isApplicationModalOpen = false;
        if (res.succeeded) {
          this.showFeedback('Rental application submitted successfully! The landlord will review your background.', true);
        } else {
          this.showFeedback(res.errors?.[0] || 'Failed to submit application.', false);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showFeedback(err?.error?.errors?.[0] || 'Error submitting application.', false);
      }
    });
  }

  private checkAuth(): boolean {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/properties/${this.property?.id}` } });
      return false;
    }
    return true;
  }

  private showFeedback(msg: string, success: boolean) {
    this.feedbackMessage = msg;
    this.feedbackSuccess = success;
    setTimeout(() => {
      this.feedbackMessage = '';
    }, 6000);
  }

  getTypeName(type: PropertyType): string {
    return PropertyType[type] || 'Property';
  }

  getFurnishingName(furnishing: FurnishingStatus): string {
    return FurnishingStatus[furnishing] || 'Unfurnished';
  }
}
