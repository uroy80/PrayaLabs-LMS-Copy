/**
 * Application Configuration
 * Centralized configuration management for the Library Management System
 */

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_LIBRARY_API_URL: process.env.NEXT_PUBLIC_LIBRARY_API_URL,
} as const

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}\n` +
      "Please check your .env.local file and ensure all required variables are set.",
  )
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: requiredEnvVars.NEXT_PUBLIC_LIBRARY_API_URL!,
  ENDPOINTS: {
    // Authentication
    LOGIN: "/web/user/login",
    LOGOUT: "/web/user/logout",
    CURRENT_USER: "/web/user/current",

    // Books
    BOOKS: "/web/jsonapi/lmsbook/lmsbook",
    BOOK_DETAILS: "/web/lmsbook",
    BOOK_RESERVATION: "/web/entity/requestedlmsbook",

    // Authors
    AUTHORS: "/web/jsonapi/lmsbookauthor/lmsbookauthor",
    AUTHOR_DETAILS: "/web/lmsbookauthor",

    // Publications
    PUBLICATIONS: "/web/jsonapi/lmsbook/lmsbook",

    // Categories
    CATEGORIES: "/web/jsonapi/lmsbook/lmsbook/{book_uuid}/lmsbook_category",

    // User Data
    USER_PROFILE: "/web/user",
    BORROWED_BOOKS: "/web/borrowed",
    REQUESTED_BOOKS: "/web/requested",

    // Images
    FEATURED_IMAGE: "/web/jsonapi/lmsbook/lmsbook",
  },

  // Request configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const

/**
 * Application Configuration
 */
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || "Library Management System",
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Session configuration
  SESSION: {
    DURATION: 10 * 60 * 1000, // 10 minutes
    WARNING_TIME: 2 * 60 * 1000, // 2 minutes before expiry
    CHECK_INTERVAL: 30 * 1000, // Check every 30 seconds
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
  },

  // User limits
  USER_LIMITS: {
    MAX_BOOKS_ALLOWED: 4,
    MAX_CREDITS: 5,
    LOAN_DURATION_DAYS: 15,
  },
} as const

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_QR_CODES: true,
  ENABLE_CALENDAR_REMINDERS: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_OFFLINE_MODE: false,
} as const

/**
 * Helper function to build full API URLs
 */
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`
}

/**
 * Helper function to get API endpoint URLs
 */
export function getApiEndpoint(endpointKey: keyof typeof API_CONFIG.ENDPOINTS): string {
  return buildApiUrl(API_CONFIG.ENDPOINTS[endpointKey])
}

/**
 * Environment information
 */
export const ENV = {
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_CLIENT: typeof window !== "undefined",
  IS_SERVER: typeof window === "undefined",
} as const

/**
 * Debug configuration
 */
export const DEBUG = {
  ENABLED: ENV.IS_DEVELOPMENT,
  LOG_API_REQUESTS: ENV.IS_DEVELOPMENT,
  LOG_AUTH_EVENTS: ENV.IS_DEVELOPMENT,
  LOG_SESSION_EVENTS: ENV.IS_DEVELOPMENT,
} as const

// Log configuration on startup (development only)
if (DEBUG.ENABLED && ENV.IS_CLIENT) {
  console.log("CONFIG: Library App Configuration:", {
    API_BASE_URL: API_CONFIG.BASE_URL,
    APP_NAME: APP_CONFIG.NAME,
    APP_VERSION: APP_CONFIG.VERSION,
    ENVIRONMENT: process.env.NODE_ENV,
  })
}
