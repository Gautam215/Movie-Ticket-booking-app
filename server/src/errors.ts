export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message);
export const unauthorized = (message = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to perform this action') => new AppError(403, 'FORBIDDEN', message);
export const conflict = (message: string, details?: unknown) => new AppError(409, 'CONFLICT', message, details);
