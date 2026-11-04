import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';
import { resolveImageUrl } from '../../../core/config/api.config';
import { CreatePropertyDto, FurnishingStatus, PropertyType } from '../../../core/models/property.model';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.css'],
})
export class AddPropertyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  currentStep = 1;
  isLoadingContact = true;
  isUploading = false;
  isSubmitting = false;
  errorMessage = '';
  imageUrls: string[] = [];
  ownerEmail = '';
  paymentMethod = '';
  paymentReference = '';
  paymentTransactionUrl = '';
  readonly listingFeeETB = 1000;
  readonly maxPhotos = 15;

  readonly propertyForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    propertyType: [0, Validators.required],
    furnishing: [0, Validators.required],
    bedrooms: [2, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(1)]],
    areaSquareMeters: [100, [Validators.required, Validators.min(1)]],
    region: ['Addis Ababa', Validators.required],
    city: ['Addis Ababa', Validators.required],
    subCity: ['Bole', Validators.required],
    neighborhood: ['', Validators.required],
    landmark: [''],
    streetAddress: [''],
    videoUrl: ['', [Validators.maxLength(500), Validators.pattern(/^https:\/\/(?:(?:www|m|vm)\.)?tiktok\.com\/\S+$/i)]],
    rentAmountETB: [35000, [Validators.required, Validators.min(100)]],
    depositAmountETB: [35000, [Validators.required, Validators.min(0)]],
    advanceMonthsRequired: [3, [Validators.required, Validators.min(1), Validators.max(24)]],
    minimumLeaseMonths: [6, [Validators.required, Validators.min(1), Validators.max(60)]],
    availableFromDate: [new Date().toISOString().slice(0, 10), Validators.required],
    waterBillIncluded: [false],
    electricityBillIncluded: [false],
    hasWaterTank: [true],
    hasGenerator: [false],
    hasSecurityGuard: [true],
    hasParking: [true],
    hasElevator: [false],
    hasWifi: [false],
    hasBalcony: [false],
  });

  readonly contactForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+()\d\s-]{7,20}$/)]],
  });

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.isLoadingContact = false;
        if (!response.succeeded || !response.data) {
          this.errorMessage = response.errors?.[0] || 'We could not load your account contact details.';
          this.changeDetector.markForCheck();
          return;
        }

        const profile = response.data;
        this.ownerEmail = profile.email;
        this.contactForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber ?? '',
        });
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.isLoadingContact = false;
        this.errorMessage = error.error?.errors?.[0] || 'We could not load your account contact details.';
        this.changeDetector.markForCheck();
      },
    });
  }

  nextStep(): void {
    this.errorMessage = '';
    if (this.currentStep === 1) {
      if (this.propertyForm.invalid) {
        this.propertyForm.markAllAsTouched();
        this.errorMessage = 'Complete the required property details before continuing.';
        return;
      }
      if (this.imageUrls.length === 0) {
        this.errorMessage = 'Upload at least one property photo before continuing.';
        return;
      }
    } else if (this.currentStep === 2) {
      if (this.isLoadingContact) return;
      if (this.contactForm.invalid) {
        this.contactForm.markAllAsTouched();
        this.errorMessage = 'Enter a valid owner name and phone number before continuing.';
        return;
      }
    }
    this.currentStep = Math.min(this.currentStep + 1, 3);
  }

  prevStep(): void {
    this.errorMessage = '';
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    const remainingSlots = this.maxPhotos - this.imageUrls.length;
    if (remainingSlots <= 0) {
      this.errorMessage = `A listing can have up to ${this.maxPhotos} photos. Remove a photo before adding another.`;
      return;
    }

    const validFiles: File[] = [];
    const warnings: string[] = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        warnings.push(`${file.name}: choose a JPEG, PNG, or WebP photo smaller than 5 MB.`);
      } else if (validFiles.length >= remainingSlots) {
        warnings.push(`Only ${this.maxPhotos} photos are allowed per listing.`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      this.errorMessage = warnings.join(' ');
      return;
    }

    this.isUploading = true;
    forkJoin(
      validFiles.map((file) =>
        this.propertyService.uploadImage(file).pipe(
          catchError((error) =>
            of({
              succeeded: false,
              data: null,
              errors: [error.error?.errors?.[0] || 'Image upload failed. Please try again.'],
            }),
          ),
        ),
      ),
    ).subscribe({
      next: (responses) => {
        this.isUploading = false;
        responses.forEach((response, index) => {
          if (response.succeeded && response.data?.url) {
            this.imageUrls.push(resolveImageUrl(response.data.url));
          } else {
            warnings.push(
              `${validFiles[index].name}: ${response.errors?.[0] || 'Image upload failed. Please try again.'}`,
            );
          }
        });
        this.errorMessage = warnings.join(' ');
      },
      error: (error) => {
        this.isUploading = false;
        this.errorMessage = error.error?.errors?.[0] || 'Image upload failed. Please try again.';
      },
    });
  }

  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  submitListing(): void {
    this.errorMessage = '';
    if (this.propertyForm.invalid || this.contactForm.invalid || this.imageUrls.length === 0) {
      this.currentStep = this.propertyForm.invalid || this.imageUrls.length === 0 ? 1 : 2;
      this.propertyForm.markAllAsTouched();
      this.contactForm.markAllAsTouched();
      this.errorMessage = 'Complete each step and upload at least one photo before submitting.';
      return;
    }
    if (!['Telebirr', 'CBE'].includes(this.paymentMethod) || !this.paymentReference.trim()) {
      this.errorMessage = 'Choose a payment method and enter the transaction reference.';
      return;
    }
    if (!this.paymentTransactionUrl.trim() || !this.isValidTransactionUrl(this.paymentTransactionUrl)) {
      this.errorMessage = 'Enter a valid HTTPS transaction link from your payment provider.';
      return;
    }
    if (this.isSubmitting || this.isUploading) return;

    this.isSubmitting = true;
    this.profileService.updateProfile({
      ...this.contactForm.getRawValue(),
    }).subscribe({
      next: (profileResponse) => {
        if (!profileResponse.succeeded || !profileResponse.data) {
          this.isSubmitting = false;
          this.errorMessage = profileResponse.errors?.[0] || 'We could not save your contact details.';
          return;
        }
        this.authService.syncProfile({
          firstName: profileResponse.data.firstName,
          lastName: profileResponse.data.lastName,
          email: profileResponse.data.email,
          phoneNumber: profileResponse.data.phoneNumber ?? '',
        });
        this.createProperty();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.errors?.[0] || 'We could not save your contact details.';
      },
    });
  }

  private createProperty(): void {
    const values = this.propertyForm.getRawValue();
    const payload: CreatePropertyDto = {
      ...values,
      propertyType: values.propertyType as PropertyType,
      furnishing: values.furnishing as FurnishingStatus,
      availableFromDate: new Date(values.availableFromDate).toISOString(),
      imageUrls: [...this.imageUrls],
      videoUrl: values.videoUrl.trim() || null,
      submitForReview: true,
      listingFeeProvider: this.paymentMethod,
      listingFeeReference: this.paymentReference.trim(),
      listingFeeTransactionUrl: this.paymentTransactionUrl.trim() || null,
    };

    this.propertyService.create(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (!response.succeeded) {
          this.errorMessage = response.errors?.[0] || 'We could not submit the property for review.';
          return;
        }
        this.router.navigate(['/landlord/payments'], {
          queryParams: { newListingId: response.data?.id, success: 'true' }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.errors?.[0] || 'We could not submit the property for review.';
      },
    });
  }

  private isValidTransactionUrl(value: string): boolean {
    if (!value.trim()) return false;
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch {
      return false;
    }
  }
}
