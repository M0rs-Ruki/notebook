/**
 * HTTP-related type definitions
 */

// Generic HTTP response wrapper with proper typing
export interface HttpResponse<T = unknown> {
    status: number
    data: T
}

// HTTP request options
export interface HttpRequestOptions {
    method?: string
    headers?: Record<string, string>
    body?: string
}
