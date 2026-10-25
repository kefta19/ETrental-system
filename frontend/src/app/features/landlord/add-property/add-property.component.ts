import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyType, FurnishingStatus } from '../../../core/models/property.model';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="wizard-container container">
      <!-- Wizard Step Indicator -->
      <div class="wizard-header">
        <h1>List Your Rental Property in Ethiopia</h1>
        <p>Complete the 6 guided steps to publish your property listing on ETrental.</p>
        
        <div class="step-tracker">
          <div class="tracker-step" [class.active]="currentStep === 1" [class.done]="currentStep > 1">
            <span class="step-num">1</span>
            <span class="step-txt">Basic Info</span>
          </div>
          <div class="tracker-line"></div>
          <div class="tracker-step" [class.active]="currentStep === 2" [class.done]="currentStep > 2">
            <span class="step-num">2</span>
            <span class="step-txt">Location</span>
          </div>
          <div class="tracker-line"></div>
          <div class="tracker-step" [class.active]="currentStep === 3" [class.done]="currentStep > 3">
            <span class="step-num">3</span>
            <span class="step-txt">Pricing (ETB)</span>
          </div>
          <div class="tracker-line"></div>
          <div class="tracker-step" [class.active]="currentStep === 4" [class.done]="currentStep > 4">
            <span class="step-num">4</span>
            <span class="step-txt">Amenities</span>
          </div>
          <div class="tracker-line"></div>
          <div class="tracker-step" [class.active]="currentStep === 5" [class.done]="currentStep > 5">
            <span class="step-num">5</span>
            <span class="step-txt">Photos</span>
          </div>
          <div class="tracker-line"></div>
          <div class="tracker-step" [class.active]="currentStep === 6" [class.done]="currentStep > 6">
            <span class="step-num">6</span>
            <span class="step-txt">Submit</span>
          </div>
        </div>
      </div>

      @if (errorMessage) {
        <div class="alert alert-danger">{{ errorMessage }}</div>
      }

      <div class="wizard-card">
        <form [formGroup]="propertyForm">
          <!-- STEP 1: Basic Info & Property Type -->
          @if (currentStep === 1) {
            <div class="step-pane">
              <h3>Step 1: Basic Property Information</h3>
              
              <div class="form-group">
                <label class="form-label">Listing Headline / Title</label>
                <input 
                  type="text" 
                  formControlName="title" 
                  class="form-control" 
                  placeholder="e.g. Modern 3-Bedroom Furnished Apartment in Bole"
                />
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Property Type</label>
                  <select formControlName="propertyType" class="form-control">
                    <option [ngValue]="0">Apartment</option>
                    <option [ngValue]="1">Condominium (40/60, 20/80)</option>
                    <option [ngValue]="2">Villa</option>
                    <option [ngValue]="3">G+1 Family Home</option>
                    <option [ngValue]="4">Studio / Single Unit</option>
                    <option [ngValue]="5">Service Quarter (Ashker Bet)</option>
                    <option [ngValue]="6">Commercial Space</option>
                  </select>
                </div>

                <div class="form-group col">
                  <label class="form-label">Furnishing Status</label>
                  <select formControlName="furnishing" class="form-control">
                    <option [ngValue]="0">Unfurnished</option>
                    <option [ngValue]="1">Semi-Furnished</option>
                    <option [ngValue]="2">Fully Furnished</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Bedrooms</label>
                  <input type="number" formControlName="bedrooms" class="form-control" min="0" />
                </div>
                <div class="form-group col">
                  <label class="form-label">Bathrooms</label>
                  <input type="number" formControlName="bathrooms" class="form-control" min="1" />
                </div>
                <div class="form-group col">
                  <label class="form-label">Area (Square Meters)</label>
                  <input type="number" formControlName="areaSquareMeters" class="form-control" placeholder="120" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Full Description</label>
                <textarea 
                  formControlName="description" 
                  class="form-control" 
                  rows="5"
                  placeholder="Describe your property, neighborhood advantages, and restrictions..."
                ></textarea>
              </div>
            </div>
          }

          <!-- STEP 2: Location -->
          @if (currentStep === 2) {
            <div class="step-pane">
              <h3>Step 2: Ethiopian Location Details</h3>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Region / City</label>
                  <input type="text" formControlName="city" class="form-control" placeholder="Addis Ababa" />
                </div>
                <div class="form-group col">
                  <label class="form-label">Sub-City (Kifle Ketema)</label>
                  <select formControlName="subCity" class="form-control">
                    <option value="Bole">Bole</option>
                    <option value="Yeka">Yeka</option>
                    <option value="Kirkos">Kirkos</option>
                    <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                    <option value="Arada">Arada</option>
                    <option value="Gulele">Gulele</option>
                    <option value="Kolfe Keranio">Kolfe Keranio</option>
                    <option value="Lideta">Lideta</option>
                    <option value="Akaky Kaliti">Akaky Kaliti</option>
                    <option value="Addis Ketema">Addis Ketema</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Neighborhood / Sefer</label>
                  <input type="text" formControlName="neighborhood" class="form-control" placeholder="e.g. CMC, Kazanchis, Old Airport, Sarbet" />
                </div>
                <div class="form-group col">
                  <label class="form-label">Prominent Landmark</label>
                  <input type="text" formControlName="landmark" class="form-control" placeholder="e.g. Behind Edna Mall, Near Michael Church" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Street Address / House No. (Optional)</label>
                <input type="text" formControlName="streetAddress" class="form-control" placeholder="Optional for public display" />
              </div>
            </div>
          }

          <!-- STEP 3: Pricing in ETB -->
          @if (currentStep === 3) {
            <div class="step-pane">
              <h3>Step 3: Rental Rates & Advance Payment (ETB)</h3>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Monthly Rent in Ethiopian Birr (ETB)</label>
                  <input type="number" formControlName="rentAmountETB" class="form-control" placeholder="e.g. 45000" />
                </div>
                <div class="form-group col">
                  <label class="form-label">Security Deposit (ETB)</label>
                  <input type="number" formControlName="depositAmountETB" class="form-control" placeholder="e.g. 45000" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label">Advance Rent Required (Months)</label>
                  <select formControlName="advanceMonthsRequired" class="form-control">
                    <option [ngValue]="1">1 Month</option>
                    <option [ngValue]="2">2 Months</option>
                    <option [ngValue]="3">3 Months (Standard)</option>
                    <option [ngValue]="6">6 Months</option>
                    <option [ngValue]="12">12 Months (1 Year)</option>
                  </select>
                </div>
                <div class="form-group col">
                  <label class="form-label">Minimum Lease Term (Months)</label>
                  <select formControlName="minimumLeaseMonths" class="form-control">
                    <option [ngValue]="6">6 Months</option>
                    <option [ngValue]="12">12 Months (1 Year)</option>
                    <option [ngValue]="24">24 Months</option>
                  </select>
                </div>
              </div>

              <div class="checkbox-group">
                <label class="check-label">
                  <input type="checkbox" formControlName="waterBillIncluded" />
                  <span>Water bill included in monthly rent</span>
                </label>
                <label class="check-label">
                  <input type="checkbox" formControlName="electricityBillIncluded" />
                  <span>Electricity bill included in monthly rent</span>
                </label>
              </div>
            </div>
          }

          <!-- STEP 4: Amenities -->
          @if (currentStep === 4) {
            <div class="step-pane">
              <h3>Step 4: Amenities & Infrastructure</h3>
              <p class="step-sub">Select the available features in your rental unit.</p>

              <div class="amenities-selection-grid">
                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasWaterTank" />
                  <div class="card-inner">
                    <span class="icon">💧</span>
                    <strong>Reserve Water Tank</strong>
                    <small>Rotto with booster pump</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasGenerator" />
                  <div class="card-inner">
                    <span class="icon">⚡</span>
                    <strong>Backup Generator</strong>
                    <small>Automated standby power</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasSecurityGuard" />
                  <div class="card-inner">
                    <span class="icon">🛡️</span>
                    <strong>Security Guard</strong>
                    <small>Dedicated gatekeeper / compound guard</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasParking" />
                  <div class="card-inner">
                    <span class="icon">🚗</span>
                    <strong>Compound Parking</strong>
                    <small>Secure vehicle parking space</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasElevator" />
                  <div class="card-inner">
                    <span class="icon">🛗</span>
                    <strong>Passenger Elevator</strong>
                    <small>Working lift with backup power</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasWifi" />
                  <div class="card-inner">
                    <span class="icon">📶</span>
                    <strong>Broadband Wi-Fi</strong>
                    <small>High speed fiber/broadband</small>
                  </div>
                </label>

                <label class="amenity-card-toggle">
                  <input type="checkbox" formControlName="hasBalcony" />
                  <div class="card-inner">
                    <span class="icon">🌅</span>
                    <strong>Balcony / Veranda</strong>
                    <small>Outdoor terrace with view</small>
                  </div>
                </label>
              </div>
            </div>
          }

          <!-- STEP 5: Photos -->
          @if (currentStep === 5) {
            <div class="step-pane">
              <h3>Step 5: High-Quality Photographs</h3>
              <p class="step-sub">Upload clear photos of living spaces, bedrooms, kitchen, and exterior.</p>

              <div class="upload-dropzone">
                <input 
                  type="file" 
                  #fileInput 
                  (change)="onFileSelected($event)" 
                  accept="image/png, image/jpeg, image/webp" 
                  class="hidden-file-input"
                />
                <button type="button" class="btn btn-outline" (click)="fileInput.click()" [disabled]="isUploading">
                  {{ isUploading ? 'Uploading Image...' : '+ Upload Photo' }}
                </button>
                <small class="upload-hint">JPEG, PNG, or WebP up to 5MB.</small>
              </div>

              <!-- Uploaded Photos Grid -->
              <div class="photos-preview-grid">
                @for (url of imageUrls; track $index) {
                  <div class="photo-thumb-card">
                    <img [src]="url" alt="Uploaded photo" />
                    <button type="button" class="remove-btn" (click)="removeImage($index)">✕</button>
                    @if ($index === 0) {
                      <span class="primary-badge">Cover Photo</span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- STEP 6: Review & Finalize -->
          @if (currentStep === 6) {
            <div class="step-pane">
              <h3>Step 6: Review and Submit</h3>
              <p class="step-sub">Please verify your listing information before submitting for admin review.</p>

              <div class="review-box">
                <h4>{{ propertyForm.get('title')?.value }}</h4>
                <p>📍 {{ propertyForm.get('neighborhood')?.value }}, {{ propertyForm.get('subCity')?.value }}, {{ propertyForm.get('city')?.value }}</p>
                <div class="review-price">
                  {{ propertyForm.get('rentAmountETB')?.value | number }} ETB / month
                  <span>({{ propertyForm.get('advanceMonthsRequired')?.value }} Months Advance)</span>
                </div>
                <div class="review-specs">
                  <span>{{ propertyForm.get('bedrooms')?.value }} Bedrooms</span> • 
                  <span>{{ propertyForm.get('bathrooms')?.value }} Bathrooms</span> • 
                  <span>{{ propertyForm.get('areaSquareMeters')?.value || '—' }} m²</span>
                </div>
                <p class="photos-count-note">📸 {{ imageUrls.length }} Photos Attached</p>
              </div>
            </div>
          }

          <!-- Navigation Footer Buttons -->
          <div class="wizard-nav-buttons">
            @if (currentStep > 1) {
              <button type="button" class="btn btn-outline" (click)="prevStep()">
                ‹ Previous
              </button>
            }

            <div class="right-buttons">
              @if (currentStep < 6) {
                <button type="button" class="btn btn-primary" (click)="nextStep()">
                  Next Step ›
                </button>
              } @else {
                <button type="button" class="btn btn-outline" (click)="submit(false)" [disabled]="isSubmitting">
                  Save as Draft
                </button>
                <button type="button" class="btn btn-primary" (click)="submit(true)" [disabled]="isSubmitting">
                  {{ isSubmitting ? 'Submitting...' : 'Submit for Review' }}
                </button>
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      padding: 3rem 1.5rem 5rem;
      max-width: 860px;
    }
    .wizard-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .wizard-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .wizard-header p {
      color: var(--text-muted);
      font-size: 1rem;
    }
    .step-tracker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2rem;
    }
    .tracker-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .tracker-step.active .step-num {
      background: var(--primary);
      color: #ffffff;
    }
    .tracker-step.done .step-num {
      background: #10b981;
      color: #ffffff;
    }
    .step-txt {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .tracker-step.active .step-txt {
      color: var(--primary);
    }
    .tracker-line {
      width: 40px;
      height: 2px;
      background: #e2e8f0;
      margin-bottom: 1.25rem;
    }
    .wizard-card {
      background: #ffffff;
      padding: 2.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    .step-pane h3 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }
    .step-sub {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .check-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--secondary);
      cursor: pointer;
    }
    .check-label input {
      accent-color: var(--primary);
      width: 16px;
      height: 16px;
    }
    .amenities-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .amenity-card-toggle {
      cursor: pointer;
    }
    .amenity-card-toggle input {
      display: none;
    }
    .card-inner {
      border: 2px solid var(--border-color);
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transition: all 0.15s;
    }
    .card-inner .icon {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }
    .card-inner strong {
      font-size: 0.9rem;
      color: var(--secondary);
    }
    .card-inner small {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .amenity-card-toggle input:checked + .card-inner {
      border-color: var(--primary);
      background: var(--primary-light);
    }
    .upload-dropzone {
      border: 2px dashed #cbd5e1;
      padding: 2.5rem;
      text-align: center;
      border-radius: var(--radius-md);
      background: #f8fafc;
      margin-bottom: 1.5rem;
    }
    .hidden-file-input {
      display: none;
    }
    .upload-hint {
      display: block;
      margin-top: 0.5rem;
      color: var(--text-muted);
    }
    .photos-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 1rem;
    }
    .photo-thumb-card {
      position: relative;
      height: 100px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .photo-thumb-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.75rem;
    }
    .primary-badge {
      position: absolute;
      bottom: 4px;
      left: 4px;
      background: var(--primary);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .review-box {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .review-box h4 {
      font-size: 1.2rem;
      font-weight: 800;
      margin-bottom: 0.35rem;
    }
    .review-price {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      margin: 0.75rem 0;
    }
    .review-price span {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .wizard-nav-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }
    .right-buttons {
      display: flex;
      gap: 0.75rem;
      margin-left: auto;
    }
  `]
})
export class AddPropertyComponent {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  currentStep = 1;
  isUploading = false;
  isSubmitting = false;
  errorMessage = '';
  imageUrls: string[] = [];

  propertyForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(10)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    propertyType: [0, Validators.required],
    furnishing: [0, Validators.required],
    bedrooms: [2, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(1)]],
    areaSquareMeters: [100],
    
    // Ethiopian Location
    region: ['Addis Ababa', Validators.required],
    city: ['Addis Ababa', Validators.required],
    subCity: ['Bole', Validators.required],
    neighborhood: ['', Validators.required],
    landmark: [''],
    streetAddress: [''],

    // Pricing (ETB)
    rentAmountETB: [35000, [Validators.required, Validators.min(100)]],
    depositAmountETB: [35000, [Validators.required, Validators.min(0)]],
    advanceMonthsRequired: [3, Validators.required],
    minimumLeaseMonths: [6, Validators.required],
    waterBillIncluded: [false],
    electricityBillIncluded: [false],

    // Amenities
    hasWaterTank: [true],
    hasGenerator: [false],
    hasSecurityGuard: [true],
    hasParking: [true],
    hasElevator: [false],
    hasWifi: [false],
    hasBalcony: [false]
  });

  nextStep() {
    if (this.currentStep < 6) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.propertyService.uploadImage(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.succeeded && res.data) {
          this.imageUrls.push(`http://localhost:5000${res.data.url}`);
        }
      },
      error: (err) => {
        this.isUploading = false;
        alert(err.error?.errors?.[0] || 'Image upload failed.');
      }
    });
  }

  removeImage(index: number) {
    this.imageUrls.splice(index, 1);
  }

  submit(forReview: boolean) {
    if (this.propertyForm.invalid) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: any = {
      ...this.propertyForm.value,
      availableFromDate: new Date().toISOString(),
      imageUrls: this.imageUrls.length > 0 
        ? this.imageUrls 
        : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'],
      submitForReview: forReview
    };

    this.propertyService.create(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/landlord/my-properties']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.errors?.[0] || 'Failed to submit property listing.';
      }
    });
  }
}
