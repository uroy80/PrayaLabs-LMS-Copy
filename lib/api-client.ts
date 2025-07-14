/**
 * API Client Utilities
 * Centralized HTTP client with configuration and error handling
 */

import { API_CONFIG, DEBUG } from "./config"

export interface ApiRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.BASE_URL
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Library-PWA/1.0)",
    }
  }

  /**
   * Make an HTTP request with retry logic and timeout
   */
  async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      retryDelay = API_CONFIG.RETRY_DELAY,
      headers = {},
      ...fetchOptions
    } = options

    const url = this.buildUrl(endpoint)
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    if (DEBUG.LOG_API_REQUESTS) {
      console.log(`🔄 API Request: ${fetchOptions.method || "GET"} ${url}`)
    }

    let lastError: Error

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (DEBUG.LOG_API_REQUESTS) {
          console.log(`✅ API Response: ${response.status}`)
        }

        return data
      } catch (error) {
        lastError = error as Error

        if (DEBUG.LOG_API_REQUESTS) {
          console.warn(`❌ API Request failed (attempt ${attempt + 1}/${retries + 1}):`, error)
        }

        if (error.name === "AbortError" || (error as any).status === 401 || (error as any).status === 403) {
          break
        }

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    }

    throw lastError
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http")) {
      return endpoint
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
    return `${this.baseUrl}/${cleanEndpoint}`
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  /**
   * Set authorization header
   */
  setAuthHeader(token: string, type: "Bearer" | "Basic" = "Bearer"): void {
    this.defaultHeaders.Authorization = `${type} ${token}`
  }

  /**
   * Remove authorization header
   */
  removeAuthHeader(): void {
    delete this.defaultHeaders.Authorization
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Update base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl
    if (DEBUG.LOG_API_REQUESTS) {
      console.log(`🔧 API Base URL updated to: ${baseUrl}`)
    }
  }
}

export const apiClient = new ApiClient()
