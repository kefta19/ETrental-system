using Microsoft.AspNetCore.Hosting;
using ETrental.Application.Common.Interfaces;
using System.Linq;

namespace ETrental.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] AllowedMimeTypes = { "image/jpeg", "image/png", "image/webp" };

    // Magic byte signatures for image file types
    private static readonly byte[] JpegSignature = { 0xFF, 0xD8, 0xFF };
    private static readonly byte[] PngSignature = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

    public FileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string originalFileName, string contentType, string folderName = "properties")
    {
        if (!IsValidImage(contentType, originalFileName))
        {
            throw new ArgumentException("Invalid file type. Only JPEG, PNG, and WebP images are permitted.");
        }

        // Magic byte validation: verify the actual file content matches the claimed type
        fileStream.Position = 0;
        using var reader = new BinaryReader(fileStream);
        var headerBytes = reader.ReadBytes(12);
        fileStream.Position = 0;

        if (!HasValidMagicBytes(headerBytes, contentType, originalFileName))
        {
            throw new ArgumentException("File content does not match the declared image type. Malicious file uploads are not permitted.");
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads", folderName);

        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsDir, uniqueFileName);

        using (var outputStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(outputStream);
        }

        return $"/uploads/{folderName}/{uniqueFileName}";
    }

    private static bool HasValidMagicBytes(byte[] header, string contentType, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (extension == ".jpg" || extension == ".jpeg" || contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase))
        {
            return header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        }

        if (extension == ".png" || contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase))
        {
            return header.Length >= 8 && header.SequenceEqual(PngSignature);
        }

        if (extension == ".webp" || contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase))
        {
            // WebP files start with RIFF header followed by WEBP marker at offset 8
            return header.Length >= 12
                && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;
        }

        return false;
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl)) return Task.CompletedTask;

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var relativePath = fileUrl.TrimStart('/');
        var filePath = Path.Combine(webRoot, relativePath);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        return Task.CompletedTask;
    }

    public bool IsValidImage(string contentType, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return false;
        }

        return AllowedMimeTypes.Contains(contentType.ToLowerInvariant());
    }
}
