/**
 * Input validation utilities for Edge Functions
 * Prevents injection attacks and validates data types
 */

/**
 * Sanitize string input
 */
export function sanitizeString(input: unknown): string {
    if (typeof input !== 'string') {
        throw new Error('Invalid input: expected string');
    }

    // Remove potentially dangerous characters
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): string {
    if (typeof email !== 'string') {
        throw new Error('Invalid email: expected string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();

    if (!emailRegex.test(sanitized)) {
        throw new Error('Invalid email format');
    }

    if (sanitized.length > 320) {
        throw new Error('Email too long');
    }

    return sanitized;
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: unknown): string {
    if (typeof uuid !== 'string') {
        throw new Error('Invalid UUID: expected string');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
        throw new Error('Invalid UUID format');
    }

    return uuid.toLowerCase();
}

/**
 * Validate number within range
 */
export function validateNumber(
    value: unknown,
    min?: number,
    max?: number
): number {
    const num = Number(value);

    if (isNaN(num)) {
        throw new Error('Invalid number');
    }

    if (min !== undefined && num < min) {
        throw new Error(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
        throw new Error(`Number must be at most ${max}`);
    }

    return num;
}

/**
 * Validate city name
 */
export function validateCityName(city: unknown): string {
    if (typeof city !== 'string') {
        throw new Error('Invalid city: expected string');
    }

    const sanitized = city.trim();

    if (sanitized.length === 0) {
        throw new Error('City name cannot be empty');
    }

    if (sanitized.length > 100) {
        throw new Error('City name too long');
    }

    // Allow only letters, spaces, hyphens, and parentheses
    if (!/^[a-zA-ZÀ-ÿ\s\-()]+$/.test(sanitized)) {
        throw new Error('Invalid city name format');
    }

    return sanitized;
}

/**
 * Validate JSON object
 */
export function validateJSON(input: unknown): Record<string, unknown> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error('Invalid input: expected object');
    }

    return input as Record<string, unknown>;
}

/**
 * Validate request body
 */
export async function validateRequestBody(
    request: Request
): Promise<Record<string, unknown>> {
    try {
        const body = await request.json();
        return validateJSON(body);
    } catch (_error) {
        throw new Error('Invalid JSON in request body');
    }
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(message: string): Response {
    return new Response(
        JSON.stringify({
            error: 'Validation Error',
            message,
        }),
        {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}
