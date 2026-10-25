import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  private router = inject(Router);
  authService = inject(AuthService);

  selectedCity = '';
  selectedType = 'All';
  selectedBudget = '0';

  // New listings data (mock data - will be replaced with API calls)
  newListings = [
    {
      id: 1,
      price: 25000,
      currency: 'ETB',
      title: '2 rooms apartment of 85m²',
      location: 'Bole, Addis Ababa',
      isNew: true,
      imageClass: ''
    },
    {
      id: 2,
      price: 60000,
      currency: 'ETB',
      title: '4 rooms house of 250m²',
      location: 'CMC, Addis Ababa',
      isNew: false,
      imageClass: 'listing-image-2'
    },
    {
      id: 3,
      price: 12000,
      currency: 'ETB',
      title: '1 room apartment of 40m²',
      location: 'Kazanchis, Addis Ababa',
      isNew: true,
      imageClass: 'listing-image-3'
    },
    {
      id: 4,
      price: 35000,
      currency: 'ETB',
      title: '3 rooms apartment of 150m²',
      location: 'Sarbet, Addis Ababa',
      isNew: false,
      imageClass: 'listing-image-4'
    }
  ];

  // Featured properties data
  featuredProperties = [
    {
      id: 1,
      price: 25000,
      currency: 'ETB',
      title: 'Modern Apartment in Bole',
      location: 'Bole, Addis Ababa',
      features: ['🛏️ 2 beds', '🛁 2 baths', '🚗 Parking'],
      imageClass: ''
    },
    {
      id: 2,
      price: 60000,
      currency: 'ETB',
      title: 'Spacious Villa in CMC',
      location: 'CMC, Addis Ababa',
      features: ['🛏️ 4 beds', '🛁 3 baths', '🌻 Garden'],
      imageClass: 'featured-image-2'
    },
    {
      id: 3,
      price: 12000,
      currency: 'ETB',
      title: 'Cozy Studio in Kazanchis',
      location: 'Kazanchis, Addis Ababa',
      features: ['🛏️ Studio', '🛁 1 bath', '🛗 Elevator'],
      imageClass: 'featured-image-3'
    }
  ];

  selectChip(locality: string) {
    this.selectedCity = locality;
    this.onSearch();
  }

  selectType(type: string) {
    this.selectedType = type;
    this.onSearch();
  }

  onSearch() {
    const queryParams: any = {};
    if (this.selectedCity) queryParams.city = this.selectedCity;
    if (this.selectedType && this.selectedType !== 'All') queryParams.type = this.selectedType;
    if (this.selectedBudget && this.selectedBudget !== '0') queryParams.maxPrice = this.selectedBudget;

    this.router.navigate(['/properties'], { queryParams });
  }

  goToProperties() {
    this.router.navigate(['/properties']);
  }

  goToProperty(id: number) {
    this.router.navigate(['/properties', id]);
  }

  toggleFavorite(event: Event, id: number) {
    event.stopPropagation();
    // TODO: Implement favorite toggle functionality with API call
    console.log('Toggle favorite for property:', id);
  }
}

