import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { PropertySummary, PropertyStatus } from '../../../core/models/property.model';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-properties.component.html',
  styleUrls: ['./my-properties.component.css']
})
export class MyPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);

  properties: PropertySummary[] = [];
  selectedStatus?: number = undefined;
  isLoading = true;
  isSubmitting = false;

  selectedPropForRented: PropertySummary | null = null;
  rentedTenantName = '';
  rentedAmountETB = 0;
  rentedLeaseMonths = 12;
  rentedStartDate = '';

  ngOnInit() {
    this.loadProperties();
  }

  setStatus(status?: number) {
    this.selectedStatus = status;
    this.loadProperties();
  }

  loadProperties() {
    this.isLoading = true;
    this.propertyService.getMyProperties(this.selectedStatus).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.properties = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  submitForReview(id: string) {
    this.propertyService.submitForReview(id).subscribe({
      next: () => {
        alert('Listing submitted for admin moderation review.');
        this.loadProperties();
      }
    });
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
