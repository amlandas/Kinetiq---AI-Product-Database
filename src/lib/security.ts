/**
 * Sanitizes user input to prevent prompt injection and XSS.
 * Removes common injection patterns and escapes characters that could interfere with prompt structure.
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Remove potential command injection patterns often used in prompt injection
    // e.g., "Ignore previous instructions", "System override"
    const dangerousPatterns = [
        /ignore previous instructions/gi,
        /system override/gi,
        /system prompt/gi,
        /simulated mode/gi,
        /<script/gi,
        /javascript:/gi
    ];

    dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Escape logical delimiters if we use local structured prompting
    // We primarily rely on XML tags in the prompt wrapper, so ensuring the input 
    // doesn't close those tags is key.
    sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return sanitized.trim();
}
