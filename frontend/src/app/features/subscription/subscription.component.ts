import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  Entitlement,
  PaymentTransaction,
  StartSubscriptionDto,
  Subscription,
  SubscriptionPlan,
} from '../../core/models/subscription.model';
import { SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.css',
})
export class SubscriptionComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly checkingStatus = signal(false);
  readonly error = signal<string | null>(null);
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly entitlement = signal<Entitlement | null>(null);
  readonly currentSubscription = signal<Subscription | null>(null);
  readonly latestPayment = signal<PaymentTransaction | null>(null);
  readonly notice = signal<string | null>(null);

  @Input() modal = false;
  @Input() propertyId: string | null = null;
  @Output() closed = new EventEmitter<void>();
  selectedPlanId = '';
  provider = '';
  paymentReference = '';

  ngOnInit(): void {
    this.propertyId ??=
      this.route.snapshot.queryParamMap.get('propertyId') ??
      this.route.snapshot.paramMap.get('id');
    this.loadPage();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.modal) this.closeModal();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  closeModal(): void {
    if (this.modal) this.closed.emit();
  }

  loadPage(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      plans: this.subscriptionService.getPlans(),
      entitlement: this.subscriptionService.getEntitlements(),
      current: this.subscriptionService.getCurrentSubscription(),
      payments: this.subscriptionService.getMyPaymentTransactions(),
    }).subscribe({
      next: ({ plans, entitlement, current, payments }) => {
        this.loading.set(false);
        if (!plans.succeeded || !plans.data || !entitlement.succeeded || !entitlement.data ||
            !current.succeeded || !payments.succeeded || !payments.data) {
          this.error.set('We could not load your Premium plan information. Please try again.');
          return;
        }

        this.plans.set(
          plans.data.filter((plan) => plan.isActive && String(plan.tier).toLowerCase() === 'premium'),
        );
        this.entitlement.set(entitlement.data);
        this.currentSubscription.set(current.data);
        const pendingPayment = payments.data.find((payment) => payment.status?.toString().toLowerCase() === 'pending');
        this.latestPayment.set(pendingPayment ?? payments.data[0] ?? null);
        this.selectedPlanId = pendingPayment?.planId ?? this.plans()[0]?.id ?? '';
        this.provider = pendingPayment?.provider ?? '';
        this.paymentReference = pendingPayment?.externalReference ?? '';

        if (entitlement.data.isPremium) {
          this.notice.set('Premium is active. Your direct contact details are now unlocked.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not reach the server. Check your connection and try again.');
      },
    });
  }

  get selectedPlan(): SubscriptionPlan | undefined {
    return this.plans().find((plan) => plan.id === this.selectedPlanId);
  }

  get paymentPending(): boolean {
    return this.latestPayment()?.status?.toString().toLowerCase() === 'pending';
  }

  get paymentFailed(): boolean {
    return this.latestPayment()?.status?.toString().toLowerCase() === 'failed';
  }

  submitPaymentRequest(): void {
    const plan = this.selectedPlan;
    if (!plan || !this.provider.trim() ||
        !this.isSecureTransactionUrl(this.paymentReference) || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.notice.set(null);
    this.error.set(null);
    const request: StartSubscriptionDto = {
      planId: plan.id,
      provider: this.provider.trim(),
      paymentReference: this.paymentReference.trim(),
    };

    const request$ = this.paymentPending
      ? this.subscriptionService.updatePendingPayment(request)
      : this.subscriptionService.startSubscription(request);
    request$.subscribe({
      next: (response) => {
        this.submitting.set(false);
        if (!response.succeeded || !response.data) {
          this.error.set(response.errors?.[0] || 'We could not submit your payment for verification.');
          return;
        }
        this.notice.set(
          this.paymentPending
            ? 'Your pending payment details and transaction URL were updated. Premium access will unlock after verification.'
            : 'Your payment details and transaction URL were submitted. Premium access will unlock after verification.',
        );
        this.refreshPaymentStatus();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(this.getPaymentSubmissionError(err));
      },
    });
  }

  private getPaymentSubmissionError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body && typeof body === 'object') {
        const response = body as Record<string, unknown>;
        const errors = response['errors'];
        if (Array.isArray(errors) && typeof errors[0] === 'string') {
          return errors[0];
        }

        for (const key of ['detail', 'title', 'message']) {
          const message = response[key];
          if (typeof message === 'string' && message.trim()) {
            return message;
          }
        }
      }

      if (error.status === 0) {
        return 'Could not reach the server. Check your connection and try again.';
      }
    }

    return 'We could not submit your payment for verification. Please try again.';
  }

  refreshPaymentStatus(): void {
    this.checkingStatus.set(true);
    forkJoin({
      entitlement: this.subscriptionService.getEntitlements(),
      current: this.subscriptionService.getCurrentSubscription(),
      payments: this.subscriptionService.getMyPaymentTransactions(),
    }).subscribe({
      next: ({ entitlement, current, payments }) => {
        this.checkingStatus.set(false);
        if (!entitlement.succeeded || !entitlement.data || !current.succeeded || !payments.succeeded || !payments.data) {
          this.error.set('We could not refresh your payment status. Please try again.');
          return;
        }

        this.entitlement.set(entitlement.data);
        this.currentSubscription.set(current.data);
        const pendingPayment = payments.data.find((payment) => payment.status?.toString().toLowerCase() === 'pending');
        this.latestPayment.set(pendingPayment ?? payments.data[0] ?? null);

        if (entitlement.data.isPremium) {
          this.notice.set('Payment verified. Your Premium access is active.');
        } else if (this.paymentFailed) {
          this.notice.set('We could not verify this payment. Contact support or submit a new payment reference.');
        } else {
          this.notice.set('Your payment is still waiting for verification. Contact details remain locked until approval.');
        }
      },
      error: () => {
        this.checkingStatus.set(false);
        this.error.set('We could not check the payment status. Please try again.');
      },
    });
  }

  continueToProperty(): void {
    if (!this.entitlement()?.isPremium || !this.propertyId) return;
    this.router.navigate(['/properties', this.propertyId]);
  }

  formatPeriod(days: number): string {
    if (days % 30 === 0) {
      const months = days / 30;
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${days} days`;
  }

  isSecureTransactionUrl(value: string): boolean {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch {
      return false;
    }
  }
}
