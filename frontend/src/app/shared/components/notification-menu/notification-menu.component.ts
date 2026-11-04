import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin, interval, startWith } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notification-menu">
      <button
        class="notification-button"
        type="button"
        aria-label="Notifications"
        [attr.aria-expanded]="isOpen()"
        aria-controls="account-notification-panel"
        (click)="toggle()"
      >
        <span class="material-icons-outlined" aria-hidden="true">notifications</span>
        @if (unreadCount() > 0) {
          <span class="notification-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
        }
      </button>

      @if (isOpen()) {
        <section id="account-notification-panel" class="notification-panel" aria-label="Notifications">
          <div class="notification-heading">
            <strong>Notifications</strong>
            @if (unreadCount() > 0) {
              <button
                type="button"
                class="mark-all"
                [disabled]="markingAll()"
                (click)="markAllRead()"
              >
                {{ markingAll() ? 'Updating…' : 'Mark all read' }}
              </button>
            }
          </div>

          @if (error()) {
            <div class="notification-state" role="alert">
              <span>{{ error() }}</span>
              <button type="button" class="retry-button" (click)="loadNotifications()">Try again</button>
            </div>
          } @else if (loading()) {
            <p class="notification-state">Loading notifications…</p>
          } @else if (!notifications().length) {
            <p class="notification-state">No unread notifications.</p>
          } @else {
            <div class="notification-list">
              @for (notification of notifications(); track notification.id) {
                <button
                  type="button"
                  class="notification-item"
                  [disabled]="processingId() === notification.id"
                  (click)="openNotification(notification)"
                >
                  <span class="notification-icon material-icons-outlined" aria-hidden="true">campaign</span>
                  <span class="notification-copy">
                    <strong>{{ notification.title }}</strong>
                    <span>{{ notification.message }}</span>
                    <small>{{ notification.createdAtUtc | date:'short' }}</small>
                  </span>
                </button>
              }
            </div>
          }

          <a
            class="view-all"
            [routerLink]="notificationsRoute"
            (click)="close()"
          >
            View all notifications
            <span class="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .notification-menu { position: relative; }
    .notification-button {
      position: relative;
      display: grid;
      width: 40px;
      height: 40px;
      place-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      background: #fff;
      color: #475569;
      cursor: pointer;
    }
    .notification-button:hover { background: #f0fdf4; color: #047857; }
    .notification-button:focus-visible,
    .notification-item:focus-visible,
    .mark-all:focus-visible,
    .retry-button:focus-visible,
    .view-all:focus-visible {
      outline: 2px solid #10b981;
      outline-offset: 2px;
    }
    .notification-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      border-radius: 9999px;
      background: #10b981;
      color: #fff;
      font-size: .65rem;
      font-weight: 700;
      line-height: 17px;
      text-align: center;
    }
    .notification-panel {
      position: absolute;
      top: calc(100% + 9px);
      right: 0;
      z-index: 100;
      width: min(360px, calc(100vw - 24px));
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
    }
    .notification-heading {
      display: flex;
      min-height: 46px;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      padding: .5rem .85rem;
      border-bottom: 1px solid #f1f5f9;
      color: #172b24;
      font-size: .9rem;
    }
    .mark-all, .retry-button {
      border: 0;
      background: transparent;
      color: #047857;
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .mark-all:disabled { cursor: wait; opacity: .65; }
    .notification-state {
      display: grid;
      justify-items: center;
      gap: .55rem;
      margin: 0;
      padding: 1.15rem .85rem;
      color: #64748b;
      font-size: .82rem;
      text-align: center;
    }
    .notification-list {
      max-height: min(55vh, 360px);
      overflow-y: auto;
      padding: .35rem;
    }
    .notification-item {
      display: flex;
      width: 100%;
      align-items: flex-start;
      gap: .65rem;
      padding: .7rem;
      border: 0;
      border-radius: 8px;
      background: #fff;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .notification-item:hover { background: #f8fafc; }
    .notification-item:disabled { cursor: wait; opacity: .65; }
    .notification-icon { color: #059669; font-size: 1.2rem; }
    .notification-copy {
      display: grid;
      min-width: 0;
      gap: .2rem;
      color: #475569;
      font-size: .8rem;
    }
    .notification-copy strong { color: #172b24; font-size: .82rem; }
    .notification-copy span { overflow-wrap: anywhere; }
    .notification-copy small { color: #94a3b8; font-size: .7rem; }
    .view-all {
      display: flex;
      min-height: 42px;
      align-items: center;
      justify-content: space-between;
      padding: 0 .85rem;
      border-top: 1px solid #f1f5f9;
      color: #047857;
      font-size: .8rem;
      font-weight: 700;
      text-decoration: none;
    }
    .view-all:hover { background: #f0fdf4; }
    .view-all .material-icons-outlined { font-size: 1.05rem; }
  `],
})
export class NotificationMenuComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly markingAll = signal(false);
  readonly processingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  get notificationsRoute(): string {
    return this.authService.isLandlord() ? '/landlord/notifications' : '/renter/notifications';
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.close();
        this.refreshUnreadCount();
      });

    interval(60_000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.isOpen.set(true);
    this.loadNotifications();
  }

  close(): void {
    this.isOpen.set(false);
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      notifications: this.notificationService.getNotifications(true),
      unreadCount: this.notificationService.getUnreadCount(),
    }).subscribe({
      next: ({ notifications, unreadCount }) => {
        this.loading.set(false);
        if (!notifications.succeeded || !notifications.data || !unreadCount.succeeded || unreadCount.data === undefined) {
          this.error.set([
            ...(notifications.errors ?? []),
            ...(unreadCount.errors ?? []),
          ].join(' ') || 'Notifications could not be loaded.');
          this.changeDetector.markForCheck();
          return;
        }
        this.notifications.set(notifications.data);
        this.unreadCount.set(unreadCount.data);
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.errors?.[0] || 'We could not reach the notification service. Please try again.');
        this.changeDetector.markForCheck();
      },
    });
  }

  private refreshUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        if (response.succeeded && response.data !== undefined) {
          this.unreadCount.set(response.data);
          if (this.isOpen()) this.error.set(null);
        } else if (this.isOpen()) {
          this.error.set(response.errors?.[0] || 'Unread notifications could not be loaded.');
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        if (this.isOpen()) {
          this.error.set(error.error?.errors?.[0] || 'Unread notifications could not be loaded.');
        }
        this.changeDetector.markForCheck();
      },
    });
  }

  markAllRead(): void {
    if (this.markingAll() || this.unreadCount() === 0) return;
    this.markingAll.set(true);
    this.error.set(null);
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        this.markingAll.set(false);
        if (!response.succeeded) {
          this.error.set(response.errors?.[0] || 'Notifications could not be marked as read.');
          this.changeDetector.markForCheck();
          return;
        }
        this.notifications.set([]);
        this.unreadCount.set(0);
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.markingAll.set(false);
        this.error.set(error.error?.errors?.[0] || 'Notifications could not be marked as read.');
        this.changeDetector.markForCheck();
      },
    });
  }

  openNotification(notification: AppNotification): void {
    if (this.processingId()) return;
    this.processingId.set(notification.id);
    this.error.set(null);
    this.notificationService.markAsRead(notification.id).subscribe({
      next: (response) => {
        this.processingId.set(null);
        if (!response.succeeded) {
          this.error.set(response.errors?.[0] || 'The notification could not be marked as read.');
          this.changeDetector.markForCheck();
          return;
        }
        this.notifications.update((items) => items.filter((item) => item.id !== notification.id));
        this.unreadCount.update((count) => Math.max(count - 1, 0));
        this.close();
        const link = this.resolveNotificationLink(notification.linkUrl);
        if (link) {
          void this.router.navigateByUrl(link);
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.processingId.set(null);
        this.error.set(error.error?.errors?.[0] || 'The notification could not be marked as read.');
        this.changeDetector.markForCheck();
      },
    });
  }

  private resolveNotificationLink(linkUrl?: string | null): string | null {
    if (!linkUrl) return null;
    if (linkUrl === '/landlord/inquiries') return '/landlord/messages';
    if (linkUrl === '/renter/inquiries') return '/renter/messages';
    return linkUrl;
  }
}
