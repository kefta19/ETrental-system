import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-left">
          <h1>User Management</h1>
          <p>Manage platform users and accounts</p>
        </div>
        <div class="header-right">
          <select [(ngModel)]="roleFilter" (change)="filtersChanged()" class="filter-select" aria-label="Filter by role">
            <option value="">All roles</option>
            <option value="Renter">Renter</option>
            <option value="Landlord">Landlord</option>
            <option value="Support">Support</option>
            <option value="Admin">Admin</option>
          </select>
          <select [(ngModel)]="restrictionFilter" (change)="filtersChanged()" class="filter-select" aria-label="Filter account restriction">
            <option value="all">All account states</option>
            <option value="restricted">Restricted</option>
            <option value="available">Not restricted</option>
          </select>
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search users..." 
              (keyup.enter)="filtersChanged()"
              class="search-input"
            />
            <button class="search-btn" (click)="filtersChanged()" aria-label="Search users">
              <span class="material-icons-outlined" aria-hidden="true">search</span>
            </button>
          </div>
        </div>
      </header>
      <div class="admin-content">
        @if (error) {
          <div class="error-state" role="alert">
            <span>{{ error }}</span>
            <button type="button" class="retry-btn" (click)="loadUsers()">Retry</button>
          </div>
        }
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading users...</p>
          </div>
        } @else if (users.length === 0) {
          <div class="empty-state">
            <span class="empty-emoji material-icons-outlined" aria-hidden="true">groups</span>
            <h2>No Users Found</h2>
            <p>Try adjusting your search filters.</p>
          </div>
        } @else {
          <div class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users; track user.id) {
                  <tr>
                    <td class="user-cell">
                      <div class="user-avatar">{{ user.fullName?.charAt(0) || 'U' }}</div>
                      <div class="user-info">
                        <button class="user-name" (click)="viewUser(user)">{{ user.fullName }}</button>
                      </div>
                    </td>
                    <td class="email-cell">{{ user.email }}</td>
                    <td>
                      <span class="role-badge" [class.role-admin]="user.roles.includes('Admin')" [class.role-landlord]="user.roles.includes('Landlord')">
                        {{ user.roles[0] }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class.status-active]="user.isActive && !user.isRestricted" [class.status-restricted]="user.isRestricted || !user.isActive">
                        {{ user.isRestricted ? 'Restricted' : user.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="date-cell">{{ user.createdAtUtc | date:'shortDate' }}</td>
                    <td class="actions-cell">
                      @if (!user.isRestricted && user.isActive) {
                        <button class="action-btn restrict" (click)="restrictUser(user)" title="Restrict User">
                          <span class="material-icons-outlined" aria-hidden="true">lock</span>
                        </button>
                      } @else {
                        <button class="action-btn activate" (click)="activateUser(user)" title="Reactivate User">
                          <span class="material-icons-outlined" aria-hidden="true">lock_open</span>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (totalCount > pageSize) {
            <div class="pagination">
              <button [disabled]="page <= 1" (click)="changePage(-1)">Previous</button>
              <span>Page {{ page }} · {{ totalCount }} accounts</span>
              <button [disabled]="page * pageSize >= totalCount" (click)="changePage(1)">Next</button>
            </div>
          }
        }
      </div>
      @if (selectedUser) {
        <div class="detail-backdrop" (click)="selectedUser = null">
          <section class="detail-modal" role="dialog" aria-modal="true" aria-label="Account details" (click)="$event.stopPropagation()">
            <header>
              <div><span>ACCOUNT PROFILE</span><h2>{{ selectedUser.fullName }}</h2></div>
              <button class="close-btn" (click)="selectedUser = null" aria-label="Close account details">×</button>
            </header>
            @if (detailLoading) {
              <p class="detail-state">Loading account details…</p>
            } @else {
              <dl>
                <div><dt>Email</dt><dd>{{ selectedUser.email }}</dd></div>
                <div><dt>Phone</dt><dd>{{ selectedUser.phoneNumber || 'Not provided' }}</dd></div>
                <div><dt>Roles</dt><dd>{{ selectedUser.roles.join(', ') }}</dd></div>
                <div><dt>Status</dt><dd>{{ selectedUser.isRestricted ? 'Restricted' : selectedUser.isActive ? 'Active' : 'Inactive' }}</dd></div>
                <div><dt>Email verified</dt><dd>{{ selectedUser.emailConfirmed ? 'Yes' : 'No' }}</dd></div>
                <div><dt>Phone verified</dt><dd>{{ selectedUser.phoneNumberConfirmed ? 'Yes' : 'No' }}</dd></div>
                <div><dt>Subscription</dt><dd>{{ selectedUser.subscriptionTier }}</dd></div>
                <div><dt>Listings</dt><dd>{{ selectedUser.propertyCount }}</dd></div>
                <div><dt>Joined</dt><dd>{{ selectedUser.createdAtUtc | date:'medium' }}</dd></div>
                <div><dt>Last login</dt><dd>{{ selectedUser.lastLoginAtUtc ? (selectedUser.lastLoginAtUtc | date:'medium') : 'No login recorded' }}</dd></div>
                @if (selectedUser.restrictionReason) {
                  <div class="wide"><dt>Restriction reason</dt><dd>{{ selectedUser.restrictionReason }}</dd></div>
                }
              </dl>
            }
          </section>
        </div>
      }
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
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .header-left p {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    .search-box {
      display: flex;
      gap: 0.5rem;
    }
    .header-right { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .filter-select {
      padding: 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #334155;
    }
    .search-input {
      padding: 0.625rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      width: 250px;
    }
    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .search-btn {
      padding: 0.625rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
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
    .users-table-container {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table thead {
      background: #f8fafc;
    }
    .users-table th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .users-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .users-table tr:last-child td {
      border-bottom: none;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .user-name {
      padding: 0;
      border: 0;
      background: none;
      font-weight: 600;
      color: #1e293b;
      cursor: pointer;
      text-align: left;
    }
    .user-name:hover { color: #2563eb; text-decoration: underline; }
    .email-cell {
      color: #64748b;
      font-size: 0.875rem;
    }
    .role-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #64748b;
    }
    .role-badge.role-admin {
      background: #fef3c7;
      color: #92400e;
    }
    .role-badge.role-landlord {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge.status-active {
      background: #dcfce7;
      color: #166534;
    }
    .status-badge.status-restricted {
      background: #fee2e2;
      color: #991b1b;
    }
    .date-cell {
      color: #64748b;
      font-size: 0.875rem;
    }
    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .action-btn.restrict {
      background: #fef2f2;
      color: #dc2626;
    }
    .action-btn.restrict:hover {
      background: #fee2e2;
    }
    .action-btn.activate {
      background: #dcfce7;
      color: #166534;
    }
    .action-btn.activate:hover {
      background: #d1fae5;
    }
    .error-state {
      margin: 1rem 2rem 0;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid #fecaca;
      border-radius: 8px;
      background: #fff1f2;
      color: #991b1b;
    }
    .retry-btn {
      flex: 0 0 auto;
      padding: 0.4rem 0.75rem;
      border: 1px solid #fecaca;
      border-radius: 6px;
      background: white;
      color: #991b1b;
      font-weight: 600;
      cursor: pointer;
    }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; color:#697586; font-size:.85rem; }
    .pagination button { border:1px solid #d9e0e9; background:white; padding:.5rem .75rem; border-radius:8px; cursor:pointer; }
    .pagination button:disabled { opacity:.45; cursor:not-allowed; }
    .detail-backdrop { position:fixed; inset:0; z-index:200; display:grid; place-items:center; padding:1rem; background:#0f172a99; }
    .detail-modal { width:min(650px,100%); max-height:90vh; overflow:auto; padding:1.3rem; border-radius:15px; background:white; box-shadow:0 24px 80px #0004; }
    .detail-modal header { display:flex; justify-content:space-between; align-items:flex-start; }
    .detail-modal header span { color:#258168; font-size:.7rem; font-weight:800; letter-spacing:.08em; }
    .detail-modal h2 { margin:.25rem 0 1rem; }
    .close-btn { border:1px solid #e2e8f0; border-radius:8px; background:white; padding:.25rem .65rem; font-size:1.3rem; cursor:pointer; }
    dl { display:grid; grid-template-columns:1fr 1fr; gap:.2rem .9rem; margin:0; }
    dl div { padding:.65rem 0; border-bottom:1px solid #edf0f4; }
    dl div.wide { grid-column:1/-1; }
    dt { color:#778195; font-size:.72rem; font-weight:700; }
    dd { margin:.25rem 0 0; color:#263247; font-size:.85rem; overflow-wrap:anywhere; }
    .detail-state { padding:2rem; text-align:center; color:#687488; }
    @media(max-width:750px) { .admin-header { align-items:stretch; flex-direction:column; gap:1rem; } .users-table-container { overflow-x:auto; } .users-table { min-width:750px; } dl { grid-template-columns:1fr; } }
  `]
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  users: AdminUser[] = [];
  isLoading = true;
  searchQuery = '';
  error = '';
  roleFilter = '';
  restrictionFilter: 'all' | 'restricted' | 'available' = 'all';
  page = 1;
  readonly pageSize = 20;
  totalCount = 0;
  selectedUser: AdminUser | null = null;
  detailLoading = false;

  constructor() {
    this.adminService.pageRefreshRequested$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loadUsers());
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.error = '';
    this.adminService.getUsers(
      this.searchQuery || undefined,
      this.roleFilter || undefined,
      this.restrictionFilter === 'all' ? undefined : this.restrictionFilter === 'restricted',
      this.page,
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.changeDetector.markForCheck();
        if (res.succeeded && res.data) {
          this.users = res.data.items || [];
          this.totalCount = res.data.totalCount;
        } else {
          this.error = res.errors?.[0] || 'Unable to load users.';
        }
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.errors?.[0] || 'Unable to load users.';
        this.changeDetector.markForCheck();
      }
    });
  }

  filtersChanged(): void {
    this.page = 1;
    this.loadUsers();
  }

  changePage(delta: number): void {
    this.page += delta;
    this.loadUsers();
  }

  viewUser(user: AdminUser): void {
    this.selectedUser = user;
    this.detailLoading = true;
    this.adminService.getUser(user.id).subscribe({
      next: result => {
        this.detailLoading = false;
        if (!result.succeeded || !result.data) {
          this.error = result.errors?.[0] || 'Unable to load account details.';
          this.selectedUser = null;
          return;
        }
        this.selectedUser = result.data;
      },
      error: error => {
        this.detailLoading = false;
        this.selectedUser = null;
        this.error = error.error?.errors?.[0] || 'Unable to load account details.';
      }
    });
  }

  restrictUser(user: AdminUser) {
    const reason = prompt('Enter reason for restriction:');
    if (reason) {
      this.adminService.setRestriction(user.id, { isRestricted: true, reason }).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: error => this.error = error.error?.errors?.[0] || 'Could not restrict this account.'
      });
    }
  }

  activateUser(user: AdminUser) {
    const request = user.isRestricted
      ? this.adminService.setRestriction(user.id, { isRestricted: false, reason: 'Admin reactivation' })
      : this.adminService.setActive(user.id, true, 'Admin activation');
    request.subscribe({
      next: () => {
        this.loadUsers();
      },
      error: error => this.error = error.error?.errors?.[0] || 'Could not reactivate this account.'
    });
  }
}
