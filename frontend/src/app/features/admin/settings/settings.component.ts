import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { PlatformSetting } from '../../../core/models/admin.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-left">
          <h1>Platform Settings</h1>
          <p>Configure platform-wide settings and policies</p>
        </div>
      </header>
      <div class="admin-content">
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading settings...</p>
          </div>
        } @else if (settings.length === 0) {
          <div class="empty-state">
            <span class="empty-emoji">⚙️</span>
            <h2>No Settings Found</h2>
            <p>No platform settings are configured.</p>
          </div>
        } @else {
          <div class="settings-grid">
            @for (setting of settings; track setting.key) {
              <div class="setting-card">
                <div class="card-header">
                  <h3>{{ setting.key }}</h3>
                  <span class="category-badge">{{ setting.category }}</span>
                </div>
                <div class="card-body">
                  <p class="description">{{ setting.description }}</p>
                  <div class="value-editor">
                    <label class="label">Value</label>
                    <input 
                      type="text" 
                      [(ngModel)]="setting.value" 
                      class="value-input"
                      (blur)="updateSetting(setting)"
                    />
                  </div>
                  <div class="meta-info">
                    <span class="meta-label">Last updated:</span>
                    <span class="meta-value">{{ setting.updatedAtUtc | date:'short' }}</span>
                    @if (setting.updatedBy) {
                      <span class="meta-label">by:</span>
                      <span class="meta-value">{{ setting.updatedBy }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .admin-header {
      background: white;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .admin-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .admin-header p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    .admin-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
    }
    .empty-emoji {
      font-size: 4rem;
      margin-bottom: 1rem;
      display: block;
    }
    .empty-state h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }
    .empty-state p {
      color: #64748b;
      margin: 0;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    .setting-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .card-header {
      padding: 1.25rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .category-badge {
      padding: 0.25rem 0.625rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .card-body {
      padding: 1.25rem;
    }
    .description {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
    }
    .value-editor {
      margin-bottom: 1rem;
    }
    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.375rem;
    }
    .value-input {
      width: 100%;
      padding: 0.625rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .value-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .meta-label {
      font-weight: 600;
    }
    .meta-value {
      color: #1e293b;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private adminService = inject(AdminService);

  settings: PlatformSetting[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.adminService.getSettings().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.settings = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  updateSetting(setting: PlatformSetting) {
    this.adminService.updateSetting(setting.key, setting.value).subscribe({
      next: () => {
        // Settings updated successfully
      },
      error: () => {
        // Handle error
      }
    });
  }
}
