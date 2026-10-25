export enum SubscriptionTier {
  Free = 0,
  Premium = 1
}

export enum SubscriptionStatus {
  Free = 0,
  PendingPayment = 1,
  Active = 2,
  Expired = 3,
  Cancelled = 4,
  PaymentFailed = 5,
  PastDue = 6
}

export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3,
  Cancelled = 4
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceETB: number;
  billingPeriodDays: number;
  maxActiveFavorites: number;
  maxWeeklyInquiries: number;
  canViewDirectPhone: boolean;
  hasInstantAlerts: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDateUtc: string;
  endDateUtc?: string | null;
  amountPaidETB: number;
  paymentTransactionReference?: string | null;
  createdAtUtc: string;
}

export interface Entitlement {
  tier: string;
  isPremium: boolean;
  canViewDirectPhone: boolean;
  hasInstantAlerts: boolean;
  maxActiveFavorites: number;
  maxWeeklyInquiries: number;
  currentFavorites: number;
  inquiriesThisWeek: number;
  subscriptionStatus: string;
  subscriptionEndUtc?: string | null;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  amountETB: number;
  provider: string;
  externalReference?: string | null;
  status: PaymentStatus;
  failureReason?: string | null;
  verifiedAtUtc?: string | null;
  createdAtUtc: string;
}

export interface StartSubscriptionDto {
  planId: string;
  paymentReference?: string | null;
  provider?: string | null;
}
