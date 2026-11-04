import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { PropertySummary, PropertyStatus } from '../../../core/models/property.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  templateUrl: './my-properties.component.html',
  styleUrls: ['./my-properties.component.css']
})
export class MyPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private changeDetector = inject(ChangeDetectorRef);

  properties: PropertySummary[] = [];
  selectedStatus?: number = undefined;
  isLoading = true;
  loadError = '';
  isSubmitting = false;

  currentPage = 1;
  pageSize = 5;

  get pagedProperties(): PropertySummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.properties.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectedPropForRented: PropertySummary | null = null;
  selectedPropForPayment: PropertySummary | null = null;
  listingFeeProvider = '';
  listingFeeReference = '';
  listingFeeTransactionUrl = '';
  paymentError = '';
  readonly listingFeeETB = 1000;
  rentedTenantName = '';
  rentedAmountETB = 0;
  rentedLeaseMonths = 12;
  rentedStartDate = '';

  ngOnInit() {
    this.loadProperties();
  }

  setStatus(status?: number) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadProperties();
  }

  loadProperties() {
    this.isLoading = true;
    this.loadError = '';
    this.propertyService.getMyProperties(this.selectedStatus).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.properties = res.data;
        } else {
          this.loadError = res.errors?.join(' ') || 'Your properties could not be loaded.';
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError = error.error?.errors?.[0] || 'We could not reach the server. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  submitForReview(id: string) {
    this.selectedPropForPayment = this.properties.find((property) => property.id === id) ?? null;
    this.listingFeeProvider = '';
    this.listingFeeReference = '';
    this.listingFeeTransactionUrl = '';
    this.paymentError = '';
    if (
      this.selectedPropForPayment?.listingFeeStatus === 1
      || this.selectedPropForPayment?.listingFeeStatus === 2
    ) {
      this.listingFeeProvider = this.selectedPropForPayment.listingFeeProvider ?? '';
      this.listingFeeReference = this.selectedPropForPayment.listingFeeReference ?? '';
      const submittedReference = this.selectedPropForPayment.listingFeeReference ?? '';
      this.listingFeeTransactionUrl = this.selectedPropForPayment.listingFeeTransactionUrl
        ?? (this.isValidTransactionUrl(submittedReference) ? submittedReference : '');
    }
  }

  confirmSubmitForReview() {
    if (!this.selectedPropForPayment || !this.listingFeeProvider || !this.listingFeeReference.trim()) {
      this.paymentError = 'Choose a payment method and enter the transaction reference.';
      return;
    }
    if (!this.listingFeeTransactionUrl.trim() || !this.isValidTransactionUrl(this.listingFeeTransactionUrl)) {
      this.paymentError = 'Enter a valid HTTPS transaction link from your payment provider.';
      return;
    }

    this.isSubmitting = true;
    this.propertyService.submitForReview(this.selectedPropForPayment.id, {
      listingFeeProvider: this.listingFeeProvider,
      listingFeeReference: this.listingFeeReference.trim(),
      listingFeeTransactionUrl: this.listingFeeTransactionUrl.trim() || null,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedPropForPayment = null;
        alert('Listing submitted for payment verification and admin review.');
        this.loadProperties();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.paymentError = error.error?.errors?.[0] || 'The listing could not be submitted for review.';
      },
    });
  }

  private isValidTransactionUrl(value: string): boolean {
    if (!value.trim()) return false;
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  toggleAvailability(id: string) {
    this.propertyService.toggleAvailability(id).subscribe({
      next: () => {
        this.loadProperties();
      }
    });
  }

  openRentedModal(prop: PropertySummary) {
    this.selectedPropForRented = prop;
    this.rentedTenantName = '';
    this.rentedAmountETB = prop.rentAmountETB;
    this.rentedLeaseMonths = 12;
    this.rentedStartDate = new Date().toISOString().substring(0, 10);
  }

  confirmMarkAsRented() {
    if (!this.selectedPropForRented) return;
    this.isSubmitting = true;
    this.propertyService.markAsRented(this.selectedPropForRented.id, {
      tenantName: this.rentedTenantName,
      agreedRentAmountETB: this.rentedAmountETB,
      agreedLeaseMonths: this.rentedLeaseMonths,
      tenancyStartDateUtc: new Date(this.rentedStartDate).toISOString()
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.succeeded) {
          this.selectedPropForRented = null;
          this.loadProperties();
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  deleteProperty(id: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    this.propertyService.deleteProperty(id).subscribe({
      next: () => {
        this.loadProperties();
      }
    });
  }

  getStatusLabel(status: PropertyStatus): string {
    return PropertyStatus[status] || 'Unknown';
  }
}
