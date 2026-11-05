import { HttpErrorResponse } from '@angular/common/http';

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!isRecord(value)) return null;

  for (const key of ['errors', 'detail', 'title', 'message', 'error']) {
    const message = firstMessage(value[key]);
    if (message) return message;
  }

  for (const nestedValue of Object.values(value)) {
    const message = firstMessage(nestedValue);
    if (message) return message;
  }

  return null;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const message = firstMessage(error instanceof HttpErrorResponse ? error.error : error);
  if (message) return message;

  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  return fallback;
}
