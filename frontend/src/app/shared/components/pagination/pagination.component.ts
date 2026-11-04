import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fluent-pagination" *ngIf="totalItems > 0">
      <div class="pagination-info">
        Showing <strong>{{ startItem }}</strong> to <strong>{{ endItem }}</strong> of <strong>{{ totalItems }}</strong> entries
      </div>

      <div class="pagination-controls" *ngIf="totalPages > 1">
        <button
          type="button"
          class="page-btn prev-next"
          [disabled]="currentPage <= 1"
          (click)="goToPage(currentPage - 1)"
          aria-label="Previous page">
          <span class="material-icons-outlined" aria-hidden="true">chevron_left</span>
          <span>Previous</span>
        </button>

        <div class="page-numbers">
          <ng-container *ngFor="let page of visiblePages">
            <button
              *ngIf="page !== -1"
              type="button"
              class="page-btn number"
              [class.active]="page === currentPage"
              (click)="goToPage(page)">
              {{ page }}
            </button>
            <span *ngIf="page === -1" class="page-ellipsis">…</span>
          </ng-container>
        </div>

        <button
          type="button"
          class="page-btn prev-next"
          [disabled]="currentPage >= totalPages"
          (click)="goToPage(currentPage + 1)"
          aria-label="Next page">
          <span>Next</span>
          <span class="material-icons-outlined" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      margin-top: 1.5rem;
    }

    .fluent-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.85rem;
      color: #475569;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    .pagination-info strong {
      color: #0f172a;
      font-weight: 600;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .page-btn.prev-next {
      padding: 0 0.65rem;
      gap: 0.2rem;
      border-color: #e2e8f0;
      background: #f8fafc;
    }

    .page-btn.prev-next .material-icons-outlined {
      font-size: 1.1rem;
    }

    .page-btn:hover:not(:disabled) {
      background: #f0fdf4;
      border-color: #a7f3d0;
      color: #047857;
    }

    .page-btn.active {
      background: #10b981;
      border-color: #059669;
      color: #ffffff;
      font-weight: 700;
    }

    .page-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #94a3b8;
    }

    .page-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      color: #94a3b8;
      font-weight: 700;
    }

    @media (max-width: 640px) {
      .fluent-pagination {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 6;
  @Input() currentPage = 1;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [1];

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }

    pages.push(total);
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
