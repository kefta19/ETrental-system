export interface AdminDashboard {
  totalUsers: number;
  totalRenters: number;
  totalLandlords: number;
  totalSupportAgents: number;
  activeUsers: number;
  restrictedUsers: number;
  totalProperties: number;
  publishedProperties: number;
  pendingReviewProperties: number;
  rejectedProperties: number;
  rentedProperties: number;
  totalInquiries: number;
  totalAppointments: number;
  totalApplications: number;
  openReports: number;
  openTickets: number;
  activePremiumSubscriptions: number;
  totalSubscriptionRevenueETB: number;
  completedRenterPayments: number;
  renterSubscriptionRevenueETB: number;
  verifiedLandlordPayments: number;
  landlordListingFeeRevenueETB: number;
  totalRevenueETB: number;
}

export interface ListingFeePayment {
  propertyId: string;
  landlordId: string;
  landlordEmail: string;
  landlordFullName: string;
  propertyTitle: string;
  city: string;
  subCity: string;
  neighborhood: string;
  amountETB: number;
  provider?: string | null;
  reference?: string | null;
  transactionUrl?: string | null;
  status: string;
  verifiedAtUtc?: string | null;
  createdAtUtc: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  roles: string[];
  isActive: boolean;
  isRestricted: boolean;
  restrictionReason?: string | null;
  restrictedAtUtc?: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  createdAtUtc: string;
  lastLoginAtUtc?: string | null;
  subscriptionTier: string;
  hasPaidPremium: boolean;
  propertyCount: number;
}

export interface RestrictUserDto {
  isRestricted: boolean;
  reason?: string | null;
}

export interface PlatformSetting {
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAtUtc: string;
  updatedBy?: string | null;
}

export interface SubscriptionPlanAdmin {
  id: string;
  name: string;
  tier: string;
  priceETB: number;
  billingPeriodDays: number;
  maxActiveFavorites: number;
  maxWeeklyInquiries: number;
  canViewDirectPhone: boolean;
  hasInstantAlerts: boolean;
  isActive: boolean;
}

export interface UpdateSubscriptionPlanDto {
  priceETB: number;
  billingPeriodDays: number;
  maxActiveFavorites: number;
  maxWeeklyInquiries: number;
  canViewDirectPhone: boolean;
  hasInstantAlerts: boolean;
  isActive: boolean;
}

export interface VerifyPaymentDto {
  transactionId: string;
  approved: boolean;
  note?: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestampUtc: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  ipAddress?: string | null;
  reason?: string | null;
}
