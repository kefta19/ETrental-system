export enum NotificationType {
  Account = 0,
  Listing = 1,
  Inquiry = 2,
  Appointment = 3,
  Application = 4,
  Agency = 5,
  Support = 6,
  Subscription = 7,
  Security = 8,
  System = 9
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAtUtc?: string | null;
  createdAtUtc: string;
}
