using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ETrental.Domain.Entities;
using ETrental.Domain.Enums;

namespace ETrental.Infrastructure.Persistence;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // 1. Seed Roles
        var roles = new[] { "Admin", "Support", "Landlord", "Renter" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Seed Subscription Plans
        if (!await context.SubscriptionPlans.AnyAsync())
        {
            var freePlan = new SubscriptionPlan
            {
                Name = "Free",
                Tier = SubscriptionTier.Free,
                PriceETB = 0,
                BillingPeriodDays = 365,
                MaxActiveFavorites = 5,
                MaxWeeklyInquiries = 3,
                CanViewDirectPhone = false,
                HasInstantAlerts = false,
                IsActive = true
            };

            var premiumPlan = new SubscriptionPlan
            {
                Name = "Premium",
                Tier = SubscriptionTier.Premium,
                PriceETB = 299,
                BillingPeriodDays = 30,
                MaxActiveFavorites = 9999,
                MaxWeeklyInquiries = 9999,
                CanViewDirectPhone = true,
                HasInstantAlerts = true,
                IsActive = true
            };

            context.SubscriptionPlans.AddRange(freePlan, premiumPlan);
            await context.SaveChangesAsync();
        }

        // 3. Seed Default Admin User
        var adminEmail = "admin@etrental.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911000000",
                PhoneNumberConfirmed = true,
                FirstName = "System",
                LastName = "Administrator",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var createResult = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");

                var premiumPlan = await context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Tier == SubscriptionTier.Premium);
                if (premiumPlan != null)
                {
                    context.Subscriptions.Add(new Subscription
                    {
                        UserId = adminUser.Id,
                        PlanId = premiumPlan.Id,
                        Status = SubscriptionStatus.Active,
                        StartDateUtc = DateTime.UtcNow,
                        EndDateUtc = DateTime.UtcNow.AddYears(10),
                        AmountPaidETB = 0
                    });
                    await context.SaveChangesAsync();
                }
            }
        }

        // 4. Seed Sample Landlord & Ethiopian Properties
        var landlordEmail = "landlord@etrental.com";
        var landlord = await userManager.FindByEmailAsync(landlordEmail);
        if (landlord == null)
        {
            landlord = new ApplicationUser
            {
                UserName = landlordEmail,
                Email = landlordEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911223344",
                PhoneNumberConfirmed = true,
                FirstName = "Tewodros",
                LastName = "Kassahun",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(landlord, "Landlord@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(landlord, "Landlord");
                context.LandlordProfiles.Add(new LandlordProfile
                {
                    UserId = landlord.Id,
                    IsIdentityVerified = true,
                    NationalIdNumber = "ET-ID-884920"
                });
                await context.SaveChangesAsync();
            }
        }

        if (!await context.Properties.AnyAsync())
        {
            var properties = new List<Property>
            {
                new()
                {
                    Title = "Luxury 3-Bedroom Furnished Apartment in Bole Medhanealem",
                    Description = "Spacious modern apartment located in the prime center of Bole, minutes away from Edna Mall and Bole International Airport. Features an expansive living room, modern European kitchen, reserve water tank with booster pump, and dedicated backup generator.",
                    PropertyType = PropertyType.Apartment,
                    Status = PropertyStatus.Published,
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Bole",
                    Neighborhood = "Bole Medhanealem",
                    Landmark = "Behind Edna Mall",
                    RentAmountETB = 65000,
                    DepositAmountETB = 65000,
                    AdvanceMonthsRequired = 3,
                    MinimumLeaseMonths = 6,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 3,
                    Bathrooms = 2,
                    AreaSquareMeters = 165,
                    Furnishing = FurnishingStatus.FullyFurnished,
                    HasWaterTank = true,
                    HasGenerator = true,
                    HasSecurityGuard = true,
                    HasParking = true,
                    HasElevator = true,
                    HasWifi = true,
                    HasBalcony = true,
                    WaterBillIncluded = true,
                    ElectricityBillIncluded = false,
                    LandlordId = landlord.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", IsPrimary = true, DisplayOrder = 0 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", IsPrimary = false, DisplayOrder = 1 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", IsPrimary = false, DisplayOrder = 2 }
                    }
                },
                new()
                {
                    Title = "Modern 2-Bedroom Condominium in CMC Michael",
                    Description = "Well-maintained 2-bedroom condominium located in CMC near Michael Church. Highly secure community with clean compound, reliable utility connections, and easy light-rail transit access.",
                    PropertyType = PropertyType.Condominium,
                    Status = PropertyStatus.Published,
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Yeka",
                    Neighborhood = "CMC Michael",
                    Landmark = "Near St. Michael Church",
                    RentAmountETB = 25000,
                    DepositAmountETB = 25000,
                    AdvanceMonthsRequired = 3,
                    MinimumLeaseMonths = 12,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 2,
                    Bathrooms = 1,
                    AreaSquareMeters = 95,
                    Furnishing = FurnishingStatus.SemiFurnished,
                    HasWaterTank = true,
                    HasGenerator = false,
                    HasSecurityGuard = true,
                    HasParking = true,
                    HasElevator = false,
                    HasWifi = false,
                    HasBalcony = true,
                    WaterBillIncluded = false,
                    ElectricityBillIncluded = false,
                    LandlordId = landlord.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1502005229762-ee152da7c5d6?w=800", IsPrimary = true, DisplayOrder = 0 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800", IsPrimary = false, DisplayOrder = 1 }
                    }
                },
                new()
                {
                    Title = "Executive G+1 Villa with Private Garden in Old Airport",
                    Description = "Distinguished executive villa in Old Airport residential enclave, suitable for diplomats or executives. Features 4 ensuite bedrooms, maid service quarter, modern and traditional kitchens, 3-phase electricity, 10,000L Rotto water reserve, and automated generator.",
                    PropertyType = PropertyType.Villa,
                    Status = PropertyStatus.Published,
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Nifas Silk-Lafto",
                    Neighborhood = "Old Airport",
                    Landmark = "Close to ICS (International Community School)",
                    RentAmountETB = 140000,
                    DepositAmountETB = 280000,
                    AdvanceMonthsRequired = 6,
                    MinimumLeaseMonths = 12,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 4,
                    Bathrooms = 4,
                    AreaSquareMeters = 380,
                    Furnishing = FurnishingStatus.Unfurnished,
                    HasWaterTank = true,
                    HasGenerator = true,
                    HasSecurityGuard = true,
                    HasParking = true,
                    HasElevator = false,
                    HasWifi = true,
                    HasBalcony = true,
                    WaterBillIncluded = true,
                    ElectricityBillIncluded = false,
                    LandlordId = landlord.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", IsPrimary = true, DisplayOrder = 0 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", IsPrimary = false, DisplayOrder = 1 },
                        new() { ImageUrl = "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800", IsPrimary = false, DisplayOrder = 2 }
                    }
                },
                new()
                {
                    Title = "Cozy Studio Apartment in Kazanchis Business District",
                    Description = "Conveniently situated studio apartment in Kazanchis, perfect for young professionals working near ECA or Radisson Blu. Features 24/7 security, standby generator, and elevator.",
                    PropertyType = PropertyType.Studio,
                    Status = PropertyStatus.Published,
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Kirkos",
                    Neighborhood = "Kazanchis",
                    Landmark = "Near Radisson Blu Hotel",
                    RentAmountETB = 18000,
                    DepositAmountETB = 18000,
                    AdvanceMonthsRequired = 2,
                    MinimumLeaseMonths = 6,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 1,
                    Bathrooms = 1,
                    AreaSquareMeters = 55,
                    Furnishing = FurnishingStatus.FullyFurnished,
                    HasWaterTank = true,
                    HasGenerator = true,
                    HasSecurityGuard = true,
                    HasParking = false,
                    HasElevator = true,
                    HasWifi = true,
                    HasBalcony = false,
                    WaterBillIncluded = true,
                    ElectricityBillIncluded = true,
                    LandlordId = landlord.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", IsPrimary = true, DisplayOrder = 0 }
                    }
                },
                new()
                {
                    Title = "Brand New 3-Bedroom Apartment in Sarbet Vatican Area",
                    Description = "Bright, newly constructed 3-bedroom apartment overlooking the Sarbet valley. High-end finishes, ceramic tiling, backup power, water borehole, and covered garage space.",
                    PropertyType = PropertyType.Apartment,
                    Status = PropertyStatus.PendingReview, // Demonstrating Pending Review queue!
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Kirkos",
                    Neighborhood = "Sarbet",
                    Landmark = "Near Vatican Embassy",
                    RentAmountETB = 55000,
                    DepositAmountETB = 55000,
                    AdvanceMonthsRequired = 3,
                    MinimumLeaseMonths = 6,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 3,
                    Bathrooms = 2,
                    AreaSquareMeters = 140,
                    Furnishing = FurnishingStatus.Unfurnished,
                    HasWaterTank = true,
                    HasGenerator = true,
                    HasSecurityGuard = true,
                    HasParking = true,
                    HasElevator = true,
                    HasWifi = false,
                    HasBalcony = true,
                    WaterBillIncluded = false,
                    ElectricityBillIncluded = false,
                    LandlordId = landlord.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800", IsPrimary = true, DisplayOrder = 0 }
                    }
                }
            };

            context.Properties.AddRange(properties);
            await context.SaveChangesAsync();
        }

        // 5. Seed demo accounts for every platform role
        await SeedDemoUsersAsync(context, userManager);

        // 6. Seed platform configuration
                // 6. Seed platform configuration
        await SeedPlatformSettingsAsync(context);

        // 7. Seed demo interactions
        await SeedSampleInteractionsAsync(context, userManager);
    }

    private static async Task SeedDemoUsersAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        // 5a. Support agent
        var supportEmail = "support@etrental.com";
        if (await userManager.FindByEmailAsync(supportEmail) == null)
        {
            var supportUser = new ApplicationUser
            {
                UserName = supportEmail,
                Email = supportEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911445566",
                PhoneNumberConfirmed = true,
                FirstName = "Selam",
                LastName = "Worku",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(supportUser, "Support@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(supportUser, "Support");
                await context.SaveChangesAsync();
            }
        }

        // 5b. Demo renter
        var renterEmail = "renter@etrental.com";
        var existingRenter = await userManager.FindByEmailAsync(renterEmail);
        if (existingRenter != null)
        {
            existingRenter.PasswordHash = userManager.PasswordHasher.HashPassword(existingRenter, "Renter@123456");
            existingRenter.IsActive = true;
            existingRenter.EmailConfirmed = true;
            existingRenter.LockoutEnd = null;
            await userManager.UpdateAsync(existingRenter);
        }
        else
        {
            var renter = new ApplicationUser
            {
                UserName = renterEmail,
                Email = renterEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911778899",
                PhoneNumberConfirmed = true,
                FirstName = "Marta",
                LastName = "Tesfaye",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(renter, "Renter@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(renter, "Renter");
                context.RenterProfiles.Add(new RenterProfile
                {
                    UserId = renter.Id,
                    PreferredCity = "Addis Ababa",
                    PreferredSubCity = "Bole",
                    MaxBudgetETB = 60000,
                    Occupation = "Software Engineer",
                    IsVerifiedRenter = true
                });
                await context.SaveChangesAsync();
            }
        }

    }

    private static async Task SeedPlatformSettingsAsync(ApplicationDbContext context)
    {
        if (await context.PlatformSettings.AnyAsync())
        {
            return;
        }

        var settings = new List<PlatformSetting>
        {
            new() { Key = "Listing.MinimumPhotos", Value = "1", Description = "Minimum number of photos a listing must have before it can be submitted for review.", Category = "Listings" },
            new() { Key = "Listing.MaxPhotos", Value = "15", Description = "Maximum number of photos allowed on a single listing.", Category = "Listings" },
            new() { Key = "Listing.MaxUploadSizeMB", Value = "5", Description = "Maximum upload size in megabytes for a single property photo.", Category = "Listings" },
            new() { Key = "Listing.ReviewSlaHours", Value = "48", Description = "Target turnaround time for the moderation team to review a listing.", Category = "Listings" },
            new() { Key = "Appointment.MinNoticeHours", Value = "12", Description = "Minimum notice a renter must give before a viewing can be booked.", Category = "Appointments" },
            new() { Key = "Appointment.SlotLengthMinutes", Value = "60", Description = "Length of a single viewing slot in minutes.", Category = "Appointments" },
            new() { Key = "Inquiry.WeeklyFreeLimit", Value = "3", Description = "Number of inquiries a Free renter can send in a rolling seven day window.", Category = "Subscriptions" },
            new() { Key = "Favorite.FreeLimit", Value = "5", Description = "Number of properties a Free renter can save to favourites.", Category = "Subscriptions" },
            new() { Key = "Support.ResponseSlaHours", Value = "24", Description = "Target first response time for a support ticket.", Category = "Support" },
            new() { Key = "Support.SafetySlaHours", Value = "2", Description = "Target response time for safety and fraud reports.", Category = "Support" },
            new() { Key = "Platform.MaintenanceMode", Value = "false", Description = "When true the public search pages show a maintenance notice.", Category = "Platform" },
            new() { Key = "Platform.SupportEmail", Value = "support@etrental.com", Description = "Public support email address displayed to users.", Category = "Platform" },
            new() { Key = "Platform.Currency", Value = "ETB", Description = "Currency used for every price on the platform.", Category = "Platform" }
        };

        context.PlatformSettings.AddRange(settings);
        await context.SaveChangesAsync();
    }
    private static async Task SeedSampleInteractionsAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        var renter = await userManager.FindByEmailAsync("renter@etrental.com");
        var properties = await context.Properties.Take(3).ToListAsync();

        if (renter == null || properties.Count == 0) return;

        var prop1 = properties[0];
        var prop2 = properties.Count > 1 ? properties[1] : prop1;

        // 1. Favorites
        if (!await context.Favorites.AnyAsync(f => f.UserId == renter.Id))
        {
            context.Favorites.Add(new Favorite
            {
                UserId = renter.Id,
                PropertyId = prop1.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-3)
            });
            if (prop2.Id != prop1.Id)
            {
                context.Favorites.Add(new Favorite
                {
                    UserId = renter.Id,
                    PropertyId = prop2.Id,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
                });
            }
            await context.SaveChangesAsync();
        }

        // 2. Saved Searches
        if (!await context.SavedSearches.AnyAsync(s => s.UserId == renter.Id))
        {
            context.SavedSearches.AddRange(
                new SavedSearch
                {
                    UserId = renter.Id,
                    Name = "Bole 2-Bedroom Apartment",
                    City = "Addis Ababa",
                    SubCity = "Bole",
                    MinPriceETB = 25000,
                    MaxPriceETB = 55000,
                    MinBedrooms = 2,
                    PropertyType = "Apartment",
                    AlertEmailEnabled = true,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-10)
                },
                new SavedSearch
                {
                    UserId = renter.Id,
                    Name = "CMC Modern Condominium",
                    City = "Addis Ababa",
                    SubCity = "CMC",
                    MinPriceETB = 20000,
                    MaxPriceETB = 40000,
                    MinBedrooms = 2,
                    PropertyType = "Condominium",
                    AlertEmailEnabled = true,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
                }
            );
            await context.SaveChangesAsync();
        }

        // 3. Inquiries
        if (!await context.PropertyInquiries.AnyAsync(i => i.RenterId == renter.Id))
        {
            context.PropertyInquiries.AddRange(
                new PropertyInquiry
                {
                    PropertyId = prop1.Id,
                    RenterId = renter.Id,
                    InitialMessage = "Hello! Is this property still available for move-in next month? I would love to schedule a visit.",
                    LandlordReply = "Hello! Yes, it is available. The advance requested is 3 months and viewing is available this Saturday.",
                    RepliedAtUtc = DateTime.UtcNow.AddDays(-1),
                    IsReadByLandlord = true,
                    IsReadByRenter = false,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                },
                new PropertyInquiry
                {
                    PropertyId = prop2.Id,
                    RenterId = renter.Id,
                    InitialMessage = "Greetings, does the monthly rent include water, parking, and standby backup generator?",
                    LandlordReply = "Good morning! Yes, generator fuel for common power and 1 dedicated parking bay are included.",
                    RepliedAtUtc = DateTime.UtcNow.AddHours(-14),
                    IsReadByLandlord = true,
                    IsReadByRenter = true,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
                }
            );
            await context.SaveChangesAsync();
        }

        // 4. Viewing Appointments
        if (!await context.ViewingAppointments.AnyAsync(a => a.RenterId == renter.Id))
        {
            context.ViewingAppointments.AddRange(
                new ViewingAppointment
                {
                    PropertyId = prop1.Id,
                    RenterId = renter.Id,
                    RequestedDateTimeUtc = DateTime.UtcNow.AddDays(2).Date.AddHours(10),
                    ConfirmedDateTimeUtc = DateTime.UtcNow.AddDays(2).Date.AddHours(10),
                    Status = AppointmentStatus.Confirmed,
                    RenterNotes = "I work nearby in Bole Atlas and can come at 10:00 AM sharp.",
                    HostNotes = "Looking forward to meeting you. Meet at the compound security gate.",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                },
                new ViewingAppointment
                {
                    PropertyId = prop2.Id,
                    RenterId = renter.Id,
                    RequestedDateTimeUtc = DateTime.UtcNow.AddDays(4).Date.AddHours(14),
                    ConfirmedDateTimeUtc = null,
                    Status = AppointmentStatus.Requested,
                    RenterNotes = "Would love to see the compound amenities.",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
                }
            );
            await context.SaveChangesAsync();
        }

        // 5. Rental Applications
        if (!await context.RentalApplications.AnyAsync(a => a.ApplicantId == renter.Id))
        {
            context.RentalApplications.AddRange(
                new RentalApplication
                {
                    PropertyId = prop1.Id,
                    ApplicantId = renter.Id,
                    ProposedMoveInDate = DateTime.UtcNow.AddDays(14).Date,
                    ProposedLeaseDurationMonths = 12,
                    ProposedOccupantsCount = 2,
                    EmploymentOrIncomeSummary = "Senior Software Engineer at Commercial Bank of Ethiopia IT. Monthly Net Salary: 78,000 ETB.",
                    AdditionalNotes = "Non-smoker, no pets. Can pay 3-6 months advance upon lease signature.",
                    Status = ApplicationStatus.UnderReview,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-3)
                },
                new RentalApplication
                {
                    PropertyId = prop2.Id,
                    ApplicantId = renter.Id,
                    ProposedMoveInDate = DateTime.UtcNow.AddDays(30).Date,
                    ProposedLeaseDurationMonths = 12,
                    ProposedOccupantsCount = 1,
                    EmploymentOrIncomeSummary = "Remote Tech Consultant. Verified steady monthly income over 85,000 ETB.",
                    AdditionalNotes = "Require quiet residential area with stable internet.",
                    Status = ApplicationStatus.Accepted,
                    HostDecisionNotes = "Verified employment letter and national ID. Application approved.",
                    DecidedAtUtc = DateTime.UtcNow.AddDays(-1),
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
                }
            );
            await context.SaveChangesAsync();
        }
    }
}

