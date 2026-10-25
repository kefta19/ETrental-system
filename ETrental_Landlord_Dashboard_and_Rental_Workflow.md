# ETrental: Landlord Dashboard and Rental Workflow

**Project Name:** ETrental — Online Rental Property Marketplace  
**Target Market:** Ethiopia (Prices in Ethiopian Birr — ETB)  
**Reference Website:** Rentola (`https://rentola.com.br/en/dashboard/my-properties`)  
**Document Reference:** `ETrental_Landlord_Dashboard_and_Rental_Workflow.md`  
**Version:** 1.0.0-PROPOSAL  
**Author:** Pair Programming Agentic Assistant  
**Date:** October 2026

---

## 1. Landlord Dashboard Architecture

The Landlord Dashboard provides individual property owners with an intuitive, self-service operations portal. It allows landlords to list properties, manage availability, process inquiries, schedule viewings, and close rental agreements.

```
+------------------------------------------------------------------------------------------+
|  [ ETrental Landlord ]       [+ Add New Property]    [Notifications (3)]    [Landlord Profile] |
+------------------------------------------------------------------------------------------+
|  SIDEBAR NAV       |  LANDLORD OVERVIEW                                                  |
|  [ Dashboard ]     |  +----------------+  +----------------+  +----------------+         |
|  [ My Properties ] |  | Total Listings |  | Active Renters |  | New Inquiries  |         |
|  [ Inquiries (3) ] |  |       5        |  |   2 Published  |  |    3 Pending   |         |
|  [ Viewings (2) ]  |  +----------------+  +----------------+  +----------------+         |
|  [ Applications ]  |                                                                     |
|  [ Tenancy Logs ]  |  QUICK ACTION BANNER                                                |
|  [ Profile/Payout] |  Listing 'Bole Medhanealem Villa' has 1 new application awaiting     |
|  [ Support ]       |  your review.                                      [Review Now ->]  |
|                    +---------------------------------------------------------------------+
|                    |  RECENT PROPERTIES                                                  |
|                    |  • Bole Medhanealem Villa  | Status: PUBLISHED   | Rent: 75,000 ETB |
|                    |  • CMC 2-Bed Condominium   | Status: PENDING_REV | Rent: 24,000 ETB |
|                    |  • Sarbet Studio           | Status: RENTED      | Rent: 14,000 ETB |
+------------------------------------------------------------------------------------------+
```

### 1.1 Dashboard Navigation Structure

- **Dashboard Overview:** Key KPIs, summary counts, and urgent action notifications.
- **My Properties:** Complete listing portfolio with tabbed filtering by status (`All`, `Published`, `Under Review`, `Drafts`, `Rented`, `Archived`).
- **Add Property:** Modern 6-step property publication wizard.
- **Tenant Inquiries:** Message center for responding directly to renter queries.
- **Viewing Appointments:** Calendar and appointment list with actions to confirm, reschedule, or cancel.
- **Rental Applications:** Applicant screening and lease award interface.
- **Tenancy Records:** Historical record of completed rentals and lease terms.

---

## 2. "Add Property" Multi-Step Wizard Specification

To ensure high-quality listings compliant with Ethiopian rental realities, the property creation workflow is structured as a guided, 6-step reactive form:

```
Step 1: Basic Info  ──>  Step 2: Location  ──>  Step 3: Pricing & Terms
        │
Step 4: Amenities   ──>  Step 5: Photos    ──>  Step 6: Review & Submit
```

### 2.1 Step 1: Basic Information & Property Type

- **Property Title:** Descriptive headline (e.g., "Luxury 3-Bedroom Furnished Apartment in Bole Medhanealem"). Min 10, max 100 characters.
- **Property Type Selection:**
  - `Apartment` (Standard multi-unit residential building)
  - `Condominium` (Commonly in Addis Ababa: 40/60, 20/80 condominium developments)
  - `Villa` (Detached private residential house with independent compound)
  - `GPlusOne` (Multi-floor modern family home)
  - `Studio` (Single open-plan living unit)
  - `ServiceQuarter` (_Wetet Bet / Ashker Bet_ auxiliary rental unit)
  - `Commercial` (Office or retail space)
- **Furnishing Status:** `Unfurnished`, `Semi-Furnished`, `Fully Furnished`.
- **Property Size:** Total floor area in square meters ($m^2$).
- **Comprehensive Description:** Rich text detailing property features, neighborhood advantages, and restrictions (e.g., pet policies).

### 2.2 Step 2: Location & Neighborhood Details

- **Region / Chartered City:** Dropdown (Addis Ababa, Oromia, Sidama, Amhara, Dire Dawa, etc.).
- **City / Sub-City:** Filtered based on Region (e.g., Bole, Kirkos, Yeka, Nifas Silk-Lafto, Hawassa, Bahir Dar).
- **Neighborhood / Sefer / Landmark:** Specific vicinity (e.g., "Atlas Hotel area", "CMC near Michael Church").
- **Street Address / House Number:** Optional for public display; retained for admin verification.
- **Map Coordinates:** Lat/Lng marker for interactive map rendering.

### 2.3 Step 3: Ethiopian Pricing & Tenancy Terms

- **Monthly Rent (ETB):** Required decimal figure (validated against negative/zero values).
- **Advance Rent Required (Months):** Standard Ethiopian practice (e.g., 1, 2, 3, 6, or 12 months).
- **Security Deposit (ETB):** Refundable security deposit (often 1 or 2 months rent).
- **Minimum Lease Duration:** Months (typically 6 or 12 months).
- **Available From Date:** Earliest tenant move-in date.
- **Utilities Included Checkbox:**
  - Water bill included
  - Electricity bill included
  - Generator fuel share included
  - Security guard fee included

### 2.4 Step 4: Amenities & Infrastructure

High-value Ethiopian amenities are selectable via visual toggle cards:

- **Water Infrastructure:** Reserve Water Tank (_Rotto_), Deep Well (_Borehole_), Hot Water Boiler.
- **Electrical Reliability:** Backup Generator (_Diesel Generator_), Solar Inverter, 3-Phase Power.
- **Security & Compound:** Dedicated Guard House, Compound Perimeter Fence, CCTV, Electric Fence.
- **Building Convenience:** Elevator, Private Balcony, Dedicated Compound Parking, Modern Kitchen (_Ferji Bet_), Traditional Kitchen (_Wetet Bet_), Washing Machine Hookup, Wi-Fi.

### 2.5 Step 5: High-Resolution Photo Uploads

- **Upload Constraints:** Minimum 3 photos, maximum 20 photos.
- **Accepted Formats:** JPEG, PNG, WebP (max 5MB per file).
- **Security Validation:** Server-side magic-byte inspection prevents executable script uploads.
- **Primary Cover Selector:** Landlord drags or clicks to designate the hero thumbnail photo.
- **Image Cropper & Preview:** Client-side preview with image aspect ratio optimization.

### 2.6 Step 6: Review, Draft Save & Submission

- **Summary Preview:** Landlord inspects the full Rentola-style property preview.
- **Save as Draft:** Persists the property with status `DRAFT` for later editing.
- **Submit for Review:** Transitions property to `PENDING_REVIEW` for admin approval. Displays confirmation modal explaining the platform moderation policy (average 2–12 hour review window).

---

## 3. Listing Lifecycle & State Machine

````mermaid
stateDiagram-v2
    [*] --> DRAFT: Landlord creates draft
    DRAFT --> PENDING_REVIEW: Landlord submits listing
    PENDING_REVIEW --> APPROVED: Admin approves listing
    PENDING_REVIEW --> REJECTED: Admin rejects with reason
    REJECTED --> PENDING_REVIEW: Landlord corrects & resubmits
    APPROVED --> PUBLISHED: Auto-published or Landlord activates
    PUBLISHED --> UNAVAILABLE: Landlord temporarily hides listing
    UNAVAILABLE --> PUBLISHED: Landlord unhides listing
    PUBLISHED --> RENTED: Tenancy successfully completed
    RENTED --> PUBLISHED: Previous lease ends & re-listed
    PUBLISHED --> ARCHIVED: Landlord permanently closes listing
    DRAFT --> ARCHIVED: Landlord discards draft
    ARCHIVED --> [*]
``
### 3.1 Strict State Transition Matrix
To maintain marketplace integrity, the backend enforces the following transition rules:
| Origin State | Permitted Target State | Authorized Actor | Validation Rules & Preconditions |
|---|---|---|---|
| *(New)* | `DRAFT` | Landlord / Agency | Minimal fields: Title & Property Type. |
| `DRAFT` | `PENDING_REVIEW` | Landlord / Agency | All required fields, location, pricing, and $\ge 3$ photos present. |
| `PENDING_REVIEW` | `APPROVED` | Platform Admin | Admin moderation checklist satisfied. |
| `PENDING_REVIEW` | `REJECTED` | Platform Admin | Valid rejection category and explanation recorded. |
| `REJECTED` | `PENDING_REVIEW` | Landlord / Agency | Landlord modifies rejected fields and resubmits.
| `APPROVED` | `PUBLISHED` | System / Landlord | Listing becomes visible in public search queries. |
| `PUBLISHED` | `UNAVAILABLE` | Landlord / Agency | Listing hidden from public search; existing inquiries preserved. |
| `UNAVAILABLE` | `PUBLISHED` | Landlord / Agency | Listing restored to public search. |
| `PUBLISHED` | `RENTED` | Landlord / Agency | Property rented; auto-updates associated pending applications. |
| `RENTED` | `PUBLISHED` | Landlord / Agency | Requires landlord confirmation of new availability date and price. |
| `*Any` | `ARCHIVED` | Landlord / Admin | Soft-deletes listing from active dashboard views. |
---
## 4. Tenant Inquiry & Viewing Operations
### 4.1 Inquiry Response Workflow
1. When a renter submits an inquiry, the landlord receives an immediate in-app and email notification.
2. The landlord accesses `/landlord/inquiries`, showing:
   - Renter name, inquiry timestamp, and target property reference.
   - Initial renter message (e.g., "Is the advance payment negotiable for a 1-year contract?").
3. Landlord responds directly through the secure message interface.
4. Renter personal phone numbers are shielded unless the landlord or renter explicitly chooses to exchange contacts or possesses a Premium tier.
### 4.2 Viewing Appointment Management
Landlords configure availability windows (e.g., Weekdays 4:00 PM – 6:00 PM, Saturdays 10:00 AM – 2:00 PM).
```mermaid
sequenceDiagram
    autonumber
    actor Renter
    participant Platform as ETrental System
    actor Landlord
    Renter->>Platform: Requests viewing: Saturday 11:00 AM
    Platform-->>Landlord: Notification: Viewing Requested (Bole Villa)
    Landlord->>Platform: Reviews calendar & chooses Action
    alt Landlord Confirms
        Landlord->>Platform: Clicks "Confirm Appointment"
        Platform-->>Renter: Appointment Confirmed! Location & instructions shared
    else Landlord Proposes Alternative
        Landlord->>Platform: Proposes Reschedule: Saturday 3:00 PM
        Platform-->>Renter: Viewing Rescheduled: Please accept new slot
        Renter->>Platform: Accepts new slot (Confirmed)
    else Landlord Declines
        Landlord->>Platform: Rejects (Reason: "Property currently under repair")
        Platform-->>Renter: Request Declined with reason
    end
````

---

## 5. Rental Application Review & Tenancy Completion

### 5.1 Applicant Screening

Landlords review submitted rental applications under `/landlord/applications`:

- Desired lease start date and duration.
- Number of adults and children moving in.
- Employment status, employer name, or business sector.
- Contact references.

### 5.2 Tenancy Finalization

When an agreement is reached:

1. The landlord selects **"Mark as Rented"**.
2. A completion modal records:
   - Agreed monthly rent in ETB.
   - Actual advance paid and deposit held.
   - Lease start and end dates.
   - Selected tenant account ID (if an ETrental registered user).
3. The platform automatically:
   - Updates the property state to `RENTED`.
   - Sends courteous closing notifications to other active applicants: _"This property has now been rented. Explore similar listings in Bole."_
   - Logs the transaction in the landlord's historical tenancy record.
