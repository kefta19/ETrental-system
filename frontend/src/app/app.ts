import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <main class="page-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .page-content {
        flex: 1;
      }
    `,
  ],
})
export class App {
  authService = inject(AuthService);
  translationService = inject(TranslationService);
}
