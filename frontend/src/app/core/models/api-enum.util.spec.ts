import { enumValueFromApi } from './api-enum.util';
import { AppointmentStatus, ApplicationStatus } from './interaction.model';
import { NotificationType } from './notification.model';
import { ListingFeeStatus, PropertyType } from './property.model';
import { ReportStatus } from './report.model';
import { TicketCategory, TicketPriority, TicketStatus } from './support.model';

describe('enumValueFromApi', () => {
  it('maps API enum names to numeric enum values without changing existing numeric values', () => {
    expect(enumValueFromApi(TicketStatus, 'InProgress')).toBe(TicketStatus.InProgress);
    expect(enumValueFromApi(TicketPriority, 'High')).toBe(TicketPriority.High);
    expect(enumValueFromApi(TicketCategory, 'SubscriptionBilling')).toBe(TicketCategory.SubscriptionBilling);
    expect(enumValueFromApi(ReportStatus, 'ActionRequired')).toBe(ReportStatus.ActionRequired);
    expect(enumValueFromApi(AppointmentStatus, 'Confirmed')).toBe(AppointmentStatus.Confirmed);
    expect(enumValueFromApi(ApplicationStatus, 'Submitted')).toBe(ApplicationStatus.Submitted);
    expect(enumValueFromApi(PropertyType, 'GPlusOne')).toBe(PropertyType.GPlusOne);
    expect(enumValueFromApi(ListingFeeStatus, 'Pending')).toBe(ListingFeeStatus.Pending);
    expect(enumValueFromApi(NotificationType, 'Support')).toBe(NotificationType.Support);
    expect(enumValueFromApi(TicketStatus, TicketStatus.Resolved)).toBe(TicketStatus.Resolved);
    expect(enumValueFromApi(TicketCategory, 2)).toBe(2);
  });

  it('matches enum names case-insensitively and reports unknown values', () => {
    expect(enumValueFromApi(TicketStatus, 'waiting_for_user')).toBe(TicketStatus.WaitingForUser);
    expect(enumValueFromApi(TicketStatus, 'future-status')).toBeUndefined();
    expect(enumValueFromApi(TicketStatus, null)).toBeUndefined();
  });
});
