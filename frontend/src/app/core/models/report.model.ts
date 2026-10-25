export enum ReportStatus {
  Open = 0,
  UnderReview = 1,
  ActionRequired = 2,
  Resolved = 3,
  Dismissed = 4
}

export enum ReportCategory {
  FakeListing = 0,
  MisleadingInformation = 1,
  DuplicateListing = 2,
  SuspiciousUser = 3,
  IncorrectPrice = 4,
  Harassment = 5,
  UnauthorizedPhotos = 6,
  Fraud = 7,
  Other = 8
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedPropertyId?: string | null;
  reportedPropertyTitle?: string | null;
  reportedUserId?: string | null;
  reportedUserName?: string | null;
  category: ReportCategory;
  reason: string;
  description: string;
  status: ReportStatus;
  resolutionNotes?: string | null;
  actionTaken?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdAtUtc: string;
  resolvedAtUtc?: string | null;
}

export interface CreateUserReportDto {
  reportedPropertyId?: string | null;
  reportedUserId?: string | null;
  category: ReportCategory;
  reason: string;
  description: string;
}

export interface UpdateUserReportDto {
  status?: ReportStatus;
  resolutionNotes?: string | null;
  actionTaken?: string | null;
  assignedToId?: string | null;
}

export interface ReportDashboard {
  openReports: number;
  underReviewReports: number;
  actionRequiredReports: number;
  resolvedReports: number;
  dismissedReports: number;
  fraudReports: number;
}
