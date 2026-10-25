using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ETrental.Application.Common.Models;
using ETrental.Application.DTOs.Auth;
using ETrental.Application.Interfaces;

namespace ETrental.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Register a new user account (Renter, Landlord, or Agency).
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Result<AuthResponseDto>.Failure(
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToArray()));
        }

        var result = await _authService.RegisterAsync(dto);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Authenticate a user and return JWT access token + refresh token.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Result<AuthResponseDto>.Failure(
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToArray()));
        }

        var result = await _authService.LoginAsync(dto);
        if (!result.Succeeded)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Refresh an expired access token using a valid refresh token.
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return BadRequest(Result<AuthResponseDto>.Failure("Token and refresh token are required."));
        }

        var result = await _authService.RefreshTokenAsync(request.Token, request.RefreshToken);
        if (!result.Succeeded)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get the currently authenticated user's profile.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _authService.GetCurrentUserAsync(userId);
        if (!result.Succeeded)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}

/// <summary>
/// Request model for token refresh endpoint.
/// </summary>
public class RefreshTokenRequest
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>
/// Response wrapper for auth endpoints (matches frontend ApiResponse<T> shape).
/// </summary>
public class AuthApiResponse<T>
{
    public bool Succeeded { get; set; }
    public T? Data { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();
}
