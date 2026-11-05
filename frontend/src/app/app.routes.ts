import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PropertyListComponent } from './features/public/property-list/property-list.component';
import { PropertyDetailComponent } from './features/public/property-detail/property-detail.component';
import { AddPropertyComponent } from './features/landlord/add-property/add-property.component';
import { MyPropertiesComponent } from './features/landlord/my-properties/my-properties.component';
import { LandlordPaymentsComponent } from './features/landlord/payments/landlord-payments.component';
import { LandlordDashboardComponent } from './features/landlord/dashboard/landlord-dashboard.component';
import { LandlordLayoutComponent } from './features/landlord/landlord-layout/landlord-layout.component';
import { ProfileComponent } from './features/renter/profile/profile.component';
import { NotificationsComponent } from './features/renter/notifications/notifications.component';
import { ModerationQueueComponent } from './features/admin/moderation-queue/moderation-queue.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { UsersComponent } from './features/admin/users/users.component';
import { AnalyticsComponent } from './features/admin/analytics/analytics.component';
import { SettingsComponent } from './features/admin/settings/settings.component';
import { ReportsComponent } from './features/admin/reports/reports.component';
import { PaymentsComponent } from './features/admin/payments/payments.component';
import { AuditLogsComponent } from './features/admin/audit-logs/audit-logs.component';
import { SubscriptionPlansComponent } from './features/admin/plans/subscription-plans.component';
import { PublishedListingsComponent } from './features/admin/published-listings/published-listings.component';
import { SupportComponent } from './features/admin/support/support.component';
import { SupportDashboardComponent } from './features/support/support-dashboard.component';
import { SupportLayoutComponent } from './features/support/support-layout.component';
import { FavoritesComponent } from './features/renter/favorites/favorites.component';
import { SavedSearchesComponent } from './features/renter/saved-searches/saved-searches.component';
import { RenterDashboardComponent } from './features/renter/dashboard/renter-dashboard.component';
import { RenterLayoutComponent } from './features/renter/renter-layout/renter-layout.component';
import { InquiriesInboxComponent } from './features/interactions/inquiries/inquiries-inbox.component';
import { AppointmentsListComponent } from './features/interactions/appointments/appointments-list.component';
import { ApplicationsListComponent } from './features/interactions/applications/applications-list.component';
import { SubscriptionComponent } from './features/subscription/subscription.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

export const routes: Routes = [
  // Full-screen pages (no header/footer)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Everything inside the new header + footer layout
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },

      { path: 'properties', component: PropertyListComponent },
      { path: 'properties/:id', component: PropertyDetailComponent },
      { path: 'subscription', component: SubscriptionComponent, canActivate: [authGuard] },

      // Public / shared interaction routes
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'favorites', redirectTo: 'renter/favorites', pathMatch: 'full' },
      { path: 'saved-searches', redirectTo: 'renter/saved-searches', pathMatch: 'full' },
      { path: 'messages', redirectTo: 'renter/messages', pathMatch: 'full' },
      { path: 'appointments', redirectTo: 'renter/appointments', pathMatch: 'full' },
      { path: 'applications', redirectTo: 'renter/applications', pathMatch: 'full' },

    ],
  },

  // Renter protected routes with dedicated Fluent layout
  {
    path: 'support',
    component: SupportLayoutComponent,
    canActivate: [authGuard, roleGuard(['Support'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupportDashboardComponent },
      { path: 'tickets', component: SupportComponent },
    ],
  },

  {
    path: 'renter',
    component: RenterLayoutComponent,
    canActivate: [authGuard, roleGuard(['Renter'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: RenterDashboardComponent },
      { path: 'favorites', component: FavoritesComponent },
      { path: 'saved-searches', component: SavedSearchesComponent },
      { path: 'messages', component: InquiriesInboxComponent },
      { path: 'appointments', component: AppointmentsListComponent },
      { path: 'applications', component: ApplicationsListComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'subscription', component: SubscriptionComponent },
      { path: 'notifications', component: NotificationsComponent },
    ],
  },

  {
    path: 'landlord',
    component: LandlordLayoutComponent,
    canActivate: [authGuard, roleGuard(['Landlord'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: LandlordDashboardComponent },
      { path: 'my-properties', component: MyPropertiesComponent },
      { path: 'payments', component: LandlordPaymentsComponent },
      {
        path: 'add-property',
        component: AddPropertyComponent,
      },
      { path: 'messages', component: InquiriesInboxComponent },
      { path: 'appointments', component: AppointmentsListComponent },
      { path: 'applications', component: ApplicationsListComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationsComponent },
    ],
  },

  // Admin protected routes with their own layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard(['Admin'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'moderation', component: ModerationQueueComponent },
      { path: 'listings', component: PublishedListingsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'support', component: SupportComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'plans', component: SubscriptionPlansComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
