using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Dashboard;

namespace ETrental.Application.Interfaces;

public interface IDashboardService
{
    Task<Result<RenterDashboardDto>> GetRenterDashboardAsync(string userId);
    Task<Result<LandlordDashboardDto>> GetLandlordDashboardAsync(string userId);
    Task<Result<AgencyDashboardDto>> GetAgencyDashboardAsync(string userId);
}
