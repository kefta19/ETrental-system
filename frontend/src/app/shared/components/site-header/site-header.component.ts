import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="site-header">
      <div class="bar">
        <a routerLink="/" class="logo" (click)="closeAll()" aria-label="ETrental home">
          <img class="logo-image" src="/etrental-logo.png" alt="" /><span class="word">ETrental</span>
        </a>

        <form class="header-search" role="search" (ngSubmit)="searchProperties()">
          <span class="material-icons-outlined search-icon" aria-hidden="true">search</span>
          <input
            type="search"
            name="location"
            [(ngModel)]="searchQuery"
            placeholder="Search location, city or area"
            aria-label="Search rentals by location, city, or area"
          />
          <button type="submit" aria-label="Search rentals">
            <span class="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </button>
        </form>

        <nav class="nav" aria-label="Primary">
          <a [routerLink]="alertLink()" class="nav-link">Create AI notification</a>
          <a routerLink="/landlord/add-property" class="nav-link">
            <span class="material-icons-outlined" aria-hidden="true">add_home</span>
            <span>List your property</span>
          </a>
        </nav>

        <div class="actions">
          <span class="language-indicator" aria-label="Language: English">
            <span class="material-icons-outlined" aria-hidden="true">language</span>
          </span>
          <div class="profile-controls" aria-label="Menu and profile">
            <button
              type="button"
              class="burger"
              aria-label="Toggle navigation menu"
              [attr.aria-expanded]="mobileOpen()"
              (click)="mobileOpen.set(!mobileOpen())"
            >
              <span class="material-icons-outlined" aria-hidden="true">{{ mobileOpen() ? 'close' : 'menu' }}</span>
            </button>
          @if (auth.isAuthenticated()) {
            <div class="account">
              <button
                type="button"
                class="profile-button"
                aria-haspopup="menu"
                aria-label="Open profile menu"
                [attr.aria-expanded]="menuOpen()"
                (click)="toggleMenu()"
              >
                <span class="profile-circle">
                  @if (auth.currentUser()?.profilePictureUrl; as pictureUrl) {
                    <img [src]="pictureUrl" alt="" />
                  } @else {
                    <span class="material-icons-outlined" aria-hidden="true">person_outline</span>
                  }
                </span>
              </button>

              @if (menuOpen()) {
                <div class="dropdown" role="menu">
                  <div class="dropdown-head">
                    <strong>{{ auth.currentUser()?.fullName }}</strong>
                    <span>{{ auth.userRole() }}</span>
                  </div>
                  @for (link of accountLinks(); track link.path) {
                    <a
                      role="menuitem"
                      class="dropdown-item"
                      [routerLink]="link.path"
                      (click)="closeAll()"
                      >{{ link.label }}</a
                    >
                  }
                  <button
                    type="button"
                    role="menuitem"
                    class="dropdown-item signout"
                    (click)="signOut()"
                  >
                    Sign out
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/login" class="profile-button" aria-label="Sign in to your profile">
              <span class="profile-circle"><span class="material-icons-outlined" aria-hidden="true">person_outline</span></span>
            </a>
          }
          </div>
        </div>
      </div>

      @if (mobileOpen()) {
        <div class="mobile-panel">
          <a [routerLink]="alertLink()" (click)="closeAll()">Create AI notification</a>
          <a routerLink="/landlord/add-property" (click)="closeAll()">List your property</a>
          <a routerLink="/properties" (click)="closeAll()">Browse rentals</a>
          @if (auth.isAuthenticated()) {
            @for (link of accountLinks(); track link.path) {
              <a [routerLink]="link.path" (click)="closeAll()">{{ link.label }}</a>
            }
          } @else {
            <a routerLink="/login" (click)="closeAll()">Sign in</a>
            <a routerLink="/register" (click)="closeAll()">Sign up</a>
          }
        </div>
      }
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .site-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        background: #fff;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        box-shadow: 0 4px 18px rgb(15 23 42 / 5%);
      }

      .bar {
        width: min(100%, 1680px);
        min-height: 74px;
        margin: 0 auto;
        padding: 0.65rem clamp(1rem, 2.5vw, 2.5rem);
        display: flex;
        align-items: center;
        gap: clamp(1rem, 2vw, 2.25rem);
      }

      .logo {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.45rem;
        text-decoration: none;
      }
      .logo-image {
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        object-fit: contain;
      }
      .word {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--secondary, #0f172a);
      }

      .header-search {
        display: flex;
        flex: 0 1 420px;
        min-width: 220px;
        height: 50px;
        align-items: center;
        gap: 0.65rem;
        padding: 0 0.5rem 0 0.9rem;
        border: 1px solid #cbd5e1;
        border-radius: 17px;
        background: #fff;
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }
      .header-search:focus-within {
        border-color: var(--primary, #10b981);
        box-shadow: 0 0 0 3px rgb(16 185 129 / 12%);
      }
      .search-icon {
        flex: 0 0 auto;
        color: #64748b;
        font-size: 1.4rem;
      }
      .header-search input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--secondary, #0f172a);
        font: inherit;
        font-size: 0.95rem;
      }
      .header-search input::placeholder {
        color: #89939f;
      }
      .header-search button {
        display: grid;
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        place-items: center;
        border: 0;
        border-radius: 12px;
        background: var(--primary, #10b981);
        color: #fff;
        cursor: pointer;
        transition: background 150ms ease;
      }
      .header-search button:hover {
        background: var(--primary-hover, #059669);
      }

      .nav {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: space-between;
        gap: clamp(1rem, 2vw, 2rem);
      }
      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-secondary, #374151);
        font-size: 0.98rem;
        font-weight: 550;
        white-space: nowrap;
        text-decoration: none;
        transition: color 150ms ease;
      }
      .nav-link:hover {
        color: var(--primary-dark, #047857);
      }
      .nav-link .material-icons-outlined {
        font-size: 1.35rem;
      }

      .actions {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
      }
      .language-indicator {
        display: grid;
        width: 42px;
        height: 42px;
        place-items: center;
        color: #164e63;
      }
      .language-indicator .material-icons-outlined {
        font-size: 1.75rem;
      }
      .profile-controls {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 3px 4px 3px 8px;
        border: 1px solid #64748b;
        border-radius: 999px;
        background: #fff;
      }
      .signin {
        color: var(--secondary, #0f172a);
        font-weight: 600;
        font-size: 0.95rem;
        text-decoration: none;
        padding: 0.5rem 0.25rem;
      }
      .signin:hover {
        text-decoration: underline;
      }
      .signup {
        background: var(--primary, #10b981);
        color: #fff;
        padding: 0.55rem 1.1rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.95rem;
        text-decoration: none;
      }
      .signup:hover {
        background: var(--primary-hover, #059669);
      }

      .account {
        position: relative;
      }
      .profile-button {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary, #0f172a);
        text-decoration: none;
        cursor: pointer;
      }
      .profile-button:hover .profile-circle { background: #7f8b86; }
      .profile-circle {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        overflow: hidden;
        border-radius: 50%;
        background: #929995;
        color: white;
        transition: background 150ms ease;
      }
      .profile-circle .material-icons-outlined { font-size: 1.55rem; }
      .profile-circle img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 230px;
        background: #fff;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
        padding: 0.4rem;
        display: flex;
        flex-direction: column;
      }
      .dropdown-head {
        display: flex;
        flex-direction: column;
        padding: 0.6rem 0.7rem 0.7rem;
        border-bottom: 1px solid var(--border-color-light, #f3f4f6);
        margin-bottom: 0.3rem;
        font-size: 0.9rem;
      }
      .dropdown-head span {
        font-size: 0.78rem;
        color: var(--text-muted, #6b7280);
      }
      .dropdown-item {
        padding: 0.55rem 0.7rem;
        border-radius: 8px;
        color: var(--text-secondary, #374151);
        font-size: 0.9rem;
        font-weight: 500;
        text-decoration: none;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
      }
      .dropdown-item:hover {
        background: var(--primary-lighter, #ecfdf5);
        color: var(--primary-dark, #047857);
      }
      .signout {
        margin-top: 0.3rem;
        border-top: 1px solid var(--border-color-light, #f3f4f6);
        border-radius: 0 0 8px 8px;
        color: var(--danger, #dc2626);
      }
      .signout:hover {
        background: #fee2e2;
        color: var(--danger, #dc2626);
      }

      .burger {
        display: inline-grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        color: var(--secondary, #0f172a);
        transition: background 150ms ease, border-color 150ms ease;
      }
      .burger:hover {
        background: var(--primary-lighter, #ecfdf5);
      }

      .mobile-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: max(1rem, calc((100vw - 1200px) / 2 + 1.5rem));
        display: flex;
        width: min(340px, calc(100vw - 2rem));
        max-height: min(70vh, 560px);
        flex-direction: column;
        overflow-y: auto;
        padding: 0.5rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 18px 48px rgb(15 23 42 / 16%);
      }
      .mobile-panel a {
        padding: 0.7rem 0.8rem;
        border-radius: 8px;
        color: var(--secondary, #0f172a);
        font-size: .9rem;
        font-weight: 550;
        text-decoration: none;
        transition: background 150ms ease, color 150ms ease;
      }
      .mobile-panel a:hover {
        background: var(--primary-lighter, #ecfdf5);
        color: var(--primary-dark, #047857);
      }

      a:focus-visible,
      button:focus-visible {
        outline: 2px solid var(--primary, #10b981);
        outline-offset: 2px;
      }

      @media (max-width: 1120px) {
        .nav {
          display: none;
        }
        .bar {
          gap: 1.25rem;
        }
        .header-search {
          flex: 1 1 320px;
        }
      }

      @media (max-width: 640px) {
        .bar {
          min-height: 0;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.5rem 0.75rem;
          padding: 0.45rem 0.85rem 0.65rem;
        }
        .logo-image {
          width: 42px;
          height: 42px;
          flex-basis: 42px;
        }
        .word {
          font-size: 1.15rem;
        }
        .actions {
          gap: 0.45rem;
          margin-left: auto;
        }
        .language-indicator {
          width: 36px;
          height: 36px;
        }
        .language-indicator .material-icons-outlined {
          font-size: 1.5rem;
        }
        .profile-controls {
          gap: 0.1rem;
          padding: 2px 3px 2px 5px;
        }
        .burger,
        .profile-button {
          width: 36px;
          height: 36px;
        }
        .profile-circle {
          width: 32px;
          height: 32px;
        }
        .header-search {
          order: 2;
          flex: 1 0 100%;
          min-width: 0;
          height: 44px;
          border-radius: 14px;
        }
        .header-search button {
          width: 34px;
          height: 34px;
          flex-basis: 34px;
        }
      }

      @media (max-width: 360px) {
        .bar {
          padding-right: 0.65rem;
          padding-left: 0.65rem;
        }
        .actions {
          gap: 0.2rem;
        }
        .logo {
          gap: 0.2rem;
        }
        .logo-image {
          width: 38px;
          height: 38px;
          flex-basis: 38px;
        }
        .word {
          font-size: 1.05rem;
        }
      }
    `,
  ],
})
export class SiteHeaderComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly menuOpen = signal(false);
  readonly mobileOpen = signal(false);
  searchQuery = '';

  /** Guests are sent to register; signed-in users go straight to their saved searches. */
  alertLink(): string {
    return this.auth.isAuthenticated() ? '/saved-searches' : '/register';
  }

  searchProperties(): void {
    const location = this.searchQuery.trim();
    this.router.navigate(['/properties'], {
      queryParams: location ? { location } : {},
    });
    this.closeAll();
  }

  accountLinks(): MenuLink[] {
    const links: MenuLink[] = [];

    if (this.auth.isAdmin()) {
      links.push({ label: 'Admin panel', path: '/admin/dashboard' });
      links.push({ label: 'Moderation queue', path: '/admin/moderation' });
      links.push({ label: 'Published listings', path: '/admin/listings' });
      links.push({ label: 'Users', path: '/admin/users' });
    } else if (this.auth.isLandlord()) {
      links.push({ label: 'Dashboard', path: '/landlord/dashboard' });
      links.push({ label: 'My properties', path: '/landlord/my-properties' });
      links.push({ label: 'Add property', path: '/landlord/add-property' });
      links.push({ label: 'Messages', path: '/landlord/messages' });
      links.push({ label: 'Viewings', path: '/landlord/appointments' });
      links.push({ label: 'Applications', path: '/landlord/applications' });

      links.push({ label: 'My listings', path: '/landlord/my-properties' });
    } else {
      // Default to Renter links
      links.push({ label: 'Dashboard', path: '/renter/dashboard' });
      links.push({ label: 'Saved homes', path: '/renter/favorites' });
      links.push({ label: 'Search alerts', path: '/renter/saved-searches' });
      links.push({ label: 'Messages', path: '/renter/messages' });
      links.push({ label: 'Viewings', path: '/renter/appointments' });
      links.push({ label: 'Applications', path: '/renter/applications' });
    }

    return links;
  }

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  closeAll(): void {
    this.menuOpen.set(false);
    this.mobileOpen.set(false);
  }

  signOut(): void {
    this.closeAll();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }
}
