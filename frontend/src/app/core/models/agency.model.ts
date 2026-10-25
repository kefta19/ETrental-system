export enum AgencyStatus {
  Pending = 0,
  Verified = 1,
  Rejected = 2,
  Suspended = 3
}

export enum AgencyStaffRole {
  AgencyManager = 0,
  Agent = 1,
  Viewer = 2
}

export interface AgencyProfile {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  taxIdentificationNumber: string;
  businessLicenseNumber: string;
  city: string;
  subCity: string;
  officeAddress?: string | null;
  officialPhone: string;
  officialEmail: string;
  status: AgencyStatus;
  verificationNotes?: string | null;
  rejectionReason?: string | null;
  verifiedAtUtc?: string | null;
  submittedAtUtc: string;
  memberCount: number;
  propertyCount: number;
}

export interface AgencyMember {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: AgencyStaffRole;
  isActive: boolean;
  joinedAtUtc: string;
  assignedPropertyCount: number;
  temporaryPassword?: string | null;
}

export interface UpdateAgencyDto {
  name: string;
  description: string;
  city: string;
  subCity: string;
  officeAddress?: string | null;
  officialPhone: string;
  officialEmail: string;
  logoUrl?: string | null;
}

export interface InviteStaffDto {
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  role: AgencyStaffRole;
}

export interface AgencyReport {
  totalProperties: number;
  activeProperties: number;
  publishedProperties: number;
  pendingReviewProperties: number;
  rejectedProperties: number;
  rentedProperties: number;
  unavailableProperties: number;
  totalInquiries: number;
  unreadInquiries: number;
  totalApplications: number;
  pendingApplications: number;
  totalAppointments: number;
  upcomingAppointments: number;
  activeStaff: number;
  subscriptionTier: string;
}
