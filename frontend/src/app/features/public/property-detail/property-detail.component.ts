import { resolveImageUrl } from '../../../core/config/api.config';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { Property, PropertySummary, PropertyType, PropertyTypeValue, FurnishingStatus, FurnishingStatusValue } from '../../../core/models/property.model';
import { enumValueFromApi } from '../../../core/models/api-enum.util';
import { Entitlement } from '../../../core/models/subscription.model';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';
import { ReportCategory } from '../../../core/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { SubscriptionComponent } from '../../subscription/subscription.component';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PropertyCardComponent, SubscriptionComponent],
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
        <!-- Image Gallery Showcase -->
        <div class="gallery-wrapper">
          <div class="main-image-container">
            @if (activeImageUrl) {
              <img
                [src]="activeImageUrl"
                [alt]="property.title"
                class="main-gallery-img"
                fetchpriority="high"
                decoding="async"
              />
            } @else {
              <div class="image-placeholder">
                <span class="material-icons-outlined" aria-hidden="true">image</span>
                <span>No property photos available</span>
              </div>
            }
            @if (galleryImages.length > 1) {
              <button class="gallery-arrow gallery-previous" type="button" aria-label="Previous photo" (click)="showPreviousImage()">
                <span class="material-icons-outlined" aria-hidden="true">chevron_left</span>
              </button>
              <button class="gallery-arrow gallery-next" type="button" aria-label="Next photo" (click)="showNextImage()">
                <span class="material-icons-outlined" aria-hidden="true">chevron_right</span>
              </button>
              <span class="gallery-count">{{ activeImageIndex + 1 }} / {{ galleryImages.length }} photos</span>
            }
          </div>
          @if (galleryImages.length > 1) {
            <div class="thumbnail-strip">
              @for (img of galleryImages; track img; let index = $index) {
                <button
                  type="button"
                  class="thumbnail-button"
                  [class.active]="activeImageIndex === index"
                  [attr.aria-label]="'Show property photo ' + (index + 1)"
                  [attr.aria-pressed]="activeImageIndex === index"
                  (click)="showImage(index)"
                >
                  <img
                    [src]="img"
                    class="thumb-img"
                    [alt]="'Property photo ' + (index + 1)"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              }
            </div>
          }
        </div>

        <!-- Top Breadcrumb & Status & Rentola Favorite Heart -->
        <div class="detail-nav">
          <a routerLink="/properties" class="back-link"><span class="material-icons-outlined" aria-hidden="true">chevron_left</span> Back to Search Results</a>
          <div class="nav-right-actions">
            <button
              class="fav-toggle-btn"
              [class.favorited]="isFavorited"
              (click)="toggleFavorite()"
              title="Save to Favorites"
            >
              <span class="material-icons-outlined" aria-hidden="true">{{ isFavorited ? 'favorite' : 'favorite_border' }}</span>
              {{ isFavorited ? 'Saved in Favorites' : 'Save to Favorites' }}
            </button>
            <div class="nav-tags">
              <span class="badge badge-green">{{ getTypeName(property.propertyType) }}</span>
              @if (property.advanceMonthsRequired > 0) {
                <span class="badge badge-amber"
                  >{{ property.advanceMonthsRequired }} Mo. Advance Required</span
                >
              }
            </div>
          </div>
        </div>

        <h1 class="property-headline">{{ property.title }}</h1>
        <p class="property-location-sub">
          <span class="material-icons-outlined" aria-hidden="true">location_on</span>
          {{ property.neighborhood }}, {{ property.subCity }}, {{ property.city }}
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

            @if (property.videoUrl) {
              <div class="content-block">
                <h3>Property video</h3>
                @if (tiktokEmbedUrl; as embedUrl) {
                  <div class="video-embed">
                    <iframe
                      [src]="embedUrl"
                      [title]="'TikTok video for ' + property.title"
                      loading="lazy"
                      allow="fullscreen"
                      referrerpolicy="strict-origin-when-cross-origin"
                    ></iframe>
                  </div>
                }
                <a class="video-external-link" [href]="property.videoUrl" target="_blank"
                  rel="noopener noreferrer">Watch on TikTok <span class="material-icons-outlined" aria-hidden="true">open_in_new</span></a>
              </div>
            }

            <!-- Ethiopian Amenities Grid -->
            <div class="content-block">
              <h3>Amenities & Infrastructure</h3>
              <div class="amenities-grid">
                <div class="amenity-item" [class.included]="property.hasWaterTank">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">water_drop</span>
                  <span>Reserve Water Tank (Rotto)</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasGenerator">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">bolt</span>
                  <span>Standby Backup Generator</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasSecurityGuard">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">shield</span>
                  <span>Compound Security Guard</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasParking">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">directions_car</span>
                  <span>Dedicated Vehicle Parking</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasElevator">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">elevator</span>
                  <span>Passenger Elevator</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasWifi">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">wifi</span>
                  <span>High-Speed Wi-Fi</span>
                </div>
                <div class="amenity-item" [class.included]="property.hasBalcony">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">balcony</span>
                  <span>Private Balcony / Veranda</span>
                </div>
                <div class="amenity-item" [class.included]="property.waterBillIncluded">
                  <span class="amenity-icon material-icons-outlined" aria-hidden="true">water</span>
                  <span>Water Bill Included in Rent</span>
                </div>
              </div>
            </div>

            <section class="content-block details-block" aria-labelledby="property-details-title">
              <h3 id="property-details-title">Property details</h3>
              <dl class="property-details-grid">
                @for (detail of propertyDetails; track detail.label) {
                  <div class="property-detail-row">
                    <dt>{{ detail.label }}</dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                  }
              </dl>
            </section>

            <section class="content-block map-block" aria-labelledby="property-map-title">
              <h3 id="property-map-title">Location</h3>
              <p class="map-caption">
                {{ property.neighborhood }}, {{ property.subCity }}, {{ property.city }}{{ property.region ? ', ' + property.region : '' }}
              </p>
              @if (mapEmbedUrl; as mapUrl) {
                <iframe
                  class="property-map"
                  [src]="mapUrl"
                  title="Map showing the property location"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                ></iframe>
              } @else {
                <div class="map-unavailable">
                  <span class="material-icons-outlined" aria-hidden="true">map</span>
                  <span>The landlord has not provided map coordinates for this listing.</span>
                </div>
              }
              <a class="map-link" [href]="mapSearchUrl" target="_blank" rel="noopener noreferrer">
                Open location in OpenStreetMap
                <span class="material-icons-outlined" aria-hidden="true">open_in_new</span>
              </a>
            </section>
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
                <div class="price-subtitle">
                  {{ property.advanceMonthsRequired }} months advance required
                </div>

              </div>

              <!-- Ethiopian Financial Breakdown -->
              <div class="card-section">
                <div class="breakdown-list">
                  <div class="breakdown-item">
                    <span>Advance Payment</span>
                    <strong
                      >{{ property.advanceMonthsRequired }} mo. ({{
                        property.rentAmountETB * property.advanceMonthsRequired | number
                      }}
                      ETB)</strong
                    >
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
                  <span class="total-amount"
                    >{{
                      property.rentAmountETB * property.advanceMonthsRequired +
                        property.depositAmountETB | number
                    }}
                    ETB</span
                  >
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

              <!-- Contact -->
              <div class="card-actions">
                @if (contactEntitlementLoading()) {
                  <div class="phone-box"><span>Checking Premium access…</span></div>
                } @else if (contactEntitlementError(); as message) {
                  <div class="phone-box"><span>{{ message }}</span></div>
                  <button class="btn btn-outline btn-block" type="button" (click)="loadContactEntitlement()">
                    Check Premium access again
                  </button>
                } @else if (contactEntitlement()?.isPremium && property.landlordPhone) {
                  <div class="phone-box">
                    <span>Phone / WhatsApp</span>
                    <a [href]="'tel:' + property.landlordPhone"><strong>{{ property.landlordPhone }}</strong></a>
                    @if (property.landlordEmail) {
                      <a [href]="'mailto:' + property.landlordEmail">{{ property.landlordEmail }}</a>
                    }
                  </div>
                } @else if (contactEntitlement()?.isPremium && !property.landlordPhone && !property.landlordEmail) {
                  <div class="phone-box"><span>The host has not provided direct contact details.</span></div>
                } @else if (property.contactLocked) {
                  <div class="phone-box">
                    @if (authService.isAuthenticated()) {
                      <span>Phone and email are included with Premium.</span>
                    } @else {
                      <span>Sign in to message the landlord.</span>
                    }
                  </div>
                  @if (authService.isAuthenticated()) {
                    <button
                      type="button"
                      class="btn btn-outline btn-block"
                      aria-haspopup="dialog"
                      aria-controls="premium-checkout-dialog"
                      [attr.aria-expanded]="showPremiumCheckout()"
                      (click)="showPremiumCheckout.set(true)"
                    >
                      See Premium plans
                    </button>
                  } @else {
                    <a
                      routerLink="/login"
                      [queryParams]="{ returnUrl: '/properties/' + property.id }"
                      class="btn btn-outline btn-block"
                      >Sign in</a
                    >
                  }
                } @else {
                  <div class="phone-box">
                    <span>Phone / WhatsApp</span>
                    @if (property.landlordPhone) {
                      <a [href]="'tel:' + property.landlordPhone"><strong>{{ property.landlordPhone }}</strong></a>
                    } @else {
                      <strong>Not provided</strong>
                    }
                    @if (property.landlordEmail) {
                      <a [href]="'mailto:' + property.landlordEmail">{{ property.landlordEmail }}</a>
                    }
                  </div>
                }

                <button class="btn btn-primary btn-block" [disabled]="contactEntitlementLoading()" (click)="openInquiryModal()">
                  <span class="material-icons-outlined" aria-hidden="true">mail</span> Send message
                </button>
                <button class="btn btn-secondary btn-block" [disabled]="contactEntitlementLoading()" (click)="openAppointmentModal()">
                  <span class="material-icons-outlined" aria-hidden="true">calendar_month</span> Book a viewing
                </button>
                <button class="btn btn-apply btn-block" [disabled]="contactEntitlementLoading()" (click)="openApplicationModal()">
                  <span class="material-icons-outlined" aria-hidden="true">description</span> Apply to rent
                </button>
                <button class="btn btn-outline btn-block" (click)="notifySimilar()">
                  <span class="material-icons-outlined" aria-hidden="true">notifications</span> Notify me of similar homes
                </button>
              </div>
            </div>
            <div class="report-prompt">
              <span class="material-icons-outlined" aria-hidden="true">flag</span>
              <span>Any concerns about this listing?</span>
              <button type="button" (click)="openReportModal()">Report it to our team</button>
              @if (reportFeedback(); as message) {
                <p role="status">{{ message }}</p>
              }
            </div>
          </div>
        </div>
      </div>

      <section class="related-section" aria-labelledby="related-title">
        <div class="related-heading">
          <div>
            <p class="related-kicker">EXPLORE THE AREA</p>
            <h2 id="related-title">Related rentals in {{ property.city }}</h2>
          </div>
          <a class="related-link" routerLink="/properties" [queryParams]="{ city: property.city }">
            See all in {{ property.city }}
            <span class="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </div>
        @if (relatedLoading()) {
          <p class="related-message">Loading nearby rentals…</p>
        } @else if (relatedError()) {
          <div class="related-message error">
            Nearby rentals could not be loaded.
            <a routerLink="/properties" [queryParams]="{ city: property.city }">Browse rentals in {{ property.city }}</a>
          </div>
        } @else if (relatedProperties().length) {
          <div class="related-grid">
            @for (related of relatedProperties(); track related.id) {
              <app-property-card [property]="related"></app-property-card>
            }
          </div>
        } @else {
          <div class="related-message">
            No other rentals are available in this city right now.
            <a routerLink="/properties" [queryParams]="{ city: property.city }">Browse all rentals</a>
          </div>
        }
      </section>

      <section class="popular-searches" aria-labelledby="popular-searches-title">
        <h2 id="popular-searches-title">Popular rental searches in {{ property.city }}</h2>
        <div class="popular-search-links">
          <a routerLink="/properties" [queryParams]="{ city: property.city, type: 'Apartment' }">
            Apartments in {{ property.city }}
          </a>
          <a routerLink="/properties" [queryParams]="{ city: property.city, type: 'Villa' }">
            Houses in {{ property.city }}
          </a>
          <a routerLink="/properties" [queryParams]="{ city: property.city, type: 'Studio' }">
            Studios in {{ property.city }}
          </a>
          <a routerLink="/properties" [queryParams]="{ city: property.city, type: 'Condominium' }">
            Condominiums in {{ property.city }}
          </a>
        </div>
      </section>

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
                Regarding listing: <strong>{{ property.title }}</strong> ({{
                  property.rentAmountETB | number
                }}
                ETB/mo)
              </p>

              <!-- Quick Templates -->
              <label class="input-label">Quick Suggestions:</label>
              <div class="quick-chips">
                <button type="button" class="chip" (click)="setInquiryTemplate(1)">
                  Is this property still available?
                </button>
                <button type="button" class="chip" (click)="setInquiryTemplate(2)">
                  Can we negotiate on 3 months advance?
                </button>
                <button type="button" class="chip" (click)="setInquiryTemplate(3)">
                  Are utility bills included in rent?
                </button>
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
                Select your preferred date & time to visit <strong>{{ property.title }}</strong> in
                {{ property.subCity }}.
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
              <button class="btn btn-outline" (click)="isAppointmentModalOpen = false">
                Cancel
              </button>
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
                Apply directly to rent <strong>{{ property.title }}</strong
                >. The host will review your profile.
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
                <input
                  type="number"
                  min="1"
                  max="10"
                  [(ngModel)]="appOccupants"
                  class="form-control"
                />
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
              <button class="btn btn-outline" (click)="isApplicationModalOpen = false">
                Cancel
              </button>
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

      @if (isReportModalOpen) {
        <div class="modal-backdrop" (click)="closeReportModal($event)">
          <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div class="modal-header">
              <h3 id="report-title">Report this listing</h3>
              <button type="button" class="close-x" aria-label="Close report form" (click)="isReportModalOpen = false">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">Tell our team what is concerning about “{{ property.title }}”.</p>
              <div class="form-group">
                <label class="input-label" for="report-category">Issue type</label>
                <select id="report-category" class="form-control" [(ngModel)]="reportCategory">
                  @for (category of reportCategories; track category.value) {
                    <option [ngValue]="category.value">{{ category.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="input-label" for="report-reason">Short summary</label>
                <input
                  id="report-reason"
                  class="form-control"
                  type="text"
                  maxlength="200"
                  minlength="3"
                  [(ngModel)]="reportReason"
                  placeholder="Briefly describe the issue"
                />
              </div>
              <div class="form-group">
                <label class="input-label" for="report-description">Details</label>
                <textarea
                  id="report-description"
                  class="form-control"
                  rows="4"
                  maxlength="2000"
                  minlength="10"
                  [(ngModel)]="reportDescription"
                  placeholder="Share any details that will help us review this listing"
                ></textarea>
              </div>
              @if (reportError(); as message) {
                <p class="report-error" role="alert">{{ message }}</p>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="isReportModalOpen = false">Cancel</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="reportSubmitting() || reportReason.trim().length < 3 || reportDescription.trim().length < 10"
                (click)="submitReport()"
              >
                {{ reportSubmitting() ? 'Sending…' : 'Submit report' }}
              </button>
            </div>
          </section>
        </div>
      }

      @if (showPremiumCheckout()) {
        <app-subscription
          [modal]="true"
          [propertyId]="property.id"
          (closed)="closePremiumCheckout()"
        />
      }
    }
  `,
  styles: [
    `
      /* ── Page shell ── */
      .detail-container {
        padding: 0 1.5rem 5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .loading-box,
      .not-found-box {
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
        margin-top: 1.25rem;
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

      .fav-toggle-btn:hover {
        border-color: #f43f5e;
        color: #f43f5e;
      }
      .fav-toggle-btn.favorited {
        background: #ffe4e6;
        border-color: #f43f5e;
        color: #e11d48;
      }

      .nav-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

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

      .landmark {
        color: var(--primary);
        font-weight: 600;
      }

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
        width: min(100%, 1080px);
        margin: 0 auto 2rem;
      }

      .main-image-container {
        position: relative;
        width: 100%;
        height: clamp(230px, 29vw, 370px);
        display: grid;
        place-items: center;
        padding: 12px;
        box-sizing: border-box;
        border: 1px solid #e4e9ef;
        border-radius: 18px;
        background: linear-gradient(145deg, #f8fafc, #e9eef3);
        overflow: hidden;
        box-shadow: 0 12px 32px rgb(15 23 42 / 10%);
      }

      .main-gallery-img {
        display: block;
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 100%;
        border-radius: 10px;
        object-fit: contain;
        object-position: center;
        animation: gallery-image-enter 200ms ease-out;
      }

      @keyframes gallery-image-enter {
        from { opacity: .7; }
        to { opacity: 1; }
      }

      .image-placeholder {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: .5rem;
        color: #cbd5e1;
      }
      .image-placeholder .material-icons-outlined { font-size: 2.5rem; }

      .gallery-arrow {
        position: absolute;
        top: 50%;
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        transform: translateY(-50%);
        border: 1px solid rgb(255 255 255 / 75%);
        border-radius: 50%;
        background: rgb(255 255 255 / 88%);
        color: #1f2937;
        box-shadow: 0 4px 14px rgb(15 23 42 / 18%);
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: background 160ms ease, transform 160ms ease;
      }

      .gallery-arrow:hover {
        background: #fff;
        transform: translateY(-50%) scale(1.05);
      }

      .gallery-arrow .material-icons-outlined { font-size: 1.6rem; }
      .gallery-previous { left: 1rem; }
      .gallery-next { right: 1rem; }
      .gallery-count {
        position: absolute;
        right: 1.1rem;
        bottom: 1.1rem;
        padding: .4rem .7rem;
        border-radius: 999px;
        border: 1px solid rgb(255 255 255 / 25%);
        background: rgb(15 23 42 / 78%);
        color: #fff;
        font-size: .72rem;
        font-weight: 650;
        letter-spacing: .02em;
        backdrop-filter: blur(8px);
      }

      .thumbnail-strip {
        display: flex;
        justify-content: center;
        gap: .6rem;
        width: fit-content;
        max-width: 100%;
        margin: .75rem auto 0;
        overflow-x: auto;
        padding: .45rem .55rem .6rem;
        border: 1px solid #e7ebf0;
        border-radius: 14px;
        background: #f8fafc;
      }

      .thumbnail-strip::-webkit-scrollbar {
        height: 4px;
      }
      .thumbnail-strip::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 2px;
      }

      .thumbnail-button {
        width: 100px;
        height: 68px;
        padding: 3px;
        border: 1px solid #e3e8ee;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 2px 7px rgb(15 23 42 / 8%);
        cursor: pointer;
        flex: 0 0 auto;
        transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        opacity: .78;
      }

      .thumbnail-button:hover {
        transform: translateY(-2px);
        opacity: 1;
        box-shadow: 0 5px 12px rgb(15 23 42 / 14%);
      }

      .thumbnail-button.active {
        border: 2px solid var(--primary);
        padding: 2px;
        opacity: 1;
        box-shadow: 0 0 0 2px rgb(16 185 129 / 14%);
      }

      .thumb-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }

      .thumbnail-button:focus-visible,
      .gallery-arrow:focus-visible {
        outline: 3px solid var(--primary);
        outline-offset: 3px;
      }

      .property-details-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 2rem;
        margin: 0;
      }
      .property-detail-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: .72rem 0;
        border-bottom: 1px solid var(--border-color-light);
        font-size: .84rem;
      }
      .property-detail-row dt { color: var(--text-muted); }
      .property-detail-row dd { margin: 0; color: var(--secondary); font-weight: 650; text-align: right; }
      .map-caption { margin: -.35rem 0 .8rem; color: var(--text-muted); font-size: .86rem; }
      .property-map { display: block; width: 100%; height: 280px; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
      .map-unavailable { display: flex; min-height: 120px; align-items: center; gap: .65rem; padding: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted); font-size: .86rem; }
      .map-unavailable .material-icons-outlined { color: var(--primary); }
      .map-link { display: inline-flex; align-items: center; gap: .3rem; margin-top: .7rem; color: var(--primary-dark); font-size: .82rem; font-weight: 700; text-decoration: none; }
      .related-section { max-width: 1200px; margin: 2rem auto 0; padding: 0 1.5rem; }
      .related-heading { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 1rem; }
      .related-kicker { margin: 0 0 .3rem; color: var(--primary-dark); font-size: .68rem; font-weight: 800; letter-spacing: .1em; }
      .related-heading h2 { margin: 0; color: var(--secondary); font-size: 1.3rem; }
      .related-link { display: inline-flex; align-items: center; gap: .25rem; color: var(--primary-dark); font-size: .84rem; font-weight: 700; text-decoration: none; }
      .related-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
      .related-message { padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-muted); font-size: .86rem; }
      .related-message a { margin-left: .25rem; color: var(--primary-dark); font-weight: 700; }
      .related-message.error { border-color: #f0cbc5; color: #783f38; }
      .popular-searches { max-width: 1200px; margin: 1.5rem auto 2rem; padding: 1rem 1.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); }
      .popular-searches h2 { margin: 0 0 .8rem; color: var(--secondary); font-size: 1rem; }
      .popular-search-links { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .65rem; }
      .popular-search-links a { color: var(--text-muted); font-size: .82rem; text-decoration: none; }
      .popular-search-links a:hover { color: var(--primary-dark); text-decoration: underline; }

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

      .spec-cell:last-child {
        border-right: none;
      }

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

      .video-embed {
        position: relative;
        width: min(100%, 360px);
        aspect-ratio: 9 / 16;
        margin: 0 auto 1rem;
        overflow: hidden;
        border-radius: var(--radius-md);
        background: #111;
      }

      .video-embed iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }

      .video-external-link {
        color: var(--primary-dark);
        font-size: 0.875rem;
        font-weight: 700;
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
        border-color: rgba(16, 185, 129, 0.2);
        text-decoration: none;
        opacity: 1;
      }

      .amenity-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      /* ── Sticky pricing card ── */
      .detail-sidebar {
        position: sticky;
        top: 80px;
      }

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
        border-bottom: 1px solid rgba(16, 185, 129, 0.15);
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
      .card-section {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color-light);
      }

      .breakdown-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .breakdown-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
      }

      .breakdown-item span {
        color: var(--text-muted);
      }

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

      .total-amount {
        color: var(--primary);
        font-size: 1.1rem;
      }

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
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }

      .host-name {
        font-weight: 700;
        color: var(--secondary);
        font-size: 0.925rem;
      }
      .host-badge {
        font-size: 0.78rem;
        color: var(--primary);
        font-weight: 600;
      }

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

      .btn-secondary:hover {
        background: var(--secondary);
        transform: translateY(-1px);
      }

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

      .btn-apply:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      }

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
      .report-prompt { display: grid; grid-template-columns: auto 1fr; column-gap: .45rem; align-items: center; margin-top: .8rem; color: var(--text-muted); font-size: .78rem; }
      .report-prompt > .material-icons-outlined { color: var(--primary-dark); font-size: 1.05rem; }
      .report-prompt button { grid-column: 2; justify-self: start; padding: 0; border: 0; background: transparent; color: var(--primary-dark); font: inherit; text-decoration: underline; cursor: pointer; }
      .report-prompt p { grid-column: 1 / -1; margin: .4rem 0 0; color: var(--primary-dark); }
      .report-error { margin: 0; color: #b42318; font-size: .85rem; }

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

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

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
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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

      .close-x:hover {
        color: var(--danger);
      }

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

      .form-group {
        margin-bottom: 1rem;
      }

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

      .badge-green {
        background: var(--primary-light);
        color: var(--primary-dark);
      }
      .badge-amber {
        background: #fef3c7;
        color: #92400e;
      }

      /* ── Responsive ── */
      @media (max-width: 960px) {
        .detail-columns {
          grid-template-columns: 1fr;
        }

        .detail-sidebar {
          position: static;
          order: -1; /* contact card floats to top on mobile */
        }

        .specs-ribbon {
          grid-template-columns: repeat(2, 1fr);
        }
        .related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .spec-cell:nth-child(2) {
          border-right: none;
        }
        .spec-cell:nth-child(3) {
          border-right: 1px solid var(--border-color-light);
          border-top: 1px solid var(--border-color-light);
        }
        .spec-cell:nth-child(4) {
          border-top: 1px solid var(--border-color-light);
          border-right: none;
        }
      }

      @media (max-width: 640px) {
        .property-headline {
          font-size: 1.45rem;
        }
        .main-image-container {
          height: min(42vh, 290px);
          min-height: 200px;
          padding: 8px;
          border-radius: 14px;
        }
        .gallery-wrapper { margin-bottom: 1.5rem; }
        .thumbnail-strip { justify-content: flex-start; }
        .thumbnail-button { width: 84px; height: 58px; }
        .detail-container {
          padding: 0 1rem 4rem;
        }
        .grid-2-col {
          grid-template-columns: 1fr;
        }
        .property-details-grid, .related-grid { grid-template-columns: 1fr; }
        .related-heading { align-items: flex-start; flex-direction: column; }
        .related-section { padding: 0 1rem; }
        .popular-searches { margin: 1.25rem 1rem 2rem; padding: 1rem; }
        .popular-search-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gallery-previous { left: .75rem; }
        .gallery-next { right: .75rem; }
        .gallery-arrow { width: 36px; height: 36px; }
      }
    `,
  ],
})
export class PropertyDetailComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interactionService = inject(InteractionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);
  private reportService = inject(ReportService);

  property: Property | null = null;
  readonly contactEntitlement = signal<Entitlement | null>(null);
  readonly contactEntitlementLoading = signal(false);
  readonly contactEntitlementError = signal<string | null>(null);
  readonly showPremiumCheckout = signal(false);
  readonly relatedProperties = signal<PropertySummary[]>([]);
  readonly relatedLoading = signal(false);
  readonly relatedError = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportFeedback = signal<string | null>(null);
  readonly reportSubmitting = signal(false);
  activeImageUrl: string = '';
  activeImageIndex = 0;
  isLoading = true;
  phoneRevealed = false;
  isSubmitting = false;

  feedbackMessage = '';
  feedbackSuccess = true;

  closePremiumCheckout(): void {
    this.showPremiumCheckout.set(false);
    this.loadContactEntitlement();
  }

  // Modals state
  isInquiryModalOpen = false;
  inquiryMessage = '';

  isAppointmentModalOpen = false;
  appointmentDateTime = '';
  appointmentNotes = '';

  isApplicationModalOpen = false;
  isReportModalOpen = false;
  reportCategory = ReportCategory.Other;
  reportReason = '';
  reportDescription = '';
  readonly reportCategories = [
    { value: ReportCategory.FakeListing, label: 'Fake listing' },
    { value: ReportCategory.MisleadingInformation, label: 'Misleading information' },
    { value: ReportCategory.DuplicateListing, label: 'Duplicate listing' },
    { value: ReportCategory.IncorrectPrice, label: 'Incorrect price' },
    { value: ReportCategory.UnauthorizedPhotos, label: 'Unauthorized photos' },
    { value: ReportCategory.Fraud, label: 'Possible fraud' },
    { value: ReportCategory.Other, label: 'Other concern' },
  ];
  appMoveInDate = '';
  appLeaseMonths = 12;
  appOccupants = 1;
  appIncomeSummary = '';
  appNotes = '';

  get isFavorited(): boolean {
    return this.property ? this.interactionService.isFavorited(this.property.id) : false;
  }

  get galleryImages(): string[] {
    if (!this.property) return [];
    return [...new Set([this.property.primaryImageUrl, ...this.property.imageUrls].filter(
      (url): url is string => !!url,
    ))];
  }

  get propertyDetails(): { label: string; value: string }[] {
    if (!this.property) return [];
    const property = this.property;
    const availableFrom = new Date(property.availableFromDate);
    return [
      { label: 'Property type', value: this.getTypeName(property.propertyType) },
      { label: 'Monthly rent', value: `${property.rentAmountETB.toLocaleString('en-US')} ETB` },
      {
        label: 'Available from',
        value: Number.isNaN(availableFrom.getTime())
          ? 'Not specified'
          : availableFrom.toLocaleDateString(),
      },
      { label: 'Rental period', value: `${property.minimumLeaseMonths} months minimum` },
      { label: 'Advance payment', value: `${property.advanceMonthsRequired} months` },
      { label: 'Security deposit', value: `${property.depositAmountETB.toLocaleString('en-US')} ETB` },
      { label: 'Bedrooms', value: String(property.bedrooms) },
      { label: 'Bathrooms', value: String(property.bathrooms) },
      ...(property.areaSquareMeters
        ? [
            { label: 'Floor area', value: `${property.areaSquareMeters} m²` },
            {
              label: 'Rent per m²',
              value: `${Math.round(property.rentAmountETB / property.areaSquareMeters).toLocaleString('en-US')} ETB`,
            },
          ]
        : []),
      { label: 'Furnishing', value: this.getFurnishingName(property.furnishing) },
      { label: 'Parking', value: property.hasParking ? 'Yes' : 'No' },
      { label: 'Elevator', value: property.hasElevator ? 'Yes' : 'No' },
      { label: 'Balcony', value: property.hasBalcony ? 'Yes' : 'No' },
      { label: 'Wi-Fi', value: property.hasWifi ? 'Yes' : 'No' },
      { label: 'Water tank', value: property.hasWaterTank ? 'Yes' : 'No' },
      { label: 'Generator', value: property.hasGenerator ? 'Yes' : 'No' },
      { label: 'Security guard', value: property.hasSecurityGuard ? 'Yes' : 'No' },
      { label: 'Water bill included', value: property.waterBillIncluded ? 'Yes' : 'No' },
      { label: 'Electricity bill included', value: property.electricityBillIncluded ? 'Yes' : 'No' },
      ...(property.streetAddress
        ? [{ label: 'Street address', value: property.streetAddress }]
        : []),
    ];
  }

  get mapEmbedUrl(): SafeResourceUrl | null {
    const { latitude, longitude } = this.property ?? {};
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }
    const padding = 0.012;
    const bounds = [
      longitude - padding,
      latitude - padding,
      longitude + padding,
      latitude + padding,
    ].join(',');
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${latitude},${longitude}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get mapSearchUrl(): string {
    if (!this.property) return 'https://www.openstreetmap.org/';
    const coordinates =
      typeof this.property.latitude === 'number' && typeof this.property.longitude === 'number'
        ? `${this.property.latitude},${this.property.longitude}`
        : '';
    const place = coordinates || [
      this.property.streetAddress,
      this.property.neighborhood,
      this.property.subCity,
      this.property.city,
      this.property.region,
    ]
      .filter(Boolean)
      .join(', ');
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(place)}`;
  }

  get tiktokEmbedUrl(): SafeResourceUrl | null {
    const videoUrl = this.property?.videoUrl;
    if (!videoUrl) return null;

    try {
      const parsedUrl = new URL(videoUrl);
      const isTikTokHost = ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'].includes(
        parsedUrl.hostname.toLowerCase(),
      );
      const videoId = parsedUrl.pathname.match(/\/video\/(\d+)/)?.[1];
      if (!isTikTokHost || parsedUrl.protocol !== 'https:' || !videoId) return null;

      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.tiktok.com/embed/v2/${videoId}`,
      );
    } catch {
      return null;
    }
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
            const data = res.data;
            data.imageUrls = (data.imageUrls ?? []).map((u) => resolveImageUrl(u));
            data.primaryImageUrl = resolveImageUrl(data.primaryImageUrl) || null;
            this.property = data;
            this.activeImageUrl =
              this.property.primaryImageUrl || (this.property.imageUrls[0] ?? '');
            this.activeImageIndex = Math.max(this.galleryImages.indexOf(this.activeImageUrl), 0);
            this.loadContactEntitlement();
            this.loadRelatedProperties();
            this.changeDetector.markForCheck();

            // Set default date for application to property's availableFromDate
            this.appMoveInDate = new Date().toISOString().substring(0, 10);
          }
        },
        error: () => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
    }
  }

  showImage(index: number): void {
    const image = this.galleryImages[index];
    if (!image) return;
    this.activeImageIndex = index;
    this.activeImageUrl = image;
  }

  showPreviousImage(): void {
    if (!this.galleryImages.length) return;
    this.showImage((this.activeImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length);
  }

  showNextImage(): void {
    if (!this.galleryImages.length) return;
    this.showImage((this.activeImageIndex + 1) % this.galleryImages.length);
  }

  private loadRelatedProperties(): void {
    if (!this.property) return;
    this.relatedLoading.set(true);
    this.relatedError.set(false);
    this.propertyService
      .search({ city: this.property.city, sortBy: 'newest', page: 1, pageSize: 8 })
      .subscribe({
        next: (response) => {
          this.relatedLoading.set(false);
          if (!response.succeeded || !response.data) {
            this.relatedError.set(true);
            return;
          }

          this.relatedProperties.set(
            response.data.items.filter((item) => item.id !== this.property?.id).slice(0, 3),
          );
        },
        error: () => {
          this.relatedLoading.set(false);
          this.relatedError.set(true);
        },
      });
  }

  openReportModal(): void {
    if (!this.property) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/properties/${this.property.id}` },
      });
      return;
    }
    this.reportCategory = ReportCategory.Other;
    this.reportReason = '';
    this.reportDescription = '';
    this.reportError.set(null);
    this.isReportModalOpen = true;
  }

  closeReportModal(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.reportSubmitting()) {
      this.isReportModalOpen = false;
    }
  }

  submitReport(): void {
    if (!this.property || this.reportSubmitting()) return;
    const reason = this.reportReason.trim();
    const description = this.reportDescription.trim();
    if (reason.length < 3 || description.length < 10) {
      this.reportError.set('Enter a summary of at least 3 characters and details of at least 10 characters.');
      return;
    }

    this.reportSubmitting.set(true);
    this.reportError.set(null);
    this.reportService
      .createReport({
        reportedPropertyId: this.property.id,
        category: this.reportCategory,
        reason,
        description,
      })
      .subscribe({
        next: (response) => {
          this.reportSubmitting.set(false);
          if (!response.succeeded || !response.data) {
            this.reportError.set(
              response.errors?.join(' ') || 'We could not submit your report. Please try again.',
            );
            return;
          }
          this.isReportModalOpen = false;
          this.reportFeedback.set('Thank you. Your report has been sent to our review team.');
        },
        error: () => {
          this.reportSubmitting.set(false);
          this.reportError.set('We could not submit your report. Please try again.');
        },
      });
  }

  loadContactEntitlement(): void {
    if (!this.authService.isAuthenticated()) {
      this.contactEntitlement.set(null);
      this.contactEntitlementError.set(null);
      this.contactEntitlementLoading.set(false);
      return;
    }

    this.contactEntitlementLoading.set(true);
    this.contactEntitlementError.set(null);
    this.subscriptionService.getEntitlements().subscribe({
      next: (response) => {
        this.contactEntitlementLoading.set(false);
        if (!response.succeeded || !response.data) {
          this.contactEntitlementError.set(
            response.errors?.[0] || 'We could not check your Premium contact access.',
          );
          return;
        }
        this.contactEntitlement.set(response.data);
      },
      error: () => {
        this.contactEntitlementLoading.set(false);
        this.contactEntitlementError.set('We could not check your Premium contact access.');
      },
    });
  }

  toggleFavorite() {
    if (!this.property) return;
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/properties/${this.property.id}` },
      });
      return;
    }
    this.interactionService.toggleFavorite(this.property.id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.showFeedback(
            res.data ? 'Added to your favorites list!' : 'Removed from favorites.',
            true,
          );
        }
      },
    });
  }

  revealPhone() {
    this.phoneRevealed = true;
  }

  openInquiryModal() {
    this.checkPremiumAccess(() => {
      this.isInquiryModalOpen = true;
    });
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
    this.interactionService
      .createInquiry({
        propertyId: this.property.id,
        message: this.inquiryMessage.trim(),
      })
      .subscribe({
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
        },
      });
  }

  openAppointmentModal() {
    this.checkPremiumAccess(() => {
      this.isAppointmentModalOpen = true;
    });
  }

  submitAppointment() {
    if (!this.property || !this.appointmentDateTime) return;
    this.isSubmitting = true;
    this.interactionService
      .requestAppointment({
        propertyId: this.property.id,
        requestedDateTimeUtc: new Date(this.appointmentDateTime).toISOString(),
        renterNotes: this.appointmentNotes,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isAppointmentModalOpen = false;
          this.appointmentNotes = '';
          if (res.succeeded) {
            this.showFeedback(
              'Viewing tour request submitted! The host will confirm the visit.',
              true,
            );
          } else {
            this.showFeedback(res.errors?.[0] || 'Failed to book appointment.', false);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showFeedback(err?.error?.errors?.[0] || 'Error requesting tour.', false);
        },
      });
  }

  openApplicationModal() {
    this.checkPremiumAccess(() => {
      this.isApplicationModalOpen = true;
    });
  }

  private checkPremiumAccess(onPremium: () => void): void {
    if (!this.checkAuth() || this.contactEntitlementLoading()) return;

    this.contactEntitlementLoading.set(true);
    this.contactEntitlementError.set(null);
    this.subscriptionService.getEntitlements().subscribe({
      next: (response) => {
        this.contactEntitlementLoading.set(false);
        if (!response.succeeded || !response.data) {
          const message = response.errors?.[0] || 'We could not verify your Premium payment status.';
          this.contactEntitlementError.set(message);
          this.showFeedback(message, false);
          return;
        }

        this.contactEntitlement.set(response.data);
        if (!response.data.isPremium) {
          this.showPremiumCheckout.set(true);
          return;
        }

        onPremium();
      },
      error: () => {
        const message = 'We could not verify your Premium payment status. Please try again.';
        this.contactEntitlementLoading.set(false);
        this.contactEntitlementError.set(message);
        this.showFeedback(message, false);
      },
    });
  }

  submitApplication() {
    if (!this.property || !this.appIncomeSummary.trim()) return;
    this.isSubmitting = true;
    this.interactionService
      .submitApplication({
        propertyId: this.property.id,
        proposedMoveInDate: new Date(this.appMoveInDate).toISOString(),
        proposedLeaseDurationMonths: this.appLeaseMonths,
        proposedOccupantsCount: this.appOccupants,
        employmentOrIncomeSummary: this.appIncomeSummary.trim(),
        additionalNotes: this.appNotes.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isApplicationModalOpen = false;
          if (res.succeeded) {
            this.showFeedback(
              'Rental application submitted successfully! The landlord will review your background.',
              true,
            );
          } else {
            this.showFeedback(res.errors?.[0] || 'Failed to submit application.', false);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showFeedback(err?.error?.errors?.[0] || 'Error submitting application.', false);
        },
      });
  }

  notifySimilar() {
    if (!this.property || !this.checkAuth()) return;
    const p = this.property;
    this.interactionService
      .createSavedSearch({
        name: `Similar to ${p.title}`.slice(0, 80),
        city: p.city,
        subCity: p.subCity,
        maxPriceETB: Math.round(p.rentAmountETB * 1.3),
        minBedrooms: p.bedrooms || undefined,
        propertyType: String(p.propertyType),
        alertEmailEnabled: true,
      })
      .subscribe({
        next: (res) => {
          this.showFeedback(
            res.succeeded
              ? 'Done. We will email you when similar homes are listed.'
              : res.errors?.[0] || 'Could not create the notification.',
            !!res.succeeded,
          );
        },
        error: (err) =>
          this.showFeedback(err?.error?.errors?.[0] || 'Could not create the notification.', false),
      });
  }

  private checkAuth(): boolean {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/properties/${this.property?.id}` },
      });
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

  getTypeName(type: PropertyTypeValue): string {
    const value = enumValueFromApi(PropertyType, type);
    return value === undefined ? String(type) : PropertyType[value] || String(type);
  }

  getFurnishingName(furnishing: FurnishingStatusValue): string {
    const value = enumValueFromApi(FurnishingStatus, furnishing);
    return value === undefined ? String(furnishing) : FurnishingStatus[value] || String(furnishing);
  }
}
