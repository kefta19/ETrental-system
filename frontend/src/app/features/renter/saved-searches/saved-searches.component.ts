import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { InteractionService } from '../../../core/services/interaction.service';
import { SavedSearch } from '../../../core/models/interaction.model';

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="saved-searches-page container">
      <div class="page-header">
        <div>
          <span class="badge badge-green">Automated Search Alerts</span>
          <h1 class="page-title">My Saved Searches</h1>
          <p class="page-subtitle">Instant alert criteria configured for Ethiopian rental properties.</p>
        </div>
        <a routerLink="/properties" class="btn btn-outline">Create New Search</a>
      </div>

      @if (isLoading) {
        <div class="loading-state">
          <p>Loading your saved searches...</p>
        </div>
      } @else if (savedSearches.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>No search alerts configured yet</h3>
          <p>When searching on ETrental, click "Save Search & Get Alerts" to receive updates as soon as new properties match.</p>
          <a routerLink="/properties" class="btn btn-primary">Find Rentals</a>
        </div>
      } @else {
        <div class="searches-grid">
          @for (item of savedSearches; track item.id) {
            <div class="search-card">
              <div class="search-card-header">
                <h3>{{ item.name }}</h3>
                <span class="pill-alert" [class.active]="item.alertEmailEnabled">
                  {{ item.alertEmailEnabled ? '✓ Email Alerts Active' : 'Alerts Paused' }}
                </span>
              </div>

              <div class="criteria-list">
                <div class="crit-item">
                  <span class="crit-lbl">Locality:</span>
                  <strong>{{ item.subCity || item.city || 'All Addis Ababa' }}</strong>
                </div>
                @if (item.minPriceETB || item.maxPriceETB) {
                  <div class="crit-item">
                    <span class="crit-lbl">Budget:</span>
                    <strong>{{ item.minPriceETB || 0 | number }} – {{ item.maxPriceETB ? (item.maxPriceETB | number) + ' ETB' : 'Unlimited' }}</strong>
                  </div>
                }
                @if (item.minBedrooms) {
                  <div class="crit-item">
                    <span class="crit-lbl">Bedrooms:</span>
                    <strong>{{ item.minBedrooms }}+ Beds</strong>
                  </div>
                }
                @if (item.propertyType) {
                  <div class="crit-item">
                    <span class="crit-lbl">Type:</span>
                    <strong>{{ item.propertyType }}</strong>
                  </div>
                }
              </div>

              <div class="card-actions">
                <button class="btn btn-primary btn-sm" (click)="executeSearch(item)">
                  🔍 Run Search
                </button>
                <button class="btn btn-outline-danger btn-sm" (click)="deleteSearch(item.id)">
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .saved-searches-page {
      padding: 2.5rem 1.5rem 4rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-subtitle {
      color: var(--text-muted);
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 5rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .searches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .search-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .search-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .search-card-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .pill-alert {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #64748b;
      font-weight: 600;
    }
    .pill-alert.active {
      background: #ecfdf5;
      color: #065f46;
    }
    .criteria-list {
      margin-bottom: 1.25rem;
      border-top: 1px solid #f8fafc;
      padding-top: 0.75rem;
    }
    .crit-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      margin-bottom: 0.4rem;
    }
    .crit-lbl {
      color: var(--text-muted);
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid #f1f5f9;
      padding-top: 1rem;
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }
    .btn-outline-danger {
      background: transparent;
      border: 1px solid #fca5a5;
      color: #ef4444;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
    }
    .btn-outline-danger:hover {
      background: #fee2e2;
    }
  `]
})
export class SavedSearchesComponent implements OnInit {
  private interactionService = inject(InteractionService);
  private router = inject(Router);

  savedSearches: SavedSearch[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadSavedSearches();
  }

  loadSavedSearches() {
    this.isLoading = true;
    this.interactionService.getSavedSearches().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.savedSearches = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  executeSearch(search: SavedSearch) {
    this.router.navigate(['/properties'], {
      queryParams: {
        subCity: search.subCity || undefined,
        maxPrice: search.maxPriceETB || undefined,
        minBedrooms: search.minBedrooms || undefined
      }
    });
  }

  deleteSearch(id: string) {
    this.interactionService.deleteSavedSearch(id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.savedSearches = this.savedSearches.filter(s => s.id !== id);
        }
      }
    });
  }
}
