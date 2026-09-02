export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Flags this as a trusted, expected error
        
        // Preserve the stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

export class SecurityError extends AppError {
    constructor(message: string) {
        super(message, 403); // Hardcodes 403 Forbidden
        this.name = 'SecurityError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400); // Hardcodes 400 Bad Request
        this.name = 'ValidationError';
    }
}
