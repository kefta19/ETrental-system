import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="inner">
        <div class="brand">
          <a routerLink="/" class="logo"
            ><img class="logo-image" src="/etrental-logo.png" alt="" /><span class="word">ETrental</span></a
          >
          <p>Find a rental home in Ethiopia and connect with landlords and agencies directly.</p>
        </div>

        <div class="col">
          <h3>For tenants</h3>
          <a routerLink="/properties">Search rental properties</a>
          <a routerLink="/register">Create AI notification</a>
          <a routerLink="/favorites">Favorites</a>
        </div>

        <div class="col">
          <h3>For landlords</h3>
          <a routerLink="/landlord/add-property">List your property</a>
          <a routerLink="/landlord/my-properties">My listings</a>
          <a routerLink="/landlord/dashboard">Landlord dashboard</a>
        </div>

        <div class="col">
          <h3>Browse by city</h3>
          @for (city of cities; track city) {
            <a routerLink="/properties" [queryParams]="{ city: city }">{{ city }}</a>
          }
        </div>
      </div>
      <div class="legal">&copy; {{ year }} ETrental. All rights reserved.</div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background: var(--secondary, #0f172a);
        color: #cbd5e1;
        margin-top: 3rem;
      }
      .inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 3rem 1.5rem 2rem;
        display: grid;
        grid-template-columns: 1.6fr 1fr 1fr 1fr;
        gap: 2rem;
      }
      .logo {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        text-decoration: none;
        margin-bottom: 0.75rem;
      }
      .logo-image {
        width: 40px;
        height: 40px;
        object-fit: contain;
      }
      .word {
        color: #fff;
        font-weight: 800;
        font-size: 1.2rem;
        letter-spacing: -0.02em;
      }
      .brand p {
        margin: 0;
        max-width: 32ch;
        font-size: 0.9rem;
        line-height: 1.6;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      h3 {
        margin: 0 0 0.35rem;
        font-size: 0.95rem;
        color: #fff;
      }
      .col a {
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .col a:hover {
        color: #fff;
        text-decoration: underline;
      }
      .legal {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
        padding: 1.1rem 1.5rem;
        font-size: 0.82rem;
      }
      @media (max-width: 800px) {
        .inner {
          grid-template-columns: 1fr 1fr;
        }
        .brand {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
  readonly cities = [
    'Addis Ababa',
    'Hawassa',
    'Mekelle',
    'Bahir Dar',
    'Dire Dawa',
    'Adama',
    'Jimma',
    'Gondar',
  ];
}
