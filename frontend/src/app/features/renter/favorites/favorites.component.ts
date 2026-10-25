import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InteractionService } from '../../../core/services/interaction.service';
import { PropertySummary } from '../../../core/models/property.model';
import { PropertyCardComponent } from '../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, PropertyCardComponent],
  template: `
    <div class="favorites-page container">
      <div class="page-header">
        <div>
          <span class="badge badge-rose">Rentola-Inspired Saved Homes</span>
          <h1 class="page-title">My Saved Favorites</h1>
          <p class="page-subtitle">Quickly compare and keep track of Ethiopian properties you've shortlisted.</p>
        </div>
        <a routerLink="/properties" class="btn btn-outline">Explore More Listings</a>
      </div>

      @if (isLoading) {
        <div class="loading-state">
          <p>Loading your saved favorites...</p>
        </div>
      } @else if (favorites.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">♥</div>
          <h3>You haven't saved any listings yet</h3>
          <p>Click the heart icon on any property card to save it for later inspection.</p>
          <a routerLink="/properties" class="btn btn-primary">Browse Available Properties</a>
        </div>
      } @else {
        <div class="properties-grid">
          @for (property of favorites; track property.id) {
            <div class="fav-card-wrapper">
              <app-property-card [property]="property"></app-property-card>
              <button class="btn-remove-fav" (click)="removeFavorite(property.id)">
                ✕ Remove from Favorites
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .favorites-page {
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
    .badge-rose {
      background: #ffe4e6;
      color: #e11d48;
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 0.5rem;
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
      font-size: 3.5rem;
      color: #f43f5e;
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
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.75rem;
    }
    .fav-card-wrapper {
      display: flex;
      flex-direction: column;
    }
    .btn-remove-fav {
      margin-top: 0.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      color: #ef4444;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-remove-fav:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  `]
})
export class FavoritesComponent implements OnInit {
  private interactionService = inject(InteractionService);

  favorites: PropertySummary[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.isLoading = true;
    this.interactionService.loadFavorites().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.favorites = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  removeFavorite(propertyId: string) {
    this.interactionService.toggleFavorite(propertyId).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.favorites = this.favorites.filter(p => p.id !== propertyId);
        }
      }
    });
  }
}
