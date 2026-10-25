using System.IO;

namespace ETrental.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string originalFileName, string contentType, string folderName = "properties");
    Task DeleteFileAsync(string fileUrl);
    bool IsValidImage(string contentType, string fileName);
}
