import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertySummary, PropertyFilter, PropertyType } from '../../../core/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PropertyCardComponent],
  template: `
    <div class="search-page">

      <!-- ══ Sticky Filter Bar ══ -->
      <div class="filter-bar">
        <div class="filter-bar-inner container">

          <div class="filter-grid">
            <div class="filter-col">
              <label class="filter-label">Locality / Sub-City</label>
              <select [(ngModel)]="filter.subCity" (change)="applyFilters()" class="form-control">
                <option value="">All Locations</option>
                <option value="Bole">Bole Sub-City</option>
                <option value="Yeka">Yeka / CMC</option>
                <option value="Kirkos">Kirkos / Kazanchis</option>
                <option value="Nifas Silk-Lafto">Nifas Silk / Old Airport</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Bahir Dar">Bahir Dar</option>
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label">Property Type</label>
              <select [(ngModel)]="selectedTypeString" (change)="onTypeChange()" class="form-control">
                <option value="all">All Types</option>
                <option value="0">Apartment</option>
                <option value="1">Condominium</option>
                <option value="2">Villa / G+1</option>
                <option value="4">Studio / Single Room</option>
                <option value="6">Commercial</option>
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label">Max Budget (ETB)</label>
              <select [(ngModel)]="filter.maxPriceETB" (change)="applyFilters()" class="form-control">
                <option [ngValue]="0">Any Budget</option>
                <option [ngValue]="20000">Up to 20,000 ETB</option>
                <option [ngValue]="40000">Up to 40,000 ETB</option>
                <option [ngValue]="70000">Up to 70,000 ETB</option>
                <option [ngValue]="120000">Up to 120,000 ETB</option>
                <option [ngValue]="250000">200,000+ ETB</option>
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label">Bedrooms</label>
              <select [(ngModel)]="filter.minBedrooms" (change)="applyFilters()" class="form-control">
                <option [ngValue]="undefined">Any Beds</option>
                <option [ngValue]="1">1+ Bedrooms</option>
                <option [ngValue]="2">2+ Bedrooms</option>
                <option [ngValue]="3">3+ Bedrooms</option>
                <option [ngValue]="4">4+ Bedrooms</option>
              </select>
            </div>
          </div>

          <!-- Amenity chips -->
          <div class="amenity-chips">
            <label class="amenity-chip" [class.active]="filter.hasWaterTank">
              <input type="checkbox" [(ngModel)]="filter.hasWaterTank" (change)="applyFilters()" />
              💧 Water Tank
            </label>
            <label class="amenity-chip" [class.active]="filter.hasGenerator">
              <input type="checkbox" [(ngModel)]="filter.hasGenerator" (change)="applyFilters()" />
              ⚡ Generator
            </label>
            <label class="amenity-chip" [class.active]="filter.hasSecurityGuard">
              <input type="checkbox" [(ngModel)]="filter.hasSecurityGuard" (change)="applyFilters()" />
              🛡️ Security
            </label>
            <label class="amenity-chip" [class.active]="filter.hasParking">
              <input type="checkbox" [(ngModel)]="filter.hasParking" (change)="applyFilters()" />
              🚗 Parking
            </label>
            <label class="amenity-chip" [class.active]="filter.hasElevator">
              <input type="checkbox" [(ngModel)]="filter.hasElevator" (change)="applyFilters()" />
              🛗 Elevator
            </label>
          </div>
        </div>
      </div>

      <!-- ══ Body ══ -->
      <div class="container page-body">

        <!-- Results / sort bar -->
        <div class="results-bar">
          <div class="results-count">
            @if (!isLoading) {
              <strong>{{ totalCount | number }}</strong> rentals in Ethiopia
            }
          </div>
          <div class="results-actions">
            <button class="btn btn-outline btn-sm alert-btn" (click)="openSaveSearchModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Save Alert
            </button>
            <div class="sort-box">
              <label class="sort-label">Sort:</label>
              <select [(ngModel)]="filter.sortBy" (change)="applyFilters()" class="sort-select">
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="bedrooms">Most Beds</option>
              </select>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="resetFilters()" title="Reset filters">
              Reset
            </button>
          </div>
        </div>

        <!-- ══ Save Search Modal ══ -->
        @if (isSaveSearchModalOpen) {
          <div class="modal-backdrop" (click)="isSaveSearchModalOpen = false">
            <div class="modal-card" (click)="$event.stopPropagation()">
              <div class="modal-hdr">
                <h3>Save Rental Alert</h3>
                <button class="close-x" (click)="isSaveSearchModalOpen = false">×</button>
              </div>
              <div class="modal-bdy">
                <p class="modal-sub">
                  Get notified for: <strong>{{ filter.subCity || 'All Addis Ababa' }}</strong>
                  @if (filter.maxPriceETB && filter.maxPriceETB > 0) {
                    · up to {{ filter.maxPriceETB | number }} ETB
                  }
                </p>
                <div class="form-group">
                  <label class="form-label">Alert Name</label>
                  <input type="text" [(ngModel)]="saveSearchName" class="form-control"
                    placeholder="e.g. Bole 2-Bed under 40k ETB" />
                </div>
                <label class="check-row">
                  <input type="checkbox" id="alertEmail" [(ngModel)]="saveSearchAlertEmail" />
                  <span>Send email notifications for new matches</span>
                </label>
              </div>
              <div class="modal-ftr">
                <button class="btn btn-outline btn-sm" (click)="isSaveSearchModalOpen = false">Cancel</button>
                <button class="btn btn-primary btn-sm"
                  [disabled]="isSavingSearch || !saveSearchName.trim()"
                  (click)="saveSearch()">
                  {{ isSavingSearch ? 'Saving…' : 'Save Alert' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ══ Skeleton loading ══ -->
        @if (isLoading) {
          <div class="properties-grid">
            @for (_ of skeletons; track $index) {
              <div class="skeleton-card">
                <div class="sk-img"></div>
                <div class="sk-body">
                  <div class="sk-line sk-price"></div>
                  <div class="sk-line sk-specs"></div>
                  <div class="sk-line sk-title"></div>
                  <div class="sk-line sk-title sk-short"></div>
                  <div class="sk-line sk-loc"></div>
                </div>
              </div>
            }
          </div>

        <!-- ══ Empty state ══ -->
        } @else if (properties.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2>No matching properties found</h2>
            <p>Try widening your price range, clearing amenity filters, or selecting "All Locations".</p>
            <button class="btn btn-outline" (click)="resetFilters()">Reset All Filters</button>
          </div>

        <!-- ══ Results grid ══ -->
        } @else {
          <div class="properties-grid">
            @for (prop of properties; track prop.id) {
              <app-property-card [property]="prop"></app-property-card>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages > 1) {
            <div class="pagination-bar">
              <button class="btn btn-outline btn-sm" [disabled]="currentPage === 1"
                (click)="changePage(currentPage - 1)">
                ‹ Previous
              </button>
              <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
              <button class="btn btn-outline btn-sm" [disabled]="currentPage === totalPages"
                (click)="changePage(currentPage + 1)">
                Next ›
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* ── Page shell ── */
    .search-page {
      min-height: 100%;
      background: var(--bg-page);
    }

    /* ── Sticky filter bar ── */
    .filter-bar {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .filter-bar-inner {
      padding: 1rem 1.5rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.875rem;
    }

    .filter-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .filter-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Amenity chips row */
    .amenity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 0.625rem;
      border-top: 1px solid var(--border-color-light);
    }

    .amenity-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;
    }

    .amenity-chip input { display: none; }

    .amenity-chip:hover {
      border-color: var(--primary);
      color: var(--primary-dark);
      background: var(--primary-lighter);
    }

    .amenity-chip.active {
      background: var(--primary-light);
      border-color: var(--primary);
      color: var(--primary-dark);
    }

    /* ── Body ── */
    .page-body {
      padding: 1.5rem 1.5rem 4rem;
    }

    /* ── Results / sort bar ── */
    .results-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .results-count {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .results-count strong {
      color: var(--secondary);
      font-size: 1.1rem;
    }

    .results-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .alert-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sort-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .sort-label {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 600;
      white-space: nowrap;
    }

    .sort-select {
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      font-size: 0.875rem;
      color: var(--text-main);
      cursor: pointer;
    }

    /* ── Properties grid ── */
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    /* ── Skeleton cards ── */
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }

    .skeleton-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .sk-img {
      height: 210px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite;
    }

    .sk-body {
      padding: 1.1rem 1.25rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .sk-line {
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 600px 100%;
      animation: shimmer 1.4s infinite;
    }

    .sk-price  { height: 22px; width: 55%; }
    .sk-specs  { height: 14px; width: 70%; }
    .sk-title  { height: 16px; width: 90%; }
    .sk-short  { width: 65%; }
    .sk-loc    { height: 14px; width: 80%; margin-top: 0.25rem; }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      padding: 5rem 2rem;
      background: var(--bg-card);
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-lg);
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--bg-page-alt);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-light);
      margin-bottom: 0.25rem;
    }

    .empty-state h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--secondary);
      margin: 0;
    }

    .empty-state p {
      color: var(--text-muted);
      font-size: 0.9rem;
      max-width: 380px;
      margin: 0;
    }

    /* ── Pagination ── */
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color-light);
    }

    .page-info {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      min-width: 120px;
      text-align: center;
    }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(3px);
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
      max-width: 480px;
      width: 100%;
      box-shadow: var(--shadow-2xl);
      animation: slideUp 0.25s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .modal-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-hdr h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--secondary);
      margin: 0;
    }

    .close-x {
      background: transparent;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: var(--text-muted);
      line-height: 1;
      transition: color var(--transition-fast);
    }

    .close-x:hover { color: var(--danger); }

    .modal-bdy {
      padding: 1.25rem 1.5rem;
    }

    .modal-sub {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .check-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
      margin-top: 0.75rem;
    }

    .check-row input { accent-color: var(--primary); }

    .modal-ftr {
      display: flex;
      justify-content: flex-end;
      gap: 0.625rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-page);
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .filter-grid { grid-template-columns: 1fr 1fr; }
      .page-body { padding: 1rem 1rem 3rem; }
      .filter-bar-inner { padding: 0.875rem 1rem; }
    }
  `]
})
export class PropertyListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  properties: PropertySummary[] = [];
  totalCount = 0;
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

  selectedTypeString = 'all';
  skeletons = Array(6); // 6 skeleton cards

  // Save Search Modal state
  isSaveSearchModalOpen = false;
  isSavingSearch = false;
  saveSearchName = '';
  saveSearchAlertEmail = true;

  filter: PropertyFilter = {
    subCity: '',
    maxPriceETB: 0,
    sortBy: 'newest',
    page: 1,
    pageSize: 12
  };

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.interactionService.loadFavorites().subscribe();
    }

    this.route.queryParams.subscribe(params => {
      if (params['subCity']) this.filter.subCity = params['subCity'];
      if (params['type']) this.selectedTypeString = params['type'];
      if (params['maxPrice']) this.filter.maxPriceETB = Number(params['maxPrice']);
      this.onTypeChange(false);
      this.loadProperties();
    });
  }

  openSaveSearchModal() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/properties' } });
      return;
    }
    const loc = this.filter.subCity ? `${this.filter.subCity} ` : '';
    const budget = this.filter.maxPriceETB && this.filter.maxPriceETB > 0 ? `under ${this.filter.maxPriceETB} ETB` : 'Rentals';
    this.saveSearchName = `${loc}${budget}`.trim() || 'My Ethiopian Rental Search';
    this.isSaveSearchModalOpen = true;
  }

  saveSearch() {
    if (!this.saveSearchName.trim()) return;
    this.isSavingSearch = true;

    this.interactionService.createSavedSearch({
      name: this.saveSearchName.trim(),
      city: this.filter.city,
      subCity: this.filter.subCity,
      minPriceETB: this.filter.minPriceETB,
      maxPriceETB: this.filter.maxPriceETB && this.filter.maxPriceETB > 0 ? this.filter.maxPriceETB : undefined,
      minBedrooms: this.filter.minBedrooms,
      propertyType: this.selectedTypeString !== 'all' ? this.selectedTypeString : undefined,
      alertEmailEnabled: this.saveSearchAlertEmail
    }).subscribe({
      next: (res) => {
        this.isSavingSearch = false;
        this.isSaveSearchModalOpen = false;
        if (res.succeeded) {
          alert('Search alert saved! You will receive updates for matching listings.');
        }
      },
      error: () => {
        this.isSavingSearch = false;
      }
    });
  }

  onTypeChange(shouldReload = true) {
    if (this.selectedTypeString === 'all') {
      this.filter.propertyType = undefined;
    } else {
      this.filter.propertyType = Number(this.selectedTypeString) as PropertyType;
    }
    if (shouldReload) this.applyFilters();
  }

  loadProperties() {
    this.isLoading = true;
    this.propertyService.search(this.filter).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.properties = res.data.items;
          this.totalCount = res.data.totalCount;
          this.currentPage = res.data.page;
          this.totalPages = res.data.totalPages;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filter.page = 1;
    this.loadProperties();
  }

  changePage(newPage: number) {
    this.filter.page = newPage;
    this.loadProperties();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters() {
    this.filter = {
      subCity: '',
      maxPriceETB: 0,
      sortBy: 'newest',
      page: 1,
      pageSize: 12
    };
    this.selectedTypeString = 'all';
    this.loadProperties();
  }
}
