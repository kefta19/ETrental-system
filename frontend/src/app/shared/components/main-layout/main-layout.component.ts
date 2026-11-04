import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';

/** Top header + page + footer. Replaces the old sidebar layout. */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <app-site-header />
    <main class="page"><router-outlet /></main>
    <app-site-footer />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--bg-page, #f9fafb);
      }
      .page {
        flex: 1;
        padding-top: 74px;
      }
      @media (max-width: 640px) {
        .page {
          padding-top: 122px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {}
