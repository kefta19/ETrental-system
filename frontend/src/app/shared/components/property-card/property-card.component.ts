import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { PropertySummary } from '../../../core/models/property.model';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="property-card">
      <!-- Image Carousel Area -->
      <div class="card-media">
        <a [routerLink]="['/properties', property.id]">
          <img 
            [src]="currentImage" 
            [alt]="property.title" 
            class="property-img"
            loading="lazy"
          />
        </a>

        <!-- Top Badges -->
        <div class="media-badges">
          @if (property.advanceMonthsRequired > 0) {
            <span class="pill pill-advance">{{ property.advanceMonthsRequired }} Mo. Advance</span>
          }
          @if (property.isVerifiedHost) {
            <span class="pill pill-verified">✓ Verified Agency</span>
          }
        </div>

        <!-- Carousel navigation arrows if more than 1 image -->
        @if (property.imageUrls.length > 1) {
          <button class="carousel-arrow arrow-left" (click)="prevImage($event)">‹</button>
          <button class="carousel-arrow arrow-right" (click)="nextImage($event)">›</button>

          <!-- Carousel dots -->
          <div class="carousel-dots">
            @for (img of property.imageUrls; track $index) {
              <span 
                class="dot" 
                [class.active]="activeImageIndex === $index"
                (click)="setImage($index, $event)"
              ></span>
            }
          </div>
        }

        <!-- Heart Favorite Button -->
        <button class="fav-btn" [class.favorited]="isFavorited" (click)="toggleFavorite($event)">
          ♥
        </button>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <!-- Price in ETB -->
        <div class="price-row">
          <div class="price-value">
            {{ property.rentAmountETB | number }} <span class="currency">ETB</span>
            <span class="period">/ month</span>
          </div>
          @if (property.hasWaterTank || property.hasGenerator) {
            <div class="amenity-icons" title="Features Water Tank and/or Generator">
              @if (property.hasWaterTank) { <span class="icon-tag">💧 Rotto</span> }
              @if (property.hasGenerator) { <span class="icon-tag">⚡ Gen</span> }
            </div>
          }
        </div>

        <!-- Specs: Beds, Baths, Area -->
        <div class="specs-row">
          <span class="spec-item"><strong>{{ property.bedrooms }}</strong> beds</span>
          <span class="spec-dot">•</span>
          <span class="spec-item"><strong>{{ property.bathrooms }}</strong> baths</span>
          @if (property.areaSquareMeters) {
            <span class="spec-dot">•</span>
            <span class="spec-item">{{ property.areaSquareMeters }} m²</span>
          }
        </div>

        <!-- Title -->
        <h3 class="card-title">
          <a [routerLink]="['/properties', property.id]">{{ property.title }}</a>
        </h3>

        <!-- Ethiopian Location -->
        <div class="location-row">
          <span class="location-pin">📍</span>
          <span class="location-text">
            {{ property.neighborhood }}, {{ property.subCity }}, {{ property.city }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Card shell ── */
    .property-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }

    .property-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-xl);
    }

    /* ── Media / image area ── */
    .card-media {
      position: relative;
      height: 210px;
      background: var(--border-color);
      overflow: hidden;
      flex-shrink: 0;
    }

    .property-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s ease;
    }

    .property-card:hover .property-img {
      transform: scale(1.04);
    }

    /* ── Badges ── */
    .media-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      z-index: 10;
    }

    .pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      backdrop-filter: blur(6px);
      letter-spacing: 0.02em;
    }

    .pill-advance {
      background: rgba(15, 23, 42, 0.78);
      color: #ffffff;
    }

    .pill-verified {
      background: rgba(5, 150, 105, 0.92);
      color: #ffffff;
    }

    /* ── Favorite heart button ── */
    .fav-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
      transition: all var(--transition-base);
      z-index: 10;
      box-shadow: var(--shadow-sm);
    }

    .fav-btn:hover { background: #fff; color: #f43f5e; transform: scale(1.15); }
    .fav-btn.favorited { background: #fff; color: #ef4444; }

    /* ── Carousel arrows ── */
    .carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.52);
      color: #fff;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity var(--transition-base);
      z-index: 10;
    }

    .card-media:hover .carousel-arrow { opacity: 1; }
    .arrow-left  { left: 8px; }
    .arrow-right { right: 8px; }

    /* ── Carousel dots ── */
    .carousel-dots {
      position: absolute;
      bottom: 9px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
      z-index: 10;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .dot.active {
      background: #ffffff;
      width: 16px;
      border-radius: 9999px;
    }

    /* ── Card body ── */
    .card-body {
      padding: 1.1rem 1.25rem 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0;
    }

    /* ── Price row ── */
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .price-value {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--secondary);
      line-height: 1.2;
    }

    .currency {
      color: var(--primary);
      font-size: 0.95rem;
      font-weight: 700;
    }

    .period {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* ── Feature chips (water/gen) ── */
    .amenity-icons {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .icon-tag {
      font-size: 0.68rem;
      font-weight: 700;
      background: var(--primary-lighter);
      color: var(--primary-dark);
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(16,185,129,0.2);
    }

    /* ── Specs row ── */
    .specs-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 0.55rem;
    }

    .spec-item strong { color: var(--secondary); font-weight: 700; }
    .spec-dot { color: var(--border-color); }

    /* ── Title ── */
    .card-title {
      font-size: 0.975rem;
      font-weight: 700;
      line-height: 1.45;
      margin-bottom: 0.625rem;
      color: var(--secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.85em;
    }

    .card-title a { color: inherit; text-decoration: none; }
    .card-title a:hover { color: var(--primary); }

    /* ── Location ── */
    .location-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: auto;
      padding-top: 0.625rem;
      border-top: 1px solid var(--border-color-light);
    }

    .location-pin {
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .location-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Skeleton loading card (used by property-list) ── */
    :host(.skeleton) .property-card {
      pointer-events: none;
    }
  `]
})
export class PropertyCardComponent {
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input({ required: true }) property!: PropertySummary;

  activeImageIndex = 0;

  get isFavorited(): boolean {
    return this.interactionService.isFavorited(this.property.id);
  }

  get currentImage(): string {
    if (this.property.imageUrls && this.property.imageUrls.length > 0) {
      return this.property.imageUrls[this.activeImageIndex];
    }
    return this.property.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  }

  nextImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.property.imageUrls.length > 0) {
      this.activeImageIndex = (this.activeImageIndex + 1) % this.property.imageUrls.length;
    }
  }

  prevImage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.property.imageUrls.length > 0) {
      this.activeImageIndex = (this.activeImageIndex - 1 + this.property.imageUrls.length) % this.property.imageUrls.length;
    }
  }

  setImage(index: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.activeImageIndex = index;
  }

  toggleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authService.currentUser()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/properties' } });
      return;
    }
    this.interactionService.toggleFavorite(this.property.id).subscribe();
  }
}
