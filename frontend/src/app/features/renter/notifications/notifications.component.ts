import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification, NotificationType } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-shell container">
      <div class="page-header">
        <div>
          <span class="eyebrow">Notification Centre</span>
          <h1>Notifications</h1>
          <p>Updates about inquiries, appointments, applications, support and billing.</p>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="chip"
            [class.chip-active]="unreadOnly()"
            (click)="toggleUnreadOnly()"
          >
            Unread only
          </button>
          <button
            type="button"
            class="btn btn-outline"
            [disabled]="markingAll() || unreadCount() === 0"
            (click)="markAllAsRead()"
          >
            {{ markingAll() ? 'Updating...' : 'Mark all as read' }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <p>Loading your notifications...</p>
        </div>
      } @else if (error(); as message) {
        <div class="alert alert-danger">
          <strong>Notifications could not be loaded.</strong>
          <span>{{ message }}</span>
          <div class="alert-actions">
            <button class="btn btn-outline btn-sm" (click)="loadNotifications()">Try again</button>
          </div>
        </div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <h3>{{ unreadOnly() ? 'No unread notifications' : 'No notifications yet' }}</h3>
          <p>
            {{ unreadOnly() ? 'You have read everything for now.' : 'Activity on your inquiries, appointments and applications will appear here.' }}
          </p>
        </div>
      } @else {
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">{{ notifications().length }} notification(s)</span>
            <span class="muted">{{ unreadCount() }} unread</span>
          </div>
          <div class="panel-body">
            @for (item of notifications(); track item.id) {
              <div class="list-row" [class.unread-row]="!item.isRead">
                <div class="stack notification-body">
                  <div class="row-between">
                    <span class="notification-head">
                      @if (!item.isRead) {
                        <span class="unread-dot" aria-hidden="true"></span>
                      }
                      <span class="badge" [class.badge-green]="!item.isRead" [class.badge-amber]="item.isRead">
                        {{ typeLabel(item.type) }}
                      </span>
                      <span class="notification-title">{{ item.title }}</span>
                    </span>
                    <span class="muted">{{ relativeDate(item.createdAtUtc) }}</span>
                  </div>
                  <span class="muted notification-message">{{ item.message }}</span>
                </div>
                <div class="notification-actions">
                  @if (!item.isRead) {
                    <button type="button" class="btn btn-outline btn-sm" (click)="markAsRead(item.id)">Mark as read</button>
                  }
                  @if (item.linkUrl) {
                    <button type="button" class="btn btn-primary btn-sm" (click)="openNotification(item)">Open</button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      align-items: center;
    }
    .notification-body {
      flex: 1 1 420px;
      gap: 0.3rem;
    }
    .notification-head {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .notification-title {
      font-weight: 700;
      color: var(--secondary);
    }
    .notification-message {
      font-size: 0.9rem;
    }
    .notification-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .unread-row {
      background: #fbfdfc;
    }
    .unread-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--primary);
      display: inline-block;
    }
    .alert-actions {
      margin-top: 0.5rem;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly unreadOnly = signal<boolean>(false);
  readonly markingAll = signal<boolean>(false);

  private readonly typeLabels: Partial<Record<NotificationType, string>> = {
    [NotificationType.Account]: 'Account',
    [NotificationType.Listing]: 'Listing',
    [NotificationType.Inquiry]: 'Inquiry',
    [NotificationType.Appointment]: 'Appointment',
    [NotificationType.Application]: 'Application',
    [NotificationType.Agency]: 'Agency',
    [NotificationType.Support]: 'Support',
    [NotificationType.Subscription]: 'Subscription',
    [NotificationType.Security]: 'Security',
    [NotificationType.System]: 'System'
  };

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notificationService.getNotifications(this.unreadOnly()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.succeeded && res.data) {
          this.notifications.set(res.data);
          return;
        }
        this.error.set(res.errors.length > 0 ? res.errors.join(' ') : 'The notification service returned an empty response.');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not reach the server. Please check your connection and try again.');
      }
    });
  }

  toggleUnreadOnly(): void {
    this.unreadOnly.set(!this.unreadOnly());
    this.loadNotifications();
  }

  unreadCount(): number {
    return this.notifications().filter(item => !item.isRead).length;
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.applyReadState([id]);
        } else {
          this.error.set(res.errors.length > 0 ? res.errors.join(' ') : 'We could not mark that notification as read.');
        }
      },
      error: () => {
        this.error.set('We could not mark that notification as read.');
      }
    });
  }

  markAllAsRead(): void {
    this.markingAll.set(true);
    this.notificationService.markAllAsRead().subscribe({
      next: (res) => {
        this.markingAll.set(false);
        if (res.succeeded) {
          this.applyReadState(this.notifications().map(item => item.id));
        } else {
          this.error.set(res.errors.length > 0 ? res.errors.join(' ') : 'We could not mark all notifications as read.');
        }
      },
      error: () => {
        this.markingAll.set(false);
        this.error.set('We could not mark all notifications as read.');
      }
    });
  }

  openNotification(item: AppNotification): void {
    if (!item.isRead) {
      this.markAsRead(item.id);
    }
    if (item.linkUrl) {
      this.router.navigateByUrl(item.linkUrl);
    }
  }

  typeLabel(type: NotificationType): string {
    return this.typeLabels[type] ?? 'General';
  }

  relativeDate(value: string): string {
    const created = new Date(value).getTime();
    if (Number.isNaN(created)) {
      return 'Recently';
    }
    const minutes = Math.floor((Date.now() - created) / 60000);
    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 5) {
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }

  private applyReadState(ids: string[]): void {
    const readAt = new Date().toISOString();
    this.notifications.update(items =>
      items.map(item => (ids.includes(item.id) ? { ...item, isRead: true, readAtUtc: item.readAtUtc ?? readAt } : item))
    );
  }
}
