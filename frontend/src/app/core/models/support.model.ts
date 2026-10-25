export enum TicketStatus {
  Open = 0,
  InProgress = 1,
  WaitingForUser = 2,
  Escalated = 3,
  Resolved = 4
}

export enum TicketCategory {
  Account = 0,
  Listing = 1,
  Agency = 2,
  SubscriptionBilling = 3,
  Technical = 4,
  SafetyFraud = 5,
  Payment = 6,
  InquiryAppointment = 7,
  Privacy = 8,
  Other = 9
}

export enum TicketPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3
}

export interface SupportTicket {
  id: string;
  ticketReference: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  resolvedAtUtc?: string | null;
  createdAtUtc: string;
  messageCount: number;
  lastMessagePreview?: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageText: string;
  isInternalNote: boolean;
  sentAtUtc: string;
}

export interface CreateSupportTicketDto {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface ReplySupportTicketDto {
  message: string;
  isInternalNote: boolean;
}

export interface UpdateSupportTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedAgentId?: string | null;
}

export interface SupportDashboard {
  openTickets: number;
  inProgressTickets: number;
  waitingForUserTickets: number;
  escalatedTickets: number;
  resolvedToday: number;
  totalOpenTickets: number;
  unassignedTickets: number;
  myAssignedTickets: number;
}
