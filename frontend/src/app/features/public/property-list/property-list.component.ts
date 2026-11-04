import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertySummary, PropertyFilter, PropertyType } from '../../../core/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

type FlagKey =
  | 'hasWaterTank' | 'hasGenerator' | 'hasSecurityGuard' | 'hasParking'
  | 'hasElevator' | 'hasBalcony' | 'hasWifi' | 'furnished';

const PLACES = [
  'Addis Ababa', 'Hawassa', 'Mekelle', 'Bahir Dar', 'Dire Dawa', 'Adama', 'Jimma', 'Gondar',
  'Bole', 'CMC', 'Kazanchis', 'Sarbet', 'Yeka', 'Kirkos', 'Nifas Silk-Lafto',
];
const CITY_NAMES = PLACES.slice(0, 8).map(p => p.toLowerCase());

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: PropertyType.Apartment, label: 'Apartment' },
  { value: PropertyType.Condominium, label: 'Condominium' },
  { value: PropertyType.Villa, label: 'Villa / house' },
  { value: PropertyType.GPlusOne, label: 'G+1 house' },
  { value: PropertyType.Studio, label: 'Studio / single room' },
  { value: PropertyType.ServiceQuarter, label: 'Service quarter' },
  { value: PropertyType.Commercial, label: 'Commercial' },
];

const TYPE_BY_NAME: Record<string, PropertyType> = {
  apartment: PropertyType.Apartment,
  condominium: PropertyType.Condominium,
  condo: PropertyType.Condominium,
  villa: PropertyType.Villa,
  house: PropertyType.Villa,
  gplusone: PropertyType.GPlusOne,
  'g+1': PropertyType.GPlusOne,
  studio: PropertyType.Studio,
  room: PropertyType.Studio,
  servicequarter: PropertyType.ServiceQuarter,
  commercial: PropertyType.Commercial,
};

/** URL feature names (also sent by the home page search) mapped to filter flags. */
const FEATURE_TO_FLAG: Record<string, FlagKey> = {
  parking: 'hasParking',
  elevator: 'hasElevator',
  balcony: 'hasBalcony',
  furnished: 'furnished',
  'water-tank': 'hasWaterTank',
  generator: 'hasGenerator',
  security: 'hasSecurityGuard',
  wifi: 'hasWifi',
};

const CHIPS: { key: FlagKey; label: string; icon: string }[] = [
  { key: 'hasWaterTank', label: 'Water tank', icon: 'water_drop' },
  { key: 'hasGenerator', label: 'Generator', icon: 'bolt' },
  { key: 'hasSecurityGuard', label: 'Security', icon: 'shield' },
  { key: 'hasParking', label: 'Parking', icon: 'directions_car' },
  { key: 'hasElevator', label: 'Elevator', icon: 'elevator' },
  { key: 'hasBalcony', label: 'Balcony', icon: 'balcony' },
  { key: 'hasWifi', label: 'Wi-Fi', icon: 'wifi' },
  { key: 'furnished', label: 'Furnished', icon: 'chair' },
];

function parseType(raw: unknown): PropertyType | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const s = String(raw).trim().toLowerCase();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n >= 0 && n <= 6 ? (n as PropertyType) : undefined;
  }
  return TYPE_BY_NAME[s];
}

/** The URL is the single source of truth for the search. */
function filterFromParams(params: Params): PropertyFilter {
  const f: PropertyFilter = { sortBy: 'newest', page: 1, pageSize: 12 };

  if (params['keyword']) f.keyword = String(params['keyword']);

  const location = params['location'] ?? params['city'] ?? params['subCity'];
  if (location) f.location = String(location);

  const type = parseType(params['type']);
  if (type !== undefined) f.propertyType = type;

  const minPrice = Number(params['minPrice']);
  if (minPrice > 0) f.minPriceETB = minPrice;
  const maxPrice = Number(params['maxPrice']);
  if (maxPrice > 0) f.maxPriceETB = maxPrice;
  const beds = Number(params['minBedrooms']);
  if (beds > 0) f.minBedrooms = beds;
  const bathrooms = Number(params['minBathrooms']);
  if (bathrooms > 0) f.minBathrooms = bathrooms;
  const area = Number(params['minArea']);
  if (area > 0) f.minArea = area;

  if (['price_asc', 'price_desc', 'bedrooms'].includes(params['sort'])) f.sortBy = params['sort'];
  const page = Math.floor(Number(params['page']));
  if (page > 1) f.page = page;

  String(params['features'] ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .forEach(name => {
      const flag = FEATURE_TO_FLAG[name];
      if (flag) f[flag] = true;
    });

  return f;
}

function paramsFromFilter(f: PropertyFilter): Params {
  const p: Params = {};
  if (f.keyword && f.keyword.trim()) p['keyword'] = f.keyword.trim();
  if (f.location && f.location.trim()) p['location'] = f.location.trim();
  if (f.propertyType !== undefined && f.propertyType !== null) p['type'] = f.propertyType;
  if (f.minPriceETB && f.minPriceETB > 0) p['minPrice'] = f.minPriceETB;
  if (f.maxPriceETB && f.maxPriceETB > 0) p['maxPrice'] = f.maxPriceETB;
  if (f.minBedrooms) p['minBedrooms'] = f.minBedrooms;
  if (f.minBathrooms) p['minBathrooms'] = f.minBathrooms;
  if (f.minArea && f.minArea > 0) p['minArea'] = f.minArea;

  const features = Object.entries(FEATURE_TO_FLAG)
    .filter(([, flag]) => !!f[flag])
    .map(([name]) => name);
  if (features.length) p['features'] = features.join(',');

  if (f.sortBy && f.sortBy !== 'newest') p['sort'] = f.sortBy;
  if (f.page && f.page > 1) p['page'] = f.page;
  return p;
}

function sameParams(a: Params, b: Params): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (String(a[k] ?? '') !== String(b[k] ?? '')) return false;
  }
  return true;
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent],
  template: `
    <div class="search-page">
      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-bar-inner container">
          <div class="filter-grid">
            <div class="filter-col">
              <label class="filter-label" for="f-location">Location</label>
              <input
                id="f-location"
                type="search"
                class="form-control"
                list="place-list"
                autocomplete="off"
                placeholder="City, area or neighborhood"
                [(ngModel)]="filter.location"
                (keyup.enter)="applyFilters()"
                (change)="applyFilters()"
              />
              <datalist id="place-list">
                @for (place of places; track place) {
                  <option [value]="place"></option>
                }
              </datalist>
            </div>

            <div class="filter-col">
              <label class="filter-label" for="f-keyword">Keyword</label>
              <input
                id="f-keyword"
                type="search"
                class="form-control"
                autocomplete="off"
                placeholder="Title or description"
                [(ngModel)]="filter.keyword"
                (keyup.enter)="applyFilters()"
                (change)="applyFilters()"
              />
            </div>

            <div class="filter-col">
              <label class="filter-label" for="f-type">Property type</label>
              <select
                id="f-type"
                class="form-control"
                [(ngModel)]="selectedTypeString"
                (change)="onTypeChange()"
              >
                <option value="all">All types</option>
                @for (t of typeOptions; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label">Total rent (ETB)</label>
              <div class="range-row">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  class="form-control"
                  placeholder="Min"
                  aria-label="Minimum rent in ETB"
                  [(ngModel)]="filter.minPriceETB"
                  (change)="applyFilters()"
                />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  class="form-control"
                  placeholder="Max"
                  aria-label="Maximum rent in ETB"
                  [(ngModel)]="filter.maxPriceETB"
                  (change)="applyFilters()"
                />
              </div>
            </div>

            <div class="filter-col">
              <label class="filter-label" for="f-beds">Bedrooms</label>
              <select
                id="f-beds"
                class="form-control"
                [(ngModel)]="filter.minBedrooms"
                (change)="applyFilters()"
              >
                <option [ngValue]="undefined">Any</option>
                <option [ngValue]="1">1+</option>
                <option [ngValue]="2">2+</option>
                <option [ngValue]="3">3+</option>
                <option [ngValue]="4">4+</option>
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label" for="f-baths">Bathrooms</label>
              <select
                id="f-baths"
                class="form-control"
                [(ngModel)]="filter.minBathrooms"
                (change)="applyFilters()"
              >
                <option [ngValue]="undefined">Any</option>
                <option [ngValue]="1">1+</option>
                <option [ngValue]="2">2+</option>
                <option [ngValue]="3">3+</option>
              </select>
            </div>

            <div class="filter-col">
              <label class="filter-label" for="f-size">Min size (m²)</label>
              <input
                id="f-size"
                type="number"
                min="0"
                step="5"
                class="form-control"
                placeholder="Any"
                [(ngModel)]="filter.minArea"
                (change)="applyFilters()"
              />
            </div>
          </div>

          <div class="amenity-chips">
            @for (chip of chips; track chip.key) {
              <label class="amenity-chip" [class.active]="isChipOn(chip.key)">
                <input
                  type="checkbox"
                  [checked]="isChipOn(chip.key)"
                  (change)="toggleChip(chip.key)"
                />
                <span class="material-icons-outlined" aria-hidden="true">{{ chip.icon }}</span>
                {{ chip.label }}
              </label>
            }
          </div>
        </div>
      </div>

      <div class="container page-body">
        <div class="results-bar">
          <div class="results-count">
            @if (!isLoading) {
              <strong>{{ totalCount | number }}</strong>
              {{ totalCount === 1 ? 'home' : 'homes' }} available{{
                filter.location ? ' in ' + filter.location : ''
              }}
            }
          </div>
          <div class="results-actions">
            <div class="sort-box">
              <label class="sort-label" for="f-sort">Sort</label>
              <select
                id="f-sort"
                class="sort-select"
                [(ngModel)]="filter.sortBy"
                (change)="applyFilters()"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="bedrooms">Most bedrooms</option>
              </select>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="resetFilters()">Clear all filters</button>
          </div>
        </div>

        @if (notice) {
          <p class="modal-sub" role="status">{{ notice }}</p>
        }

        @if (!isLoading) {
          <div class="notify-bar">
            <div>
              <strong>Be the first to contact landlords</strong>
              <span>We'll email you when a new home matches this search.</span>
            </div>
            <button class="btn btn-primary btn-sm" (click)="openSaveSearchModal()">
              Notify me
            </button>
          </div>
        }

        <!-- Save search modal -->
        @if (isSaveSearchModalOpen) {
          <div class="modal-backdrop" (click)="isSaveSearchModalOpen = false">
            <div
              class="modal-card"
              role="dialog"
              aria-modal="true"
              aria-label="Create notification"
              (click)="$event.stopPropagation()"
            >
              <div class="modal-hdr">
                <h3>Create notification</h3>
                <button class="close-x" aria-label="Close" (click)="isSaveSearchModalOpen = false">
                  ×
                </button>
              </div>
              <div class="modal-bdy">
                <p class="modal-sub">
                  We'll email you about new homes that match: <strong>{{ alertSummary() }}</strong>
                </p>
                @if (hasUnsavedExtras()) {
                  <p class="modal-sub">
                    Size and amenity filters aren't part of notifications yet, so you may get a few
                    extra matches.
                  </p>
                }
                <div class="form-group">
                  <label class="form-label" for="alert-name">Name</label>
                  <input
                    id="alert-name"
                    type="text"
                    [(ngModel)]="saveSearchName"
                    class="form-control"
                  />
                </div>
                <label class="check-row">
                  <input type="checkbox" [(ngModel)]="saveSearchAlertEmail" />
                  <span>Send email notifications for new matches</span>
                </label>
              </div>
              <div class="modal-ftr">
                <button class="btn btn-outline btn-sm" (click)="isSaveSearchModalOpen = false">
                  Cancel
                </button>
                <button
                  class="btn btn-primary btn-sm"
                  [disabled]="isSavingSearch || !saveSearchName.trim()"
                  (click)="saveSearch()"
                >
                  {{ isSavingSearch ? 'Saving…' : 'Create notification' }}
                </button>
              </div>
            </div>
          </div>
        }

        @if (isLoading) {
          <div class="properties-grid">
            @for (_ of skeletons; track $index) {
              <div class="skeleton-card">
                <div class="sk-img"></div>
                <div class="sk-body">
                  <div class="sk-line sk-price"></div>
                  <div class="sk-line sk-specs"></div>
                  <div class="sk-line sk-title"></div>
                  <div class="sk-line sk-loc"></div>
                </div>
              </div>
            }
          </div>
        } @else if (properties.length === 0) {
          <div class="empty-state">
            <h2>No homes match this search</h2>
            <p>
              Widen the price range, remove a filter, or ask us to tell you when a match appears.
            </p>
            <div class="empty-actions">
              <button class="btn btn-outline" (click)="resetFilters()">Clear all filters</button>
              <button class="btn btn-primary" (click)="openSaveSearchModal()">Notify me</button>
            </div>
          </div>
        } @else {
          <div class="properties-grid">
            @for (prop of properties; track prop.id) {
              <app-property-card [property]="prop"></app-property-card>
            }
          </div>

          @if (totalPages > 1) {
            <nav class="pagination-bar" aria-label="Pagination">
              <button
                class="btn btn-outline btn-sm"
                [disabled]="currentPage === 1"
                (click)="changePage(currentPage - 1)"
              >
                Previous
              </button>
              @for (n of pageNumbers(); track $index) {
                @if (n === 0) {
                  <span class="page-gap">…</span>
                } @else {
                  <button
                    class="page-num"
                    [class.current]="n === currentPage"
                    [attr.aria-current]="n === currentPage ? 'page' : null"
                    (click)="changePage(n)"
                  >
                    {{ n }}
                  </button>
                }
              }
              <button
                class="btn btn-outline btn-sm"
                [disabled]="currentPage === totalPages"
                (click)="changePage(currentPage + 1)"
              >
                Next
              </button>
            </nav>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
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

      .amenity-chip input {
        display: none;
      }

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
        0% {
          background-position: -600px 0;
        }
        100% {
          background-position: 600px 0;
        }
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

      .sk-price {
        height: 22px;
        width: 55%;
      }
      .sk-specs {
        height: 14px;
        width: 70%;
      }
      .sk-title {
        height: 16px;
        width: 90%;
      }
      .sk-short {
        width: 65%;
      }
      .sk-loc {
        height: 14px;
        width: 80%;
        margin-top: 0.25rem;
      }

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
        max-width: 480px;
        width: 100%;
        box-shadow: var(--shadow-2xl);
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

      .close-x:hover {
        color: var(--danger);
      }

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

      .check-row input {
        accent-color: var(--primary);
      }

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
        .filter-grid {
          grid-template-columns: 1fr 1fr;
        }
        .page-body {
          padding: 1rem 1rem 3rem;
        }
        .filter-bar-inner {
          padding: 0.875rem 1rem;
        }
      }
    `,
  ],
})

export class PropertyListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly places = PLACES;
  readonly typeOptions = TYPE_OPTIONS;
  readonly chips = CHIPS;

  properties: PropertySummary[] = [];
  totalCount = 0;
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

  selectedTypeString = 'all';
  skeletons = Array(6);

  isSaveSearchModalOpen = false;
  isSavingSearch = false;
  saveSearchName = '';
  saveSearchAlertEmail = true;
  notice = '';

  filter: PropertyFilter = filterFromParams({});

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.interactionService.loadFavorites().subscribe();
    }

    this.route.queryParams.subscribe(params => {
      this.filter = filterFromParams(params);
      this.selectedTypeString =
        this.filter.propertyType !== undefined ? String(this.filter.propertyType) : 'all';
      this.loadProperties();
    });
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
      },
    });
  }

  /** Writes the filter to the URL. If nothing changed in the URL, just reloads the results. */
  private commit() {
    const next = paramsFromFilter(this.filter);
    if (sameParams(next, this.route.snapshot.queryParams)) {
      this.loadProperties();
      return;
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  applyFilters() {
    this.filter.page = 1;
    this.commit();
  }

  changePage(newPage: number) {
    this.filter.page = newPage;
    this.commit();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters() {
    this.filter = filterFromParams({});
    this.selectedTypeString = 'all';
    this.commit();
  }

  onTypeChange() {
    this.filter.propertyType =
      this.selectedTypeString === 'all' ? undefined : (Number(this.selectedTypeString) as PropertyType);
    this.applyFilters();
  }

  isChipOn(key: FlagKey): boolean {
    return !!this.filter[key];
  }

  toggleChip(key: FlagKey) {
    this.filter[key] = this.filter[key] ? undefined : true;
    this.applyFilters();
  }

  pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [...new Set([1, total, cur - 1, cur, cur + 1])]
      .filter(p => p >= 1 && p <= total)
      .sort((a, b) => a - b);

    const out: number[] = [];
    pages.forEach((p, i) => {
      if (i > 0 && p - pages[i - 1] > 1) out.push(0); // 0 renders as "…"
      out.push(p);
    });
    return out;
  }

  /* ───────── Notifications (saved searches) ───────── */

  alertSummary(): string {
    const f = this.filter;
    const typeLabel =
      f.propertyType !== undefined ? TYPE_OPTIONS.find(t => t.value === f.propertyType)?.label : undefined;
    const head = `${typeLabel ?? 'Any home'}${f.location ? ' in ' + f.location : ''}`;
    const tail: string[] = [];
    if (f.minBedrooms) tail.push(`${f.minBedrooms}+ bedrooms`);
    if (f.minPriceETB) tail.push(`from ${f.minPriceETB.toLocaleString('en-US')} ETB`);
    if (f.maxPriceETB) tail.push(`up to ${f.maxPriceETB.toLocaleString('en-US')} ETB`);
    return [head, ...tail].join(', ');
  }

  hasUnsavedExtras(): boolean {
    const f = this.filter;
    return !!f.minArea || CHIPS.some(c => !!f[c.key]);
  }

  openSaveSearchModal() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.saveSearchName = this.alertSummary().slice(0, 80);
    this.isSaveSearchModalOpen = true;
  }

  saveSearch() {
    if (!this.saveSearchName.trim()) return;
    this.isSavingSearch = true;

    // A saved alert stores a city OR a sub-city. A neighborhood such as "CMC" goes in the sub-city slot.
    const loc = this.filter.location?.trim();
    const isCity = !!loc && CITY_NAMES.includes(loc.toLowerCase());

    this.interactionService.createSavedSearch({
      name: this.saveSearchName.trim(),
      city: isCity ? loc : undefined,
      subCity: loc && !isCity ? loc : undefined,
      minPriceETB: this.filter.minPriceETB && this.filter.minPriceETB > 0 ? this.filter.minPriceETB : undefined,
      maxPriceETB: this.filter.maxPriceETB && this.filter.maxPriceETB > 0 ? this.filter.maxPriceETB : undefined,
      minBedrooms: this.filter.minBedrooms,
      propertyType: this.filter.propertyType !== undefined ? String(this.filter.propertyType) : undefined,
      alertEmailEnabled: this.saveSearchAlertEmail,
    }).subscribe({
      next: (res) => {
        this.isSavingSearch = false;
        this.isSaveSearchModalOpen = false;
        this.showNotice(
          res.succeeded
            ? 'Notification created. You can pause or delete it from Saved searches.'
            : (res.errors?.[0] ?? 'We could not create the notification. Try again.')
        );
      },
      error: (err) => {
        this.isSavingSearch = false;
        this.showNotice(err?.error?.errors?.[0] ?? 'We could not create the notification. Try again.');
      },
    });
  }

  private showNotice(message: string) {
    this.notice = message;
    setTimeout(() => (this.notice = ''), 6000);
  }
}
