namespace ETrental.Application.Common.Models;

public class Result<T>
{
    public bool Succeeded { get; set; }
    public T? Data { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();

    public static Result<T> Success(T data)
    {
        return new Result<T> { Succeeded = true, Data = data };
    }

    public static Result<T> Failure(params string[] errors)
    {
        return new Result<T> { Succeeded = false, Errors = errors };
    }

    public static Result<T> Failure(IEnumerable<string> errors)
    {
        return new Result<T> { Succeeded = false, Errors = errors.ToArray() };
    }
}

public class Result
{
    public bool Succeeded { get; set; }
    public string[] Errors { get; set; } = Array.Empty<string>();

    public static Result Success()
    {
        return new Result { Succeeded = true };
    }

    public static Result Failure(params string[] errors)
    {
        return new Result { Succeeded = false, Errors = errors };
    }

    public static Result Failure(IEnumerable<string> errors)
    {
        return new Result { Succeeded = false, Errors = errors.ToArray() };
    }
}
