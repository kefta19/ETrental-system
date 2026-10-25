import { PropertySummary } from './property.model';

export interface Favorite {
  id: string;
  propertyId: string;
  createdAtUtc: string;
  property: PropertySummary;
}

export interface SavedSearch {
  id: string;
  name: string;
  city?: string;
  subCity?: string;
  minPriceETB?: number;
  maxPriceETB?: number;
  minBedrooms?: number;
  propertyType?: string;
  alertEmailEnabled: boolean;
  createdAtUtc: string;
}

export interface CreateSavedSearch {
  name: string;
  city?: string;
  subCity?: string;
  minPriceETB?: number;
  maxPriceETB?: number;
  minBedrooms?: number;
  propertyType?: string;
  alertEmailEnabled: boolean;
}

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  property?: PropertySummary;
  renterId: string;
  renterName: string;
  renterEmail?: string;
  renterPhone?: string;
  initialMessage: string;
  landlordReply?: string;
  repliedAtUtc?: string;
  isReadByLandlord: boolean;
  isReadByRenter: boolean;
  createdAtUtc: string;
}

export interface CreateInquiry {
  propertyId: string;
  message: string;
}

export interface ReplyInquiry {
  reply: string;
}

export enum AppointmentStatus {
  Requested = 0,
  Confirmed = 1,
  Rescheduled = 2,
  Cancelled = 3,
  Completed = 4
}

export interface ViewingAppointment {
  id: string;
  propertyId: string;
  property?: PropertySummary;
  renterId: string;
  renterName: string;
  renterPhone?: string;
  hostName?: string;
  hostPhone?: string;
  requestedDateTimeUtc: string;
  confirmedDateTimeUtc?: string;
  status: AppointmentStatus;
  renterNotes?: string;
  hostNotes?: string;
  cancellationReason?: string;
  createdAtUtc: string;
}

export interface CreateAppointment {
  propertyId: string;
  requestedDateTimeUtc: string;
  renterNotes?: string;
}

export interface UpdateAppointmentStatus {
  status: AppointmentStatus;
  confirmedDateTimeUtc?: string;
  hostNotes?: string;
  cancellationReason?: string;
}

export enum ApplicationStatus {
  Submitted = 0,
  UnderReview = 1,
  Accepted = 2,
  Rejected = 3,
  Withdrawn = 4
}

export interface RentalApplication {
  id: string;
  propertyId: string;
  property?: PropertySummary;
  applicantId: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  proposedMoveInDate: string;
  proposedLeaseDurationMonths: number;
  proposedOccupantsCount: number;
  employmentOrIncomeSummary: string;
  additionalNotes?: string;
  status: ApplicationStatus;
  hostDecisionNotes?: string;
  decidedAtUtc?: string;
  createdAtUtc: string;
}

export interface CreateApplication {
  propertyId: string;
  proposedMoveInDate: string;
  proposedLeaseDurationMonths: number;
  proposedOccupantsCount: number;
  employmentOrIncomeSummary: string;
  additionalNotes?: string;
}

export interface UpdateApplicationStatus {
  status: ApplicationStatus;
  hostDecisionNotes?: string;
}
