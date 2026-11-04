import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { InteractionService } from '../../../core/services/interaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { InquiryMessage, PropertyInquiry } from '../../../core/models/interaction.model';

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
          <button class="tab-btn" [class.active]="activeTab === 'sent'" (click)="switchTab('sent')">
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
      } @else if (loadError) {
        <div class="empty-state" role="alert">
          <h3>Messages could not be loaded</h3>
          <p>{{ loadError }}</p>
          <button type="button" class="btn btn-primary" (click)="loadInquiries()">Try again</button>
        </div>
      } @else if (currentList.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-outlined" aria-hidden="true">chat</span>
          </div>
          <h3>No messages in this folder</h3>
          <p>
            {{
              activeTab === 'sent'
                ? 'You have not sent inquiries on any properties yet.'
                : 'No prospective renters have contacted your listings yet.'
            }}
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
                    {{
                      activeTab === 'sent' ? inq.property?.landlordName || 'Host' : inq.renterName
                    }}
                  </span>
                  <span class="thread-date">{{ inq.createdAtUtc | date: 'shortDate' }}</span>
                </div>
                <div class="thread-prop-title">
                  <span class="material-icons-outlined" aria-hidden="true">home</span>
                  {{ inq.property?.title || 'Listing Inquiry' }}
                </div>
                <div class="thread-preview">
                  {{ lastMessagePreview(inq) }}
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
                    <span
                      ><span class="material-icons-outlined" aria-hidden="true">location_on</span>
                      {{ selectedInquiry.property?.subCity }}, Addis Ababa</span
                    >
                    <strong>{{ selectedInquiry.property?.rentAmountETB | number }} ETB/mo</strong>
                  </div>
                </div>
                @if (selectedInquiry.property) {
                  <a
                    [routerLink]="['/properties', selectedInquiry.property.id]"
                    class="btn btn-outline btn-sm"
                  >
                    View Listing
                  </a>
                }
              </div>

              <!-- Message Bubbles -->
              <div class="messages-container">
                @for (message of conversationMessages; track message.id) {
                  <div
                    class="message-bubble"
                    [class.sender-host]="message.isFromLandlord"
                    [class.sender-renter]="!message.isFromLandlord"
                  >
                    <div class="bubble-header">
                      <strong>{{
                        message.isFromLandlord
                          ? 'Host (' + message.senderName + ')'
                          : message.senderName
                      }}</strong>
                      <span class="bubble-time">{{ message.createdAtUtc | date: 'medium' }}</span>
                    </div>
                    <p class="bubble-text">{{ message.message }}</p>
                  </div>
                }

                @if (waitingForHostResponse) {
                  <div class="waiting-box">
                    <span
                      ><span class="material-icons-outlined" aria-hidden="true"
                        >hourglass_empty</span
                      >
                      Awaiting host response...</span
                    >
                  </div>
                }
              </div>

              @if (activeTab === 'received' || canRenterReply) {
                <form class="reply-box" (ngSubmit)="sendReply()">
                  <label class="reply-label" for="inquiry-reply">
                    {{
                      activeTab === 'received'
                        ? 'Reply to ' + selectedInquiry.renterName
                        : 'Reply to your host'
                    }}
                  </label>
                  <textarea
                    id="inquiry-reply"
                    [(ngModel)]="replyText"
                    name="replyText"
                    rows="3"
                    class="form-control"
                    maxlength="1500"
                    [disabled]="isReplying"
                    [attr.aria-describedby]="replyError ? 'reply-error' : 'reply-help'"
                    [placeholder]="
                      activeTab === 'received'
                        ? 'Write a response to the renter...'
                        : 'Write a response to your host...'
                    "
                    (input)="clearReplyFeedback()"
                  ></textarea>
                  <div class="reply-footer">
                    <span id="reply-help" class="reply-counter"
                      >{{ replyText.length }}/1500 characters</span
                    >
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="
                        isReplying || replyText.trim().length < 2 || replyText.length > 1500
                      "
                    >
                      <span class="material-icons-outlined" aria-hidden="true">{{
                        isReplying ? 'hourglass_top' : 'send'
                      }}</span>
                      {{ isReplying ? 'Sending…' : 'Send message' }}
                    </button>
                  </div>
                  @if (replyError) {
                    <p id="reply-error" class="reply-feedback reply-error" role="alert">
                      {{ replyError }}
                    </p>
                  }
                  @if (replyFeedback) {
                    <p class="reply-feedback reply-success" role="status">{{ replyFeedback }}</p>
                  }
                </form>
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
  styles: [
    `
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
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .loading-state,
      .empty-state {
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
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
      .reply-label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--secondary);
        font-size: 0.9rem;
        font-weight: 700;
      }
      .reply-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-top: 0.65rem;
      }
      .reply-counter {
        color: var(--text-muted);
        font-size: 0.78rem;
      }
      .reply-footer button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .reply-feedback {
        margin: 0.65rem 0 0;
        font-size: 0.85rem;
      }
      .reply-error {
        color: #b91c1c;
      }
      .reply-success {
        color: #047857;
      }
      .reply-box textarea:disabled {
        cursor: wait;
        opacity: 0.7;
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
    `,
  ],
})
export class InquiriesInboxComponent implements OnInit {
  private interactionService = inject(InteractionService);
  private authService = inject(AuthService);
  private changeDetector = inject(ChangeDetectorRef);

  sentInquiries: PropertyInquiry[] = [];
  receivedInquiries: PropertyInquiry[] = [];
  selectedInquiry: PropertyInquiry | null = null;

  activeTab: 'sent' | 'received' = 'sent';
  isLoading = true;
  loadError = '';
  isReplying = false;
  replyText = '';
  replyError = '';
  replyFeedback = '';

  readonly replyMaxLength = 1500;

  get isHost(): boolean {
    return this.authService.isLandlord() || this.authService.isAdmin();
  }

  get currentList(): PropertyInquiry[] {
    return this.activeTab === 'sent' ? this.sentInquiries : this.receivedInquiries;
  }

  get conversationMessages(): InquiryMessage[] {
    const inquiry = this.selectedInquiry;
    if (!inquiry) return [];
    if (inquiry.messages?.length) return inquiry.messages;

    const messages: InquiryMessage[] = [
      {
        id: `${inquiry.id}:initial`,
        senderId: inquiry.renterId,
        senderName: inquiry.renterName,
        message: inquiry.initialMessage,
        isFromLandlord: false,
        createdAtUtc: inquiry.createdAtUtc,
      },
    ];
    if (inquiry.landlordReply) {
      messages.push({
        id: `${inquiry.id}:legacy-reply`,
        senderId: '',
        senderName: inquiry.property?.landlordName || 'Landlord',
        message: inquiry.landlordReply,
        isFromLandlord: true,
        createdAtUtc: inquiry.repliedAtUtc || inquiry.createdAtUtc,
      });
    }
    return messages;
  }

  get canRenterReply(): boolean {
    return (
      this.activeTab === 'sent' &&
      this.conversationMessages.some((message) => message.isFromLandlord)
    );
  }

  get waitingForHostResponse(): boolean {
    const lastMessage = this.conversationMessages.at(-1);
    return !!lastMessage && !lastMessage.isFromLandlord;
  }

  ngOnInit() {
    if (this.isHost) {
      this.activeTab = 'received';
    }
    this.loadInquiries();
  }

  loadInquiries() {
    this.isLoading = true;
    this.loadError = '';
    forkJoin({
      sent: this.interactionService.getInquiriesSent(),
      received: this.isHost ? this.interactionService.getInquiriesReceived() : of(null),
    }).subscribe({
      next: ({ sent, received }) => {
        this.isLoading = false;
        if (
          !sent.succeeded ||
          !sent.data ||
          (this.isHost && (!received?.succeeded || !received.data))
        ) {
          this.loadError =
            [...(sent.errors ?? []), ...(received?.errors ?? [])].join(' ') ||
            'Messages could not be loaded.';
          this.changeDetector.markForCheck();
          return;
        }

        this.sentInquiries = sent.data;
        this.receivedInquiries = received?.data ?? [];
        this.selectedInquiry = this.currentList[0] ?? null;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.loadError =
          error.error?.errors?.[0] || 'We could not reach the server. Please try again.';
        this.changeDetector.markForCheck();
      },
    });
  }

  switchTab(tab: 'sent' | 'received') {
    this.activeTab = tab;
    this.selectedInquiry = this.currentList.length > 0 ? this.currentList[0] : null;
    this.replyText = '';
    this.clearReplyFeedback();
  }

  selectInquiry(inq: PropertyInquiry) {
    this.selectedInquiry = inq;
    this.replyText = '';
    this.clearReplyFeedback();
    // Mark as read
    if (this.isUnread(inq)) {
      this.interactionService.markInquiryAsRead(inq.id).subscribe();
    }
  }

  lastMessagePreview(inquiry: PropertyInquiry): string {
    const lastMessage = inquiry.messages?.at(-1);
    if (lastMessage) {
      const author = lastMessage.isFromLandlord ? 'Host: ' : '';
      return author + lastMessage.message;
    }
    return inquiry.landlordReply ? `Host: ${inquiry.landlordReply}` : inquiry.initialMessage;
  }

  isUnread(inq: PropertyInquiry): boolean {
    if (this.activeTab === 'sent') {
      return !inq.isReadByRenter && !!inq.landlordReply;
    } else {
      return !inq.isReadByLandlord;
    }
  }

  clearReplyFeedback(): void {
    this.replyError = '';
    this.replyFeedback = '';
  }

  private getReplyErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'The messaging API is outdated. Restart the backend and try again.';
    }

    return (
      error.error?.errors?.[0] ||
      error.error?.detail ||
      error.error?.title ||
      'Your reply could not be sent. Please try again.'
    );
  }

  sendReply(): void {
    const inq = this.selectedInquiry;
    const reply = this.replyText.trim();
    if (!inq || this.isReplying) return;
    if (this.activeTab === 'received' && !this.isHost) return;
    if (this.activeTab === 'sent' && (this.isHost || !this.canRenterReply)) return;
    if (reply.length < 2 || reply.length > this.replyMaxLength) {
      this.replyError = `Your reply must be between 2 and ${this.replyMaxLength} characters.`;
      this.replyFeedback = '';
      return;
    }

    this.isReplying = true;
    this.clearReplyFeedback();
    this.interactionService
      .sendInquiryMessage(inq.id, {
        reply,
      })
      .subscribe({
        next: (res) => {
          this.isReplying = false;
          if (res.succeeded && res.data) {
            const updatedInquiry = res.data;
            this.selectedInquiry = updatedInquiry;
            this.receivedInquiries = this.receivedInquiries.map((item) =>
              item.id === updatedInquiry.id ? updatedInquiry : item,
            );
            this.sentInquiries = this.sentInquiries.map((item) =>
              item.id === updatedInquiry.id ? updatedInquiry : item,
            );
            this.replyText = '';
            this.replyFeedback = 'Your message was sent.';
          } else {
            this.replyError = res.errors?.[0] || 'Your reply could not be sent. Please try again.';
          }
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          this.isReplying = false;
          this.replyError = this.getReplyErrorMessage(error);
          this.changeDetector.markForCheck();
        },
      });
  }
}
