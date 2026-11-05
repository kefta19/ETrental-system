import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  it('shows known labels for API string-enum notification types', async () => {
    TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        provideRouter([]),
        {
          provide: NotificationService,
          useValue: {
            getNotifications: () => of({
              succeeded: true,
              data: [{
                id: 'notification-1',
                type: 'Support',
                title: 'Support update',
                message: 'A support agent replied.',
                isRead: false,
                createdAtUtc: '2026-11-04T12:00:00Z',
              }],
              errors: [],
            }),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(NotificationsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Support');
    expect(fixture.nativeElement.textContent).not.toContain('General');
  });
});
