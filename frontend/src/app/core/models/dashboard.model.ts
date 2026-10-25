export interface RenterDashboard {
  favoriteCount: number;
  savedSearchCount: number;
  sentInquiryCount: number;
  unreadInquiryCount: number;
  appointmentCount: number;
  upcomingAppointmentCount: number;
  applicationCount: number;
  activeApplicationCount: number;
  unreadNotificationCount: number;
  subscriptionTier: string;
  recommendedPropertyCount: number;
}

export interface LandlordDashboard {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  pendingReviewProperties: number;
  rejectedProperties: number;
  rentedProperties: number;
  unavailableProperties: number;
  unreadInquiries: number;
  totalInquiries: number;
  pendingAppointments: number;
  totalAppointments: number;
  pendingApplications: number;
  totalApplications: number;
  activeAgreements: number;
  monthlyPortfolioValueETB: number;
  unreadNotificationCount: number;
}

export interface AgencyDashboard {
  agencyName: string;
  agencyStatus: string;
  totalProperties: number;
  publishedProperties: number;
  pendingReviewProperties: number;
  rentedProperties: number;
  unreadInquiries: number;
  pendingApplications: number;
  upcomingAppointments: number;
  activeStaff: number;
  unreadNotificationCount: number;
}
