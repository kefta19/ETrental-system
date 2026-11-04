import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { PropertyService } from '../../../core/services/property.service';
import { RenterDashboard } from '../../../core/models/dashboard.model';
import { SavedSearch } from '../../../core/models/interaction.model';
import { PropertySummary } from '../../../core/models/property.model';
import { parseSearchQuery, toQueryParams } from '../../../core/utils/search-query-parser';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-renter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PropertyCardComponent],
  templateUrl: './renter-dashboard.component.html',
  styleUrl: './renter-dashboard.component.css',
})
export class RenterDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly interactionService = inject(InteractionService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly dashboard = signal<RenterDashboard | null>(null);
  readonly dashboardLoading = signal(true);
  readonly dashboardError = signal<string | null>(null);
  readonly recommended = signal<PropertySummary[]>([]);
  readonly recommendedState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly savedSearches = signal<SavedSearch[]>([]);
  readonly savedSearchesLoading = signal(true);

  query = '';

  ngOnInit(): void {
    this.loadDashboard();
    this.loadRecommended();
    this.loadSavedSearches();
    this.interactionService.loadFavorites().subscribe({ error: () => undefined });
  }

  loadDashboard(): void {
    this.dashboardLoading.set(true);
    this.dashboardError.set(null);
    this.dashboardService.getRenterDashboard().subscribe({
      next: (res) => {
        this.dashboardLoading.set(false);
        if (res.succeeded && res.data) {
          this.dashboard.set(res.data);
          return;
        }
        this.dashboardError.set(
          res.errors.length > 0
            ? res.errors.join(' ')
            : 'The dashboard service returned an empty response.',
        );
      },
      error: () => {
        this.dashboardLoading.set(false);
        this.dashboardError.set(
          'We could not reach the server. Please check your connection and try again.',
        );
      },
    });
  }

  private loadRecommended(): void {
    this.recommendedState.set('loading');
    this.propertyService.search({ sortBy: 'newest', page: 1, pageSize: 4 }).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.recommended.set(res.data.items);
          this.recommendedState.set('ready');
          return;
        }
        this.recommendedState.set('error');
      },
      error: () => this.recommendedState.set('error'),
    });
  }

  private loadSavedSearches(): void {
    this.savedSearchesLoading.set(true);
    this.interactionService.getSavedSearches().subscribe({
      next: (res) => {
        this.savedSearchesLoading.set(false);
        if (res.succeeded && res.data) {
          this.savedSearches.set(res.data);
        }
      },
      error: () => this.savedSearchesLoading.set(false),
    });
  }

  onSearch(): void {
    this.router.navigate(['/properties'], {
      queryParams: toQueryParams(parseSearchQuery(this.query)),
    });
  }

  useExample(example: string): void {
    this.query = example;
    this.onSearch();
  }

  runSavedSearch(search: SavedSearch): void {
    this.router.navigate(['/properties'], {
      queryParams: {
        location: search.subCity || search.city || undefined,
        type: search.propertyType || undefined,
        minPrice: search.minPriceETB || undefined,
        maxPrice: search.maxPriceETB || undefined,
        minBedrooms: search.minBedrooms || undefined,
      },
    });
  }

  savedSearchSummary(search: SavedSearch): string {
    const parts: string[] = [];
    const place = search.subCity || search.city;
    if (place) parts.push(place);
    if (search.propertyType) parts.push(this.typeLabel(search.propertyType));
    if (search.minBedrooms) parts.push(`${search.minBedrooms}+ beds`);

    if (search.minPriceETB && search.maxPriceETB) {
      parts.push(
        `${search.minPriceETB.toLocaleString('en-US')}–${search.maxPriceETB.toLocaleString('en-US')} ETB`,
      );
    } else if (search.maxPriceETB) {
      parts.push(`Up to ${search.maxPriceETB.toLocaleString('en-US')} ETB`);
    } else if (search.minPriceETB) {
      parts.push(`From ${search.minPriceETB.toLocaleString('en-US')} ETB`);
    }

    return parts.join(' · ') || 'All homes in Ethiopia';
  }

  private readonly typeNames = [
    'Apartment',
    'Condominium',
    'Villa',
    'G+1 house',
    'Studio',
    'Service quarter',
    'Commercial',
  ];

  private typeLabel(value: unknown): string {
    const n = Number(value);
    return Number.isInteger(n) && this.typeNames[n] ? this.typeNames[n] : String(value ?? '');
  }
}
