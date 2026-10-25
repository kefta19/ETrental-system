import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyInquiry } from '../../../core/models/interaction.model';

@Component({
  selector: 'app-inquiries-inbox',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="inbox-page container">
      <div class="page-header">
        <div>
          <span class="badge badge-green">Ethiopian Rental Inquiries</span>
          <h1 class="page-title">Direct Messages & Inquiries</h1>
          <p class="page-subtitle">Communicate securely between renters and property hosts.</p>
        </div>

        <!-- Role Toggle Tabs -->
        <div class="tabs-bar">
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'sent'" 
            (click)="switchTab('sent')"
          >
            Sent Inquiries ({{ sentInquiries.length }})
          </button>
          @if (isHost) {
            <button 
              class="tab-btn" 
              [class.active]="activeTab === 'received'" 
              (click)="switchTab('received')"
            >
              Received as Host ({{ receivedInquiries.length }})
            </button>
          }
        </div>
      </div>

      @if (isLoading) {
        <div class="loading-state">
          <p>Loading messages...</p>
        </div>
      } @else if (currentList.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>No messages in this folder</h3>
          <p>
            {{ activeTab === 'sent' ? 'You have not sent inquiries on any properties yet.' : 'No prospective renters have contacted your listings yet.' }}
          </p>
          <a routerLink="/properties" class="btn btn-primary">Find Ethiopian Rentals</a>
        </div>
      } @else {
        <!-- Two Column Master-Detail Chat Layout -->
        <div class="inbox-layout">
          <!-- Left: Inquiries List -->
          <div class="threads-list">
            @for (inq of currentList; track inq.id) {
              <div 
                class="thread-card" 
                [class.selected]="selectedInquiry?.id === inq.id"
                [class.unread]="isUnread(inq)"
                (click)="selectInquiry(inq)"
              >
                <div class="thread-meta">
                  <span class="thread-user">
                    {{ activeTab === 'sent' ? (inq.property?.landlordName || 'Host') : inq.renterName }}
                  </span>
                  <span class="thread-date">{{ inq.createdAtUtc | date:'shortDate' }}</span>
                </div>
                <div class="thread-prop-title">
                  🏠 {{ inq.property?.title || 'Listing Inquiry' }}
                </div>
                <div class="thread-preview">
                  {{ inq.landlordReply ? 'Host: ' + inq.landlordReply : inq.initialMessage }}
                </div>
              </div>
            }
          </div>

          <!-- Right: Conversation Thread -->
          <div class="conversation-pane">
            @if (selectedInquiry) {
              <div class="pane-header">
                <div class="pane-title-group">
                  <h3>{{ selectedInquiry.property?.title }}</h3>
                  <div class="pane-sub">
                    <span>📍 {{ selectedInquiry.property?.subCity }}, Addis Ababa</span>
                    <strong>{{ selectedInquiry.property?.rentAmountETB | number }} ETB/mo</strong>
                  </div>
                </div>
                @if (selectedInquiry.property) {
                  <a [routerLink]="['/properties', selectedInquiry.property.id]" class="btn btn-outline btn-sm">
                    View Listing
                  </a>
                }
              </div>

              <!-- Message Bubbles -->
              <div class="messages-container">
                <!-- Renter Message -->
                <div class="message-bubble sender-renter">
                  <div class="bubble-header">
                    <strong>{{ selectedInquiry.renterName }}</strong>
                    <span class="bubble-time">{{ selectedInquiry.createdAtUtc | date:'medium' }}</span>
                  </div>
                  <p class="bubble-text">{{ selectedInquiry.initialMessage }}</p>
                </div>

                <!-- Host Reply -->
                @if (selectedInquiry.landlordReply) {
                  <div class="message-bubble sender-host">
                    <div class="bubble-header">
                      <strong>Host ({{ selectedInquiry.property?.landlordName || 'Landlord' }})</strong>
                      <span class="bubble-time">{{ selectedInquiry.repliedAtUtc | date:'medium' }}</span>
                    </div>
                    <p class="bubble-text">{{ selectedInquiry.landlordReply }}</p>
                  </div>
                } @else {
                  <div class="waiting-box">
                    <span>⏳ Awaiting host response...</span>
                  </div>
                }
              </div>

              <!-- Host Reply Box (Only when host view and no reply yet) -->
              @if (activeTab === 'received') {
                <div class="reply-box">
                  <textarea 
                    [(ngModel)]="replyText" 
                    rows="3" 
                    class="form-control" 
                    placeholder="Write your response to the prospective renter..."
                  ></textarea>
                  <div class="reply-actions">
                    <button 
                      class="btn btn-primary" 
                      [disabled]="isReplying || !replyText.trim()" 
                      (click)="sendReply()"
                    >
                      {{ isReplying ? 'Sending...' : 'Send Reply' }}
                    </button>
                  </div>
                </div>
              }
            } @else {
              <div class="no-selection">
                <p>Select a message thread from the left to view the conversation.</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inbox-page {
      padding: 2.5rem 1.5rem 4rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
    }
    .page-subtitle {
      color: var(--text-muted);
    }
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      background: #e2e8f0;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
    }
    .tab-btn {
      padding: 0.5rem 1.25rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: white;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 5rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    /* Layout */
    .inbox-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      min-height: 550px;
      overflow: hidden;
    }
    .threads-list {
      border-right: 1px solid #e2e8f0;
      overflow-y: auto;
      max-height: 650px;
    }
    .thread-card {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s;
    }
    .thread-card:hover {
      background: #f8fafc;
    }
    .thread-card.selected {
      background: #eff6ff;
      border-left: 4px solid var(--primary);
    }
    .thread-card.unread {
      background: #f0fdf4;
      font-weight: 600;
    }
    .thread-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.85rem;
    }
    .thread-user {
      font-weight: 700;
      color: var(--secondary);
    }
    .thread-date {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .thread-prop-title {
      font-size: 0.85rem;
      color: var(--primary);
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .thread-preview {
      font-size: 0.85rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Conversation Pane */
    .conversation-pane {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #fafafa;
    }
    .pane-title-group h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--secondary);
    }
    .pane-sub {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .messages-container {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .message-bubble {
      max-width: 80%;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .sender-renter {
      align-self: flex-start;
      background: #f1f5f9;
      border-bottom-left-radius: 2px;
    }
    .sender-host {
      align-self: flex-end;
      background: #ecfdf5;
      border-bottom-right-radius: 2px;
    }
    .bubble-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
    }
    .bubble-text {
      color: var(--secondary);
      line-height: 1.5;
    }
    .waiting-box {
      align-self: center;
      padding: 0.5rem 1rem;
      background: #fffbeb;
      color: #b45309;
      border-radius: 9999px;
      font-size: 0.85rem;
    }
    .reply-box {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: white;
    }
    .reply-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .no-selection {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .inbox-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InquiriesInboxComponent implements OnInit {
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);

  sentInquiries: PropertyInquiry[] = [];
  receivedInquiries: PropertyInquiry[] = [];
  selectedInquiry: PropertyInquiry | null = null;

  activeTab: 'sent' | 'received' = 'sent';
  isLoading = true;
  isReplying = false;
  replyText = '';

  get isHost(): boolean {
    return this.authService.isLandlord() || this.authService.isAgency() || this.authService.isAdmin();
  }

  get currentList(): PropertyInquiry[] {
    return this.activeTab === 'sent' ? this.sentInquiries : this.receivedInquiries;
  }

  ngOnInit() {
    this.loadInquiries();
  }

  loadInquiries() {
    this.isLoading = true;
    this.interactionService.getInquiriesSent().subscribe({
      next: (res) => {
        if (res.succeeded && res.data) {
          this.sentInquiries = res.data;
          if (this.activeTab === 'sent' && this.sentInquiries.length > 0) {
            this.selectedInquiry = this.sentInquiries[0];
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    if (this.isHost) {
      this.interactionService.getInquiriesReceived().subscribe({
        next: (res) => {
          if (res.succeeded && res.data) {
            this.receivedInquiries = res.data;
          }
        }
      });
    }
  }

  switchTab(tab: 'sent' | 'received') {
    this.activeTab = tab;
    this.selectedInquiry = this.currentList.length > 0 ? this.currentList[0] : null;
    this.replyText = '';
  }

  selectInquiry(inq: PropertyInquiry) {
    this.selectedInquiry = inq;
    this.replyText = '';
    // Mark as read
    if (this.isUnread(inq)) {
      this.interactionService.markInquiryAsRead(inq.id).subscribe();
    }
  }

  isUnread(inq: PropertyInquiry): boolean {
    if (this.activeTab === 'sent') {
      return !inq.isReadByRenter && !!inq.landlordReply;
    } else {
      return !inq.isReadByLandlord;
    }
  }

  sendReply() {
    const inq = this.selectedInquiry;
    if (!inq || !this.replyText.trim()) return;
    this.isReplying = true;
    this.interactionService.replyInquiry(inq.id, {
      reply: this.replyText.trim()
    }).subscribe({
      next: (res) => {
        this.isReplying = false;
        if (res.succeeded && res.data) {
          inq.landlordReply = res.data.landlordReply;
          inq.repliedAtUtc = res.data.repliedAtUtc;
          this.replyText = '';
        }
      },
      error: () => {
        this.isReplying = false;
      }
    });
  }
}
