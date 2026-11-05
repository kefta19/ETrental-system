export enum PropertyType {
  Apartment = 0,
  Condominium = 1,
  Villa = 2,
  GPlusOne = 3,
  Studio = 4,
  ServiceQuarter = 5,
  Commercial = 6,
}

export enum PropertyStatus {
  Draft = 0,
  PendingReview = 1,
  Approved = 2,
  Rejected = 3,
  Published = 4,
  Unavailable = 5,
  Rented = 6,
  Archived = 7,
}

export enum ListingFeeStatus {
  NotRequired = 0,
  Pending = 1,
  Verified = 2,
  Rejected = 3,
}

export enum FurnishingStatus {
  Unfurnished = 0,
  SemiFurnished = 1,
  FullyFurnished = 2,
}

export type PropertyTypeValue = PropertyType | keyof typeof PropertyType;
export type PropertyStatusValue = PropertyStatus | keyof typeof PropertyStatus;
export type FurnishingStatusValue = FurnishingStatus | keyof typeof FurnishingStatus;

export interface PropertySummary {
  id: string;
  title: string;
  propertyType: PropertyTypeValue;
  status: PropertyStatusValue;
  region: string;
  city: string;
  subCity: string;
  neighborhood: string;
  landmark?: string | null;
  videoUrl?: string | null;
  rentAmountETB: number;
  depositAmountETB: number;
  advanceMonthsRequired: number;
  bedrooms: number;
  bathrooms: number;
  areaSquareMeters?: number | null;
  furnishing: FurnishingStatusValue;
  hasWaterTank: boolean;
  hasGenerator: boolean;
  hasSecurityGuard: boolean;
  hasParking: boolean;
  hasElevator: boolean;
  primaryImageUrl?: string | null;
  imageUrls: string[];
  landlordName: string;
  landlordPhone?: string | null;
  landlordEmail?: string | null;
  isVerifiedHost: boolean;
  createdAtUtc: string;
  listingFeeAmountETB?: number;
  listingFeeProvider?: string | null;
  listingFeeReference?: string | null;
  listingFeeTransactionUrl?: string | null;
  listingFeeStatus?: number | string;
}

export interface Property extends PropertySummary {
  description: string;
  streetAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  minimumLeaseMonths: number;
  availableFromDate: string;
  hasWifi: boolean;
  hasBalcony: boolean;
  waterBillIncluded: boolean;
  electricityBillIncluded: boolean;
  landlordId: string;
  contactLocked: boolean;
  rejectionReason?: string | null;
  rejectionCategory?: string | null;
  tenancyStartDateUtc?: string | null;
  agreedRentAmountETB?: number | null;
  agreedLeaseMonths?: number | null;
  rentedToTenantName?: string | null;
}

export interface PropertyFilter {
  region?: string;
  city?: string;
  subCity?: string;
  neighborhood?: string;
  propertyType?: PropertyType;
  furnishing?: FurnishingStatus;
  minPriceETB?: number;
  maxPriceETB?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxAdvanceMonths?: number;
  location?: string;
  minArea?: number;
  hasBalcony?: boolean;
  furnished?: boolean;
  hasWaterTank?: boolean;
  hasGenerator?: boolean;
  hasSecurityGuard?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasWifi?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  propertyType: PropertyType;
  region: string;
  city: string;
  subCity: string;
  neighborhood: string;
  landmark?: string;
  videoUrl?: string | null;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
  rentAmountETB: number;
  depositAmountETB: number;
  advanceMonthsRequired: number;
  minimumLeaseMonths: number;
  availableFromDate: string;
  bedrooms: number;
  bathrooms: number;
  areaSquareMeters?: number;
  furnishing: FurnishingStatus;
  hasWaterTank: boolean;
  hasGenerator: boolean;
  hasSecurityGuard: boolean;
  hasParking: boolean;
  hasElevator: boolean;
  hasWifi: boolean;
  hasBalcony: boolean;
  waterBillIncluded: boolean;
  electricityBillIncluded: boolean;
  imageUrls: string[];
  submitForReview: boolean;
  listingFeeProvider?: string | null;
  listingFeeReference?: string | null;
  listingFeeTransactionUrl?: string | null;
}

export interface ModerationDecisionDto {
  approved: boolean;
  paymentVerified?: boolean;
  requestCorrection?: boolean;
  rejectionCategory?: string;
  reason?: string;
}

export interface ListingFeeSubmissionDto {
  listingFeeProvider: string;
  listingFeeReference: string;
  listingFeeTransactionUrl?: string | null;
}

export interface MarkAsRentedDto {
  tenantName: string;
  tenantId?: string;
  agreedRentAmountETB: number;
  agreedLeaseMonths: number;
  tenancyStartDateUtc: string;
}
