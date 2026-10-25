export interface AdminDashboard {
  totalUsers: number;
  totalRenters: number;
  totalLandlords: number;
  totalAgencies: number;
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
  pendingAgencyVerifications: number;
  activePremiumSubscriptions: number;
  totalSubscriptionRevenueETB: number;
  verifiedAgencies: number;
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
  agencyName?: string | null;
  agencyId?: string | null;
  propertyCount: number;
}

export interface RestrictUserDto {
  isRestricted: boolean;
  reason?: string | null;
}

export interface AgencyVerificationDto {
  approved: boolean;
  rejectionReason?: string | null;
  verificationNotes?: string | null;
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
