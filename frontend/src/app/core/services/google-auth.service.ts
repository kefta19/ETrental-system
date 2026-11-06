import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { GOOGLE_CLIENT_ID } from '../config/api.config';
import { firstValueFrom } from 'rxjs';

export interface GoogleProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private authService = inject(AuthService);
  private router = inject(Router);

  get clientId(): string {
    return GOOGLE_CLIENT_ID?.trim() || '';
  }

  get isConfigured(): boolean {
    const id = this.clientId;
    return !!id && id.length > 10;
  }

  /**
   * Directly opens the real Google OAuth account chooser (accounts.google.com).
   * Opens as a popup window, and falls back to direct redirect if popups are blocked.
   */
  async signInWithGoogle(role: string = 'renter'): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Google Client ID is not configured in api.config.ts');
    }

    // Use current origin so it matches the Google Cloud Console Authorized redirect URI
    const redirectUri = window.location.origin;
    const state = JSON.stringify({ role, returnUrl: window.location.pathname });

    const authUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${encodeURIComponent(this.clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=select_account&` +
      `state=${encodeURIComponent(state)}`;

    const width = 500;
    const height = 620;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      authUrl,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed) {
      // Popups blocked by browser -> redirect the main window directly to Google
      window.location.href = authUrl;
      return;
    }

    // Monitor popup until user finishes Google authentication
    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const timer = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(timer);
            if (!resolved) {
              reject(new Error('Google sign-in popup was closed.'));
            }
            return;
          }

          // Check if popup returned to our origin with the access token in hash
          const popupUrl = popup.location.href;
          if (popupUrl && popupUrl.startsWith(window.location.origin) && popupUrl.includes('access_token')) {
            resolved = true;
            clearInterval(timer);

            const hash = popup.location.hash.substring(1);
            popup.close();

            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const stateParam = params.get('state');

            let parsedRole = role;
            if (stateParam) {
              try {
                const parsed = JSON.parse(decodeURIComponent(stateParam));
                if (parsed.role) parsedRole = parsed.role;
              } catch {
                // ignore
              }
            }

            if (!accessToken) {
              reject(new Error('No access token received from Google.'));
              return;
            }

            try {
              await this.processAccessToken(accessToken, parsedRole);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        } catch {
          // Cross-origin exception while the popup is on accounts.google.com — safe to ignore
        }
      }, 350);
    });
  }

  /**
   * Checks if the current window URL has a Google access token (from direct redirect)
   * and processes it if found.
   */
  async handleRedirectCallback(): Promise<boolean> {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) {
      return false;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const stateParam = params.get('state');

    // Clean hash from browser address bar
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (!accessToken) return false;

    let role = 'renter';
    if (stateParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(stateParam));
        if (parsed.role) role = parsed.role;
      } catch {
        // ignore
      }
    }

    await this.processAccessToken(accessToken, role);
    return true;
  }

  /**
   * Fetches Google user profile with the access token and authenticates with the ETrental API.
   */
  async processAccessToken(accessToken: string, role: string = 'renter'): Promise<void> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error('Failed to retrieve user info from Google.');
    }

    const profile: GoogleProfile = await res.json();
    const result = await firstValueFrom(
      this.authService.googleAuth({
        email: profile.email,
        firstName: profile.given_name || profile.name || 'Google User',
        lastName: profile.family_name || '',
        photoUrl: profile.picture,
        role: role
      })
    );

    if (!result.succeeded || !result.data?.user) {
      throw new Error(result.errors?.[0] || 'Google authentication failed on server.');
    }

    if (profile.picture && (!result.data.user.profilePictureUrl || result.data.user.profilePictureUrl !== profile.picture)) {
      result.data.user.profilePictureUrl = profile.picture;
      this.authService.syncProfile({
        firstName: result.data.user.firstName,
        lastName: result.data.user.lastName,
        email: result.data.user.email,
        phoneNumber: result.data.user.phoneNumber,
        profilePictureUrl: profile.picture
      });
    }

    const destination = this.authService.dashboardRoute(result.data.user);
    this.router.navigateByUrl(destination);
  }
}
