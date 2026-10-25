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
        var roles = new[] { "Admin", "Support", "Landlord", "Agency", "Renter" };
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
        await SeedPlatformSettingsAsync(context);
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
        if (await userManager.FindByEmailAsync(renterEmail) == null)
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

        // 5c. Verified agency with a manager and an agent
        var agencyManagerEmail = "agency@etrental.com";
        var agencyManager = await userManager.FindByEmailAsync(agencyManagerEmail);

        if (agencyManager == null)
        {
            agencyManager = new ApplicationUser
            {
                UserName = agencyManagerEmail,
                Email = agencyManagerEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911100100",
                PhoneNumberConfirmed = true,
                FirstName = "Daniel",
                LastName = "Mekonnen",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(agencyManager, "Agency@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(agencyManager, "Agency");
            }
        }

        if (agencyManager != null)
        {
            var agency = await context.Agencies.FirstOrDefaultAsync(a => a.OfficialEmail == agencyManagerEmail);

            if (agency == null)
            {
                agency = new Agency
                {
                    Name = "Habesha Homes Realty",
                    Description = "A full service property management company in Addis Ababa managing residential and commercial rentals.",
                    LogoUrl = null,
                    TaxIdentificationNumber = "0012984765",
                    BusinessLicenseNumber = "BL-AA-2019-4471",
                    City = "Addis Ababa",
                    SubCity = "Bole",
                    OfficeAddress = "Bole Medhanealem, Millennium Hall, Office 402",
                    OfficialPhone = "+251911100100",
                    OfficialEmail = agencyManagerEmail,
                    Status = AgencyStatus.Verified,
                    VerifiedAtUtc = DateTime.UtcNow,
                    VerifiedBy = "seed",
                    SubmittedAtUtc = DateTime.UtcNow.AddDays(-120)
                };
                context.Agencies.Add(agency);
                await context.SaveChangesAsync();
            }

            var managerMembership = await context.AgencyMemberships
                .FirstOrDefaultAsync(m => m.UserId == agencyManager.Id);

            if (managerMembership == null)
            {
                context.AgencyMemberships.Add(new AgencyMembership
                {
                    AgencyId = agency.Id,
                    UserId = agencyManager.Id,
                    Role = AgencyStaffRole.AgencyManager,
                    IsActive = true,
                    JoinedAtUtc = DateTime.UtcNow.AddDays(-120)
                });
            }
            else
            {
                managerMembership.IsActive = true;
                managerMembership.Role = AgencyStaffRole.AgencyManager;
            }

            // Agency agent
            var agentEmail = "agent@etrental.com";
            var agent = await userManager.FindByEmailAsync(agentEmail);
            if (agent == null)
            {
                agent = new ApplicationUser
                {
                    UserName = agentEmail,
                    Email = agentEmail,
                    EmailConfirmed = true,
                    PhoneNumber = "+251911100200",
                    PhoneNumberConfirmed = true,
                    FirstName = "Yonas",
                    LastName = "Getachew",
                    CreatedAtUtc = DateTime.UtcNow,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(agent, "Agent@123456");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(agent, "Agency");
                }
            }

            if (agent != null)
            {
                var agentMembership = await context.AgencyMemberships
                    .FirstOrDefaultAsync(m => m.UserId == agent.Id);

                if (agentMembership == null)
                {
                    context.AgencyMemberships.Add(new AgencyMembership
                    {
                        AgencyId = agency.Id,
                        UserId = agent.Id,
                        Role = AgencyStaffRole.Agent,
                        IsActive = true,
                        JoinedAtUtc = DateTime.UtcNow.AddDays(-60)
                    });
                }
            }

            await context.SaveChangesAsync();

            // One agency owned listing
            var agencyPropertyExists = await context.Properties
                .AnyAsync(p => p.AgencyId == agency.Id);

            if (!agencyPropertyExists)
            {
                context.Properties.Add(new Property
                {
                    Title = "Modern 2-Bedroom Apartment in Bole Sakura managed by Habesha Homes",
                    Description = "Professionally managed apartment in a gated compound in Bole Sakura. The unit has a fitted kitchen, a private balcony, a water tank with booster pump and a standby generator for the building.",
                    PropertyType = PropertyType.Apartment,
                    Status = PropertyStatus.Published,
                    Region = "Addis Ababa",
                    City = "Addis Ababa",
                    SubCity = "Bole",
                    Neighborhood = "Bole Sakura",
                    Landmark = "Across from Friendship City Center",
                    RentAmountETB = 42000,
                    DepositAmountETB = 42000,
                    AdvanceMonthsRequired = 3,
                    MinimumLeaseMonths = 12,
                    AvailableFromDate = DateTime.UtcNow,
                    Bedrooms = 2,
                    Bathrooms = 2,
                    AreaSquareMeters = 110,
                    Furnishing = FurnishingStatus.SemiFurnished,
                    HasWaterTank = true,
                    HasGenerator = true,
                    HasSecurityGuard = true,
                    HasParking = true,
                    HasElevator = true,
                    HasWifi = true,
                    HasBalcony = true,
                    WaterBillIncluded = false,
                    ElectricityBillIncluded = false,
                    LandlordId = agencyManager.Id,
                    AgencyId = agency.Id,
                    Images = new List<PropertyImage>
                    {
                        new() { ImageUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", IsPrimary = true, DisplayOrder = 0 }
                    }
                });

                await context.SaveChangesAsync();
            }
        }

        // 5d. A second agency, used to prove that agencies cannot see each other's data
        var otherAgencyEmail = "otheragency@etrental.com";
        var otherManager = await userManager.FindByEmailAsync(otherAgencyEmail);

        if (otherManager == null)
        {
            otherManager = new ApplicationUser
            {
                UserName = otherAgencyEmail,
                Email = otherAgencyEmail,
                EmailConfirmed = true,
                PhoneNumber = "+251911300300",
                PhoneNumberConfirmed = true,
                FirstName = "Hiwot",
                LastName = "Alemu",
                CreatedAtUtc = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(otherManager, "OtherAgency@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(otherManager, "Agency");
            }
        }

        if (otherManager != null)
        {
            var otherAgency = await context.Agencies.FirstOrDefaultAsync(a => a.OfficialEmail == otherAgencyEmail);

            if (otherAgency == null)
            {
                otherAgency = new Agency
                {
                    Name = "Blue Nile Property Services",
                    Description = "An independent property services company based in Kirkos.",
                    TaxIdentificationNumber = "0044556677",
                    BusinessLicenseNumber = "BL-AA-2021-8830",
                    City = "Addis Ababa",
                    SubCity = "Kirkos",
                    OfficeAddress = "Kirkos, Kg City Center, Office 12",
                    OfficialPhone = "+251911300300",
                    OfficialEmail = otherAgencyEmail,
                    Status = AgencyStatus.Pending,
                    SubmittedAtUtc = DateTime.UtcNow.AddDays(-5)
                };
                context.Agencies.Add(otherAgency);
                await context.SaveChangesAsync();
            }

            var otherMembership = await context.AgencyMemberships.FirstOrDefaultAsync(m => m.UserId == otherManager.Id);
            if (otherMembership == null)
            {
                context.AgencyMemberships.Add(new AgencyMembership
                {
                    AgencyId = otherAgency.Id,
                    UserId = otherManager.Id,
                    Role = AgencyStaffRole.AgencyManager,
                    IsActive = true,
                    JoinedAtUtc = DateTime.UtcNow.AddDays(-5)
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
            new() { Key = "Agency.VerificationSlaHours", Value = "72", Description = "Target turnaround time for agency verification.", Category = "Agencies" },
            new() { Key = "Platform.MaintenanceMode", Value = "false", Description = "When true the public search pages show a maintenance notice.", Category = "Platform" },
            new() { Key = "Platform.SupportEmail", Value = "support@etrental.com", Description = "Public support email address displayed to users.", Category = "Platform" },
            new() { Key = "Platform.Currency", Value = "ETB", Description = "Currency used for every price on the platform.", Category = "Platform" }
        };

        context.PlatformSettings.AddRange(settings);
        await context.SaveChangesAsync();
    }
}
