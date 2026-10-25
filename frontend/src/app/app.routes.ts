import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PropertyListComponent } from './features/public/property-list/property-list.component';
import { PropertyDetailComponent } from './features/public/property-detail/property-detail.component';
import { AddPropertyComponent } from './features/landlord/add-property/add-property.component';
import { MyPropertiesComponent } from './features/landlord/my-properties/my-properties.component';
import { LandlordDashboardComponent } from './features/landlord/dashboard/landlord-dashboard.component';
import { ModerationQueueComponent } from './features/admin/moderation-queue/moderation-queue.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { UsersComponent } from './features/admin/users/users.component';
import { AgenciesComponent } from './features/admin/agencies/agencies.component';
import { AnalyticsComponent } from './features/admin/analytics/analytics.component';
import { SettingsComponent } from './features/admin/settings/settings.component';
import { FavoritesComponent } from './features/renter/favorites/favorites.component';
import { SavedSearchesComponent } from './features/renter/saved-searches/saved-searches.component';
import { RenterDashboardComponent } from './features/renter/dashboard/renter-dashboard.component';
import { AgencyDashboardComponent } from './features/agency/dashboard/agency-dashboard.component';
import { InquiriesInboxComponent } from './features/interactions/inquiries/inquiries-inbox.component';
import { AppointmentsListComponent } from './features/interactions/appointments/appointments-list.component';
import { ApplicationsListComponent } from './features/interactions/applications/applications-list.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  { path: '', component: HomeComponent },
  
  // Main Layout with Sidebar for other routes
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'properties', component: PropertyListComponent },
      { path: 'properties/:id', component: PropertyDetailComponent },
      
      // Phase 3: Renter & Shared Interaction Routes
      {
        path: 'renter/dashboard',
        component: RenterDashboardComponent,
        canActivate: [authGuard]
      },
      {
        path: 'favorites',
        component: FavoritesComponent,
        canActivate: [authGuard]
      },
      {
        path: 'saved-searches',
        component: SavedSearchesComponent,
        canActivate: [authGuard]
      },
      {
        path: 'messages',
        component: InquiriesInboxComponent,
        canActivate: [authGuard]
      },
      {
        path: 'appointments',
        component: AppointmentsListComponent,
        canActivate: [authGuard]
      },
      {
        path: 'applications',
        component: ApplicationsListComponent,
        canActivate: [authGuard]
      },

      // Landlord & Agency Protected Routes
      { 
        path: 'landlord/dashboard', 
        component: LandlordDashboardComponent,
        canActivate: [authGuard]
      },
      { 
        path: 'agency/dashboard',
        component: AgencyDashboardComponent,
        canActivate: [authGuard]
      },
      { 
        path: 'landlord/add-property', 
        component: AddPropertyComponent,
        canActivate: [authGuard]
      },
      { 
        path: 'landlord/my-properties', 
        component: MyPropertiesComponent,
        canActivate: [authGuard]
      }
    ]
  },

  // Admin Protected Routes with Layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard(['Admin'])],
    children: [
      { 
        path: '', 
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      { 
        path: 'dashboard', 
        component: AdminDashboardComponent 
      },
      { 
        path: 'moderation', 
        component: ModerationQueueComponent 
      },
      { 
        path: 'users', 
        component: UsersComponent
      },
      { 
        path: 'agencies', 
        component: AgenciesComponent
      },
      { 
        path: 'analytics', 
        component: AnalyticsComponent
      },
      { 
        path: 'settings', 
        component: SettingsComponent
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
