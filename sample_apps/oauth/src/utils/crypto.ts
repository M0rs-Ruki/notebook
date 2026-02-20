/**
 * Cryptography and PKCE utility functions
 */

import crypto from 'crypto'

/**
 * Generate PKCE code verifier (random string)
 */
export function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate PKCE code challenge from verifier (SHA256 hash)
 */
export function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
    return crypto.randomBytes(16).toString('hex')
}

/**
 * Mask sensitive data for display (shows first 8 chars + ...)
 */
export function maskSecret(secret: string | undefined): string {
    if (!secret || secret.length <= 8) return '***'
    return secret.substring(0, 8) + '...'
}

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHtml(str: string | undefined): string {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}
