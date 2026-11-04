import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SubscriptionPlanAdmin, UpdateSubscriptionPlanDto } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-subscription-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <h1>Plans & entitlements</h1>
          <p>Configure the subscription price, duration, limits, and benefits offered to renters.</p>
        </div>
        <button class="refresh" (click)="load()">Refresh plans</button>
      </header>
      <section class="content">
        @if (error) { <div class="alert">{{ error }}</div> }
        @if (loading) {
          <div class="state">Loading subscription plans…</div>
        } @else if (!plans.length) {
          <div class="state empty">No plans are configured.</div>
        } @else {
          <div class="plans">
            @for (plan of plans; track plan.id) {
              <article class="plan-card">
                <div class="plan-heading">
                  <div>
                    <span class="tier">{{ plan.tier }}</span>
                    <h2>{{ plan.name }}</h2>
                  </div>
                  <label class="active-toggle">
                    <input type="checkbox" [(ngModel)]="plan.isActive" />
                    Available to users
                  </label>
                </div>
                <div class="fields">
                  <label>Price (ETB)<input type="number" min="0" step="1" [(ngModel)]="plan.priceETB" /></label>
                  <label>Billing period (days)<input type="number" min="1" max="365" [(ngModel)]="plan.billingPeriodDays" /></label>
                  <label>Favorite limit<input type="number" min="0" [(ngModel)]="plan.maxActiveFavorites" /></label>
                  <label>Weekly inquiry limit<input type="number" min="0" [(ngModel)]="plan.maxWeeklyInquiries" /></label>
                </div>
                <div class="entitlements">
                  <label><input type="checkbox" [(ngModel)]="plan.canViewDirectPhone" /> View direct phone</label>
                  <label><input type="checkbox" [(ngModel)]="plan.hasInstantAlerts" /> Instant alerts</label>
                </div>
                <div class="footer">
                  <span>{{ savedPlanId === plan.id ? 'Saved successfully' : 'Changes take effect when saved' }}</span>
                  <button (click)="save(plan)" [disabled]="savingPlanId === plan.id">
                    {{ savingPlanId === plan.id ? 'Saving…' : 'Save plan' }}
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100%; color:#172033; }
    .page { min-height:100%; background:var(--bg-page, #f5f7fb); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:1.5rem 2rem; background:white; border-bottom:1px solid #e5e9f0; }
    h1 { margin:0; font-size:1.45rem; letter-spacing:-.03em; }
    .page-header p { margin:.35rem 0 0; color:#697586; font-size:.9rem; }
    .content { padding:1.5rem 2rem; }
    .plans { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:1rem; }
    .plan-card { padding:1.2rem; background:white; border:1px solid #e5e9f0; border-radius:14px; box-shadow:0 4px 18px #15243b08; }
    .plan-heading, .footer { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
    .tier { color:#258168; font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
    h2 { margin:.25rem 0 1rem; font-size:1.15rem; }
    .active-toggle, .entitlements label { display:flex; align-items:center; gap:.4rem; color:#5d687a; font-size:.8rem; }
    .fields { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; }
    .fields label { display:grid; gap:.35rem; color:#667184; font-size:.76rem; font-weight:700; }
    input[type="number"] { width:100%; box-sizing:border-box; padding:.55rem .6rem; border:1px solid #d9e0e9; border-radius:8px; color:#253047; }
    input[type="checkbox"] { accent-color:#217c64; }
    .entitlements { display:flex; flex-wrap:wrap; gap:1rem; margin:1rem 0; }
    .footer { border-top:1px solid #edf0f4; padding-top:.85rem; color:#748094; font-size:.76rem; }
    button { border:1px solid #217c64; background:#217c64; color:white; padding:.55rem .8rem; border-radius:8px; font-weight:700; cursor:pointer; }
    button:disabled { opacity:.55; cursor:wait; }
    .refresh { border-color:#d9e0e9; background:white; color:#344054; }
    .state { padding:3rem; text-align:center; color:#667184; }
    .empty { background:white; border:1px dashed #d9e0e9; border-radius:12px; }
    .alert { margin-bottom:1rem; padding:.8rem 1rem; border:1px solid #f2c8c8; border-radius:9px; background:#fff2f2; color:#913c3c; }
    @media(max-width:760px) { .page-header { align-items:stretch; flex-direction:column; padding:1.2rem; } .content { padding:1rem; } .plans { grid-template-columns:1fr; } .plan-heading { align-items:flex-start; flex-direction:column; } }
  `]
})
export class SubscriptionPlansComponent implements OnInit {
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  plans: SubscriptionPlanAdmin[] = [];
  loading = true;
  error = '';
  savingPlanId = '';
  savedPlanId = '';

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getSubscriptionPlans().subscribe({
      next: result => {
        this.loading = false;
        this.changeDetector.markForCheck();
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load subscription plans.';
          return;
        }
        this.plans = result.data;
        this.changeDetector.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.errors?.[0] || 'Unable to load subscription plans.';
        this.changeDetector.markForCheck();
      }
    });
  }

  save(plan: SubscriptionPlanAdmin): void {
    const dto: UpdateSubscriptionPlanDto = {
      priceETB: plan.priceETB,
      billingPeriodDays: plan.billingPeriodDays,
      maxActiveFavorites: plan.maxActiveFavorites,
      maxWeeklyInquiries: plan.maxWeeklyInquiries,
      canViewDirectPhone: plan.canViewDirectPhone,
      hasInstantAlerts: plan.hasInstantAlerts,
      isActive: plan.isActive
    };
    this.savingPlanId = plan.id;
    this.savedPlanId = '';
    this.error = '';
    this.adminService.updateSubscriptionPlan(plan.id, dto).subscribe({
      next: result => {
        this.savingPlanId = '';
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to save this plan.';
          return;
        }
        Object.assign(plan, result.data);
        this.savedPlanId = plan.id;
      },
      error: err => {
        this.savingPlanId = '';
        this.error = err.error?.errors?.[0] || 'Unable to save this plan.';
      }
    });
  }
}
