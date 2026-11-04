import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PropertySummary } from '../../../core/models/property.model';
import { AdminService } from '../../../core/services/admin.service';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-admin-published-listings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Published listings</h1>
          <p>Review active public listings and unpublish content that violates platform policy.</p>
        </div>
        <button (click)="load()">Refresh listings</button>
      </header>
      <section class="content">
        @if (error) { <div class="alert">{{ error }}</div> }
        @if (loading) {
          <div class="state">Loading published listings…</div>
        } @else if (!listings.length) {
          <div class="state empty">No published listings were found.</div>
        } @else {
          <div class="listing-grid">
            @for (listing of listings; track listing.id) {
              <article class="listing">
                <img [src]="listing.primaryImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'" [alt]="listing.title" />
                <div class="details">
                  <h2>{{ listing.title }}</h2>
                  <p>{{ listing.city }}, {{ listing.subCity }} · {{ listing.propertyType }}</p>
                  <div class="meta">
                    <span>{{ listing.rentAmountETB | number:'1.0-0' }} ETB / month</span>
                    <span>{{ listing.landlordName }}</span>
                    <span>Published {{ listing.createdAtUtc | date:'mediumDate' }}</span>
                  </div>
                  <div class="actions">
                    <a [href]="'/properties/' + listing.id" target="_blank" rel="noopener">Open listing</a>
                    <button (click)="unpublish(listing)">Unpublish</button>
                  </div>
                </div>
              </article>
            }
          </div>
          @if (hasMore) {
            <div class="pagination">
              <span>Showing {{ listings.length }} results on this page.</span>
              <button (click)="loadNext()">Load more</button>
            </div>
          }
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100%; color:#172033; }
    .page { min-height:100%; background:var(--bg-page, #f5f7fb); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:1.5rem 2rem; background:white; border-bottom:1px solid #e5e9f0; }
    h1 { margin:0; font-size:1.45rem; letter-spacing:-.03em; }
    .page-header p { margin:.35rem 0 0; color:#697586; font-size:.9rem; }
    button { border:1px solid #d9e0e9; background:white; color:#344054; padding:.55rem .75rem; border-radius:8px; font-weight:700; cursor:pointer; }
    .content { padding:1.5rem 2rem; }
    .listing-grid { display:grid; gap:.8rem; }
    .listing { display:grid; grid-template-columns:175px 1fr; overflow:hidden; background:white; border:1px solid #e5e9f0; border-radius:13px; }
    .listing img { width:175px; height:100%; min-height:140px; object-fit:cover; background:#eef2f6; }
    .details { padding:1rem 1.15rem; min-width:0; }
    h2 { margin:0; font-size:1rem; }
    .details p { color:#667184; font-size:.82rem; margin:.35rem 0 .75rem; }
    .meta { display:flex; flex-wrap:wrap; gap:.4rem 1rem; color:#788397; font-size:.76rem; }
    .meta span:first-child { color:#246c57; font-weight:700; }
    .actions { display:flex; gap:.8rem; align-items:center; margin-top:.85rem; }
    .actions a { color:#2564aa; font-size:.8rem; font-weight:700; text-decoration:none; }
    .actions button { color:#a13f45; }
    .state { padding:3rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin-bottom:1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    @media(max-width:650px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } .listing { grid-template-columns:1fr; } .listing img { width:100%; height:170px; } }
  `]
})
export class PublishedListingsComponent implements OnInit {
  private adminService = inject(AdminService);
  private propertyService = inject(PropertyService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  listings: PropertySummary[] = [];
  loading = true;
  error = '';
  page = 1;
  readonly pageSize = 40;
  hasMore = false;

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.page = 1;
    this.propertyService.search({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: result => {
        this.loading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load published listings.';
          return;
        }
        this.listings = result.data.items;
        this.hasMore = result.data.hasNextPage;
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load published listings.';
        this.changeDetector.markForCheck();
      }
    });
  }

  loadNext(): void {
    const nextPage = this.page + 1;
    this.loading = true;
    this.propertyService.search({ page: nextPage, pageSize: this.pageSize }).subscribe({
      next: result => {
        this.loading = false;
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load more listings.';
          return;
        }
        this.page = nextPage;
        this.listings = [...this.listings, ...result.data.items];
        this.hasMore = result.data.hasNextPage;
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load more listings.';
      }
    });
  }

  unpublish(listing: PropertySummary): void {
    const reason = window.prompt(`Why are you unpublishing "${listing.title}"? (At least 5 characters)`);
    if (!reason?.trim() || reason.trim().length < 5) return;
    if (!window.confirm('This will remove the listing from public search and notify its owner. Continue?')) return;
    this.propertyService.unpublishListing(listing.id, reason.trim()).subscribe({
      next: result => {
        if (!result.succeeded) {
          this.error = result.errors?.[0] || 'Unable to unpublish this listing.';
          return;
        }
        this.listings = this.listings.filter(item => item.id !== listing.id);
      },
      error: err => this.error = err.error?.errors?.[0] || 'Unable to unpublish this listing.'
    });
  }
}
