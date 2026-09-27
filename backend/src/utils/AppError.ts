/** A friendly, client-safe error carrying an HTTP status code. */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found.') {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Please identify yourself to continue.') {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'This action conflicts with the current state.') {
    super(message, 409);
  }
}
