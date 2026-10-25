import { Component, OnInit, inject } from '@angular/core';
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
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search users..." 
              (keyup.enter)="loadUsers()"
              class="search-input"
            />
            <button class="search-btn" (click)="loadUsers()">🔍</button>
          </div>
        </div>
      </header>
      <div class="admin-content">
        @if (isLoading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading users...</p>
          </div>
        } @else if (users.length === 0) {
          <div class="empty-state">
            <span class="empty-emoji">👥</span>
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
                        <span class="user-name">{{ user.fullName }}</span>
                      </div>
                    </td>
                    <td class="email-cell">{{ user.email }}</td>
                    <td>
                      <span class="role-badge" [class.role-admin]="user.roles.includes('Admin')" [class.role-landlord]="user.roles.includes('Landlord')">
                        {{ user.roles[0] }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class.status-active]="user.isActive" [class.status-restricted]="user.isRestricted">
                        {{ user.isRestricted ? 'Restricted' : 'Active' }}
                      </span>
                    </td>
                    <td class="date-cell">{{ user.createdAtUtc | date:'shortDate' }}</td>
                    <td class="actions-cell">
                      @if (!user.isRestricted) {
                        <button class="action-btn restrict" (click)="restrictUser(user)" title="Restrict User">🔒</button>
                      } @else {
                        <button class="action-btn activate" (click)="activateUser(user)" title="Activate User">✓</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
      font-weight: 600;
      color: #1e293b;
    }
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
  `]
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users: AdminUser[] = [];
  isLoading = true;
  searchQuery = '';

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers(this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded && res.data) {
          this.users = res.data.items || [];
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  restrictUser(user: AdminUser) {
    const reason = prompt('Enter reason for restriction:');
    if (reason) {
      this.adminService.setRestriction(user.id, { isRestricted: true, reason }).subscribe({
        next: () => {
          this.loadUsers();
        }
      });
    }
  }

  activateUser(user: AdminUser) {
    this.adminService.setActive(user.id, true, 'Admin activation').subscribe({
      next: () => {
        this.loadUsers();
      }
    });
  }
}
