/**
 * OAuth-related type definitions
 */

// OAuth Application Configuration
export interface OAuthAppConfig {
    name: string
    description: string
    redirectUris: string[]
    allowedGrantTypes: string[]
    allowedScopes: string[]
    isConfidential: boolean
    accessTokenLifetime: number
    refreshTokenLifetime: number
}

// OAuth Application Response
export interface OAuthAppResponse {
    clientId: string
    clientSecret: string
    name?: string
    description?: string
    redirectUris?: string[]
    allowedGrantTypes?: string[]
    allowedScopes?: string[]
    isConfidential?: boolean
    accessTokenLifetime?: number
    refreshTokenLifetime?: number
}

// OAuth App Creation Result
export interface CreateOAuthAppResult {
    app?: OAuthAppResponse
    clientId?: string
    clientSecret?: string
}

// OAuth App Entity
export interface OAuthApp {
    id?: string
    _id?: string
    clientId: string
}

// OAuth Apps List Response
export interface OAuthAppsResponse {
    data?: OAuthApp[]
    apps?: OAuthApp[]
}

// Token Response from OAuth Server
export interface TokenResponse {
    access_token: string
    token_type: string
    expires_in: number
    scope: string
    refresh_token?: string
}

// Pending Authorization (PKCE)
export interface PendingAuthorization {
    codeVerifier: string
    timestamp: number
}

// Rate Limiting Data
export interface RateLimitData {
    windowStart: number
    count: number
}

// OAuth token error response (from token endpoint on non-2xx)
export interface OAuthTokenError {
    error?: string
    error_description?: string
}
