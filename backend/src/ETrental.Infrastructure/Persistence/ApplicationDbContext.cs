using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ETrental.Application.Common.Interfaces;
using ETrental.Domain.Common;
using ETrental.Domain.Entities;

namespace ETrental.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    private readonly ICurrentUserService? _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService? currentUserService = null)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<RenterProfile> RenterProfiles => Set<RenterProfile>();
    public DbSet<LandlordProfile> LandlordProfiles => Set<LandlordProfile>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<AgencyMembership> AgencyMemberships => Set<AgencyMembership>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyImage> PropertyImages => Set<PropertyImage>();
    public DbSet<PropertyInquiry> PropertyInquiries => Set<PropertyInquiry>();
    public DbSet<ViewingAppointment> ViewingAppointments => Set<ViewingAppointment>();
    public DbSet<RentalApplication> RentalApplications => Set<RentalApplication>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<SavedSearch> SavedSearches => Set<SavedSearch>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<SupportTicketMessage> SupportTicketMessages => Set<SupportTicketMessage>();
    public DbSet<UserReport> UserReports => Set<UserReport>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<ListingReview> ListingReviews => Set<ListingReview>();
    public DbSet<AgencyPropertyAssignment> AgencyPropertyAssignments => Set<AgencyPropertyAssignment>();
    public DbSet<RentalAgreement> RentalAgreements => Set<RentalAgreement>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Precision configurations for Ethiopian Birr (ETB)
        builder.Entity<Property>(entity =>
        {
            entity.Property(p => p.RentAmountETB).HasPrecision(18, 2);
            entity.Property(p => p.DepositAmountETB).HasPrecision(18, 2);
            
            entity.HasOne(p => p.Landlord)
                  .WithMany(u => u.OwnedProperties)
                  .HasForeignKey(p => p.LandlordId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Agency)
                  .WithMany(a => a.Properties)
                  .HasForeignKey(p => p.AgencyId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Composite indexes for fast Ethiopian location & budget search
            entity.HasIndex(p => new { p.Status, p.City, p.SubCity, p.RentAmountETB });
            entity.HasIndex(p => p.LandlordId);
            entity.HasIndex(p => p.AgencyId);

            // Soft-delete query filter
            entity.HasQueryFilter(p => !p.IsDeleted);

            // Agency tenant isolation: non-admin users can only query properties of their own agency
            entity.HasQueryFilter(p =>
                        (_currentUserService != null && _currentUserService.IsAdmin) ||
                p.AgencyId == null ||
                p.AgencyId == _currentUserService.AgencyId);
        });

        builder.Entity<PropertyImage>(entity =>
        {
            entity.HasOne(pi => pi.Property)
                  .WithMany(p => p.Images)
                  .HasForeignKey(pi => pi.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PropertyInquiry>(entity =>
        {
            entity.HasOne(i => i.Property)
                  .WithMany(p => p.Inquiries)
                  .HasForeignKey(i => i.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.Renter)
                  .WithMany(u => u.SentInquiries)
                  .HasForeignKey(i => i.RenterId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ViewingAppointment>(entity =>
        {
            entity.HasOne(va => va.Property)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(va => va.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(va => va.Renter)
                  .WithMany(u => u.Appointments)
                  .HasForeignKey(va => va.RenterId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<RentalApplication>(entity =>
        {
            entity.HasOne(ra => ra.Property)
                  .WithMany(p => p.Applications)
                  .HasForeignKey(ra => ra.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ra => ra.Applicant)
                  .WithMany(u => u.RentalApplications)
                  .HasForeignKey(ra => ra.ApplicantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Favorite>(entity =>
        {
            entity.HasIndex(f => new { f.UserId, f.PropertyId }).IsUnique();

            entity.HasOne(f => f.User)
                  .WithMany(u => u.Favorites)
                  .HasForeignKey(f => f.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Property)
                  .WithMany(p => p.Favorites)
                  .HasForeignKey(f => f.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AgencyMembership>(entity =>
        {
            entity.HasIndex(am => new { am.AgencyId, am.UserId }).IsUnique();

            entity.HasOne(am => am.Agency)
                  .WithMany(a => a.Members)
                  .HasForeignKey(am => am.AgencyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(am => am.User)
                  .WithOne(u => u.AgencyMembership)
                  .HasForeignKey<AgencyMembership>(am => am.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SubscriptionPlan>(entity =>
        {
            entity.Property(sp => sp.PriceETB).HasPrecision(18, 2);
        });

        builder.Entity<Subscription>(entity =>
        {
            entity.Property(s => s.AmountPaidETB).HasPrecision(18, 2);

            entity.HasOne(s => s.User)
                  .WithMany(u => u.Subscriptions)
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Plan)
                  .WithMany()
                  .HasForeignKey(s => s.PlanId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<SupportTicket>(entity =>
        {
            entity.HasIndex(t => t.TicketReference).IsUnique();
            entity.HasIndex(t => new { t.Status, t.Priority });

            // The ticket owner and the assigned agent are both ApplicationUser rows,
            // so the relationships are configured explicitly to avoid ambiguity.
            entity.HasOne(t => t.User)
                  .WithMany(u => u.SupportTickets)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.AssignedAgent)
                  .WithMany()
                  .HasForeignKey(t => t.AssignedAgentId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<SupportTicketMessage>(entity =>
        {
            entity.HasOne(m => m.Ticket)
                  .WithMany(t => t.Messages)
                  .HasForeignKey(m => m.TicketId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasIndex(n => new { n.UserId, n.IsRead });

            entity.HasOne(n => n.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlatformSetting>(entity =>
        {
            entity.HasIndex(s => s.Key).IsUnique();
        });

        builder.Entity<PaymentTransaction>(entity =>
        {
            entity.Property(p => p.AmountETB).HasPrecision(18, 2);
            entity.HasIndex(p => p.ExternalReference);
            entity.HasIndex(p => new { p.UserId, p.Status });

            entity.HasOne(p => p.User)
                  .WithMany(u => u.PaymentTransactions)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Plan)
                  .WithMany()
                  .HasForeignKey(p => p.PlanId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Subscription)
                  .WithMany()
                  .HasForeignKey(p => p.SubscriptionId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ListingReview>(entity =>
        {
            entity.HasIndex(r => new { r.PropertyId, r.CreatedAtUtc });

            entity.HasOne(r => r.Property)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(r => r.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AgencyPropertyAssignment>(entity =>
        {
            entity.HasIndex(a => new { a.AgencyId, a.UserId, a.PropertyId }).IsUnique();

            entity.HasOne(a => a.Agency)
                  .WithMany(a => a.PropertyAssignments)
                  .HasForeignKey(a => a.AgencyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Property)
                  .WithMany()
                  .HasForeignKey(a => a.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<RentalAgreement>(entity =>
        {
            entity.Property(a => a.MonthlyRentETB).HasPrecision(18, 2);
            entity.Property(a => a.DepositAmountETB).HasPrecision(18, 2);
            entity.HasIndex(a => new { a.PropertyId, a.Status });

            entity.HasOne(a => a.Property)
                  .WithMany(p => p.Agreements)
                  .HasForeignKey(a => a.PropertyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Renter)
                  .WithMany(u => u.RentalAgreements)
                  .HasForeignKey(a => a.RenterId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Landlord)
                  .WithMany()
                  .HasForeignKey(a => a.LandlordId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Application)
                  .WithMany()
                  .HasForeignKey(a => a.ApplicationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(t => t.Token).IsUnique();
            entity.HasIndex(t => new { t.UserId, t.IsUsed });
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAtUtc = DateTime.UtcNow;
                    entry.Entity.CreatedBy = _currentUserService?.UserId;
                    break;

                case EntityState.Modified:
                    entry.Entity.LastModifiedAtUtc = DateTime.UtcNow;
                    entry.Entity.LastModifiedBy = _currentUserService?.UserId;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
