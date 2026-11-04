import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InteractionService } from '../../core/services/interaction.service';
import { PropertyService } from '../../core/services/property.service';
import { PropertySummary } from '../../core/models/property.model';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';

/* ───────── Natural-language search parser ─────────
   Turns "2-bedroom in Bole under 30,000 birr with parking" into /properties query params. */

interface ParsedSearch {
  city?: string;
  keyword?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  features: string[];
}

/** Areas precede cities so a specific neighborhood wins when both are mentioned. */
const KNOWN_PLACES: readonly string[] = [
  'Nifas Silk-Lafto',
  'Debre Markos',
  'Wolaita Sodo',
  'Arba Minch',
  'Addis Ababa',
  'Bahir Dar',
  'Dire Dawa',
  'Shashamane',
  'Kazanchis',
  'Bole',
  'CMC',
  'Sarbet',
  'Bishoftu',
  'Hawassa',
  'Mekelle',
  'Adama',
  'Jimma',
  'Gondar',
  'Harar',
  'Dessie',
  'Nekemte',
  'Yeka',
  'Kirkos',
];

const TYPE_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\b(?:condo(?:minium)?s?)\b/i, 'Condominium'],
  [/\b(?:g\s*\+\s*1|g\s*plus\s*1|family\s+home)s?\b/i, 'G+1'],
  [/\b(?:service\s+quarters?|service\s+quarter)\b/i, 'ServiceQuarter'],
  [/\b(?:villa|house)s?\b/i, 'Villa'],
  [/\b(?:studio|single\s+rooms?)\b/i, 'Studio'],
  [/\b(?:commercial|office|shop|store)s?\b/i, 'Commercial'],
  [/\b(?:apartments?|flats?)\b/i, 'Apartment'],
];

const FEATURE_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\b(?:parking|garage)\b/i, 'parking'],
  [/\bbalcon(?:y|ies)\b/i, 'balcony'],
  [/\b(?:elevator|lift)\b/i, 'elevator'],
  [/\b(?:fully\s+furnished|semi[- ]furnished|furnished)\b/i, 'furnished'],
  [/\b(?:water\s+tank|tank\s+water)\b/i, 'water-tank'],
  [/\b(?:generator|backup\s+power)\b/i, 'generator'],
  [/\b(?:security\s+guard|security|guard)\b/i, 'security'],
  [/\b(?:wi[- ]?fi|internet)\b/i, 'wifi'],
];

const BEDROOMS = /(\d+)\s*[- ]?\s*(?:bed(?:room)?s?|br|rooms?)\b/i;
const BATHROOMS = /(\d+)\s*[- ]?\s*(?:bath(?:room)?s?)\b/i;
const PRICE_AMOUNT = '(\\d[\\d,.]*)\\s*(k|thousand)?';
const PRICE_RANGE = new RegExp(
  `\\b(?:between|from)\\s*(?:etb|birr|br)?\\s*${PRICE_AMOUNT}\\s*(?:and|to|-)\\s*(?:etb|birr|br)?\\s*${PRICE_AMOUNT}\\s*(?:etb|birr|br)?`,
  'i',
);
const MAX_PRICE = new RegExp(
  `\\b(?:under|below|less\\s+than|up\\s+to|max(?:imum)?|within|<=?)\\s*(?:etb|birr|br)?\\s*${PRICE_AMOUNT}\\s*(?:etb|birr|br)?`,
  'i',
);
const MIN_PRICE = new RegExp(
  `\\b(?:above|over|more\\s+than|at\\s+least|min(?:imum)?|>=?)\\s*(?:etb|birr|br)?\\s*${PRICE_AMOUNT}\\s*(?:etb|birr|br)?`,
  'i',
);
const BARE_PRICE = new RegExp(`\\b${PRICE_AMOUNT}\\s*(?:etb|birr|br)\\b`, 'i');
const MIN_AREA =
  /\b(?:at least|min(?:imum)?|>=?)?\s*(\d+)\s*(?:m²|m2|sqm|sq\.?\s?m|square\s*met(?:er|re)s?)\b/i;

function toNumber(raw: string, suffix?: string): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  return suffix ? n * 1000 : n;
}

function findPlace(text: string): string | undefined {
  const places = KNOWN_PLACES
    .map((place) => ({
      place,
      index: text.search(new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')),
    }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index || b.place.length - a.place.length);
  return places[0]?.place;
}

function parseSearchQuery(input: string): ParsedSearch {
  const result: ParsedSearch = { features: [] };
  let text = (input ?? '').trim();
  if (!text) return result;

  const priceRange = text.match(PRICE_RANGE);
  if (priceRange) {
    result.minPrice = toNumber(priceRange[1], priceRange[2]);
    result.maxPrice = toNumber(priceRange[3], priceRange[4]);
    text = text.replace(priceRange[0], ' ');
  } else {
    const minPrice = text.match(MIN_PRICE);
    if (minPrice) {
      result.minPrice = toNumber(minPrice[1], minPrice[2]);
      text = text.replace(minPrice[0], ' ');
    }

    const maxPrice = text.match(MAX_PRICE) ?? text.match(BARE_PRICE);
    if (maxPrice) {
      result.maxPrice = toNumber(maxPrice[1], maxPrice[2]);
      text = text.replace(maxPrice[0], ' ');
    }
  }

  const bedrooms = text.match(BEDROOMS);
  if (bedrooms) {
    result.minBedrooms = parseInt(bedrooms[1], 10);
    text = text.replace(bedrooms[0], ' ');
  }

  const bathrooms = text.match(BATHROOMS);
  if (bathrooms) {
    result.minBathrooms = parseInt(bathrooms[1], 10);
    text = text.replace(bathrooms[0], ' ');
  }

  const area = text.match(MIN_AREA);
  if (area) {
    result.minArea = parseInt(area[1], 10);
    text = text.replace(area[0], ' ');
  }

  for (const [pattern, label] of FEATURE_RULES) {
    if (pattern.test(text)) {
      result.features.push(label);
      text = text.replace(pattern, ' ');
    }
  }

  for (const [pattern, value] of TYPE_RULES) {
    if (pattern.test(text)) {
      result.type = value;
      text = text.replace(pattern, ' ');
    }
  }

  result.city = findPlace(text);
  if (!result.city) {
    const locationPhrase = text.match(/\b(?:in|near|around|at)\s+([a-z][a-z\s-]*)/i);
    if (locationPhrase) result.city = locationPhrase[1].trim();
  }
  for (const place of KNOWN_PLACES) {
    const escapedPlace = place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\b${escapedPlace}\\b`, 'gi'), ' ');
  }
  if (result.city && !KNOWN_PLACES.includes(result.city)) {
    text = text.replace(new RegExp(`\\b${result.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), ' ');
  }

  const remainder = text
    .replace(
      /\b(?:in|near|around|at|the|for|rent|rental|property|properties|home|homes|with|and|to|a|an|find|show|looking|least|minimum|min)\b/gi,
      ' ',
    )
    .replace(/[,\u2013\u2014]+/g, ' ')
    .trim();

  const hasParsedFilters = Boolean(
    result.type ||
    result.minPrice ||
    result.maxPrice ||
    result.minBedrooms ||
    result.minBathrooms ||
    result.minArea ||
    result.features.length,
  );
  if (remainder) {
    if (result.city || hasParsedFilters) result.keyword = remainder;
    else result.city = remainder;
  }

  return result;
}

function toQueryParams(parsed: ParsedSearch): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (parsed.city) params['location'] = parsed.city;
  if (parsed.keyword) params['keyword'] = parsed.keyword;
  if (parsed.type) params['type'] = parsed.type;
  if (parsed.minPrice) params['minPrice'] = parsed.minPrice;
  if (parsed.maxPrice) params['maxPrice'] = parsed.maxPrice;
  if (parsed.minBedrooms) params['minBedrooms'] = parsed.minBedrooms;
  if (parsed.minBathrooms) params['minBathrooms'] = parsed.minBathrooms;
  if (parsed.minArea) params['minArea'] = parsed.minArea;
  if (parsed.features.length) params['features'] = parsed.features.join(',');
  return params;
}

/* ───────── Component ───────── */

interface PropertyType {
  label: string;
  /** Value sent to /properties?type=... */
  value: string;
  icon: string;
}

interface SearchFeature {
  label: string;
  value: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, PropertyCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly interactionService = inject(InteractionService);
  readonly auth = inject(AuthService);

  query = '';
  searchFilters = {
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
  };
  selectedFeatures: string[] = [];

  readonly searchFeatures: SearchFeature[] = [
    { label: 'Parking', value: 'parking' },
    { label: 'Balcony', value: 'balcony' },
    { label: 'Elevator', value: 'elevator' },
    { label: 'Furnished', value: 'furnished' },
    { label: 'Water tank', value: 'water-tank' },
    { label: 'Generator', value: 'generator' },
    { label: 'Security', value: 'security' },
    { label: 'Wi-Fi', value: 'wifi' },
  ];

  readonly locationSuggestions = [
    'Bole',
    'CMC',
    'Kazanchis',
    'Sarbet',
    'Yeka',
    'Kirkos',
    'Nifas Silk-Lafto',
  ];

  readonly recent = signal<PropertySummary[]>([]);
  readonly total = signal<number | null>(null);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  readonly examples = [
    '2-bedroom in Bole under 30,000 birr',
    'Apartment with parking in CMC',
    'Studio under 12,000 birr',
    'Villa with parking, at least 150 m²',
  ];

  readonly types: PropertyType[] = [
    { label: 'Apartments', value: 'Apartment', icon: 'apartment' },
    { label: 'Condominiums', value: 'Condominium', icon: 'domain' },
    { label: 'Houses & villas', value: 'Villa', icon: 'cottage' },
    { label: 'Rooms & studios', value: 'Studio', icon: 'bed' },
    { label: 'Commercial', value: 'Commercial', icon: 'storefront' },
  ];

  readonly cities = [
    {
      name: 'Addis Ababa',
      image:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Hawassa',
      image:
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Mekelle',
      image:
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Bahir Dar',
      image:
        'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Dire Dawa',
      image:
        'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Adama',
      image:
        'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Jimma',
      image:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Gondar',
      image:
        'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Bishoftu',
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Arba Minch',
      image:
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Harar',
      image:
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Dessie',
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Shashamane',
      image:
        'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Debre Markos',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Wolaita Sodo',
      image:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Nekemte',
      image:
        'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=720&q=80',
    },
  ];

  /** Cities shown in the "Rentals in top cities" link block. */
  readonly topCities = this.cities.slice(0, 4).map((city) => city.name);

  readonly steps = [
    {
      title: 'Search',
      text: 'Filter by city, area, price and size, or just describe the home you want.',
    },
    { title: 'Contact', text: 'Message the landlord and book a viewing.' },
    { title: 'Move in', text: 'Apply for the property you chose and sign the agreement.' },
  ];

  ngOnInit(): void {
    if (this.auth.currentUser()) {
      this.interactionService.loadFavorites().subscribe();
    }

    this.propertyService.search({ sortBy: 'newest', page: 1, pageSize: 4 }).subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.recent.set(res.data.items);
          this.total.set(res.data.totalCount);
          this.state.set('ready');
        } else {
          this.state.set('error');
        }
      },
      error: () => this.state.set('error'),
    });
  }

  alertLink(): string {
    return this.auth.isAuthenticated() ? '/saved-searches' : '/register';
  }

  onSearch(): void {
    const parsed = parseSearchQuery(this.query);
    parsed.type = this.searchFilters.type || parsed.type;
    parsed.minPrice = this.numberFilter(this.searchFilters.minPrice) ?? parsed.minPrice;
    parsed.maxPrice = this.numberFilter(this.searchFilters.maxPrice) ?? parsed.maxPrice;
    parsed.minBedrooms = this.numberFilter(this.searchFilters.bedrooms) ?? parsed.minBedrooms;
    parsed.minBathrooms = this.numberFilter(this.searchFilters.bathrooms) ?? parsed.minBathrooms;
    parsed.minArea = this.numberFilter(this.searchFilters.minArea) ?? parsed.minArea;
    parsed.features = [...new Set([...parsed.features, ...this.selectedFeatures])];

    const queryParams = toQueryParams(parsed);
    this.router.navigate(['/properties'], { queryParams });
  }

  toggleSearchFeature(value: string, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const checked = event.target.checked;
    this.selectedFeatures = checked
      ? [...new Set([...this.selectedFeatures, value])]
      : this.selectedFeatures.filter((feature) => feature !== value);
  }

  private numberFilter(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  useExample(example: string): void {
    this.query = example;
    this.onSearch();
  }
}
