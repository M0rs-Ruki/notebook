/**
 * HTTP request utility functions (axios-based)
 */

import axios, { AxiosError } from 'axios'
import type { HttpResponse, HttpRequestOptions } from '../types'

/**
 * Make HTTP request to backend API
 * Generic type parameter allows for properly typed responses
 */
export async function makeRequest<T = unknown>(
    url: string,
    options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
    try {
        const response = await axios({
            url,
            method: options.method || 'GET',
            headers: options.headers,
            data: options.body,
            validateStatus: () => true, // never throw; caller checks response.status
        })

        const data =
            typeof response.data === 'string'
                ? (() => {
                      try {
                          return JSON.parse(response.data) as T
                      } catch {
                          return response.data as T
                      }
                  })()
                : (response.data as T)

        return { status: response.status, data }
    } catch (err) {
        const axiosError = err as AxiosError
        if (axiosError.code === 'ECONNREFUSED') {
            throw new Error(`Connection refused to ${url}. Is the backend running?`)
        }
        throw err
    }
}
