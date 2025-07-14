import { API_CONFIG, DEBUG } from "./config"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status?: number
  total?: number
}

interface GetBooksParams {
  limit?: number
  offset?: number
  search?: string
  category?: string
}

interface LoginRequest {
  name: string
  pass: string
}

interface LoginResponse {
  current_user: {
    uid: string
    name: string
  }
  csrf_token: string
  logout_token: string
}

interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  category?: string
  status: "available" | "borrowed" | "reserved"
  description?: string
  cover_image?: string
  publication_year?: number
  publisher?: string
  price?: string
  copies?: string
  total_issued_books?: string
  books_available?: number
  books_issued?: number
  featured_image?: string
  details?: string
  lmsbook_category?: string
  lmspublication?: string
  uid?: string[]
}

interface Author {
  id: string
  uuid: string
  title: string
  description: string
  created: string
}

interface Publication {
  id: string
  title: string
  description: string
}

interface Category {
  id: string
  title: string
  description: string
}

interface BooksApiResponse {
  book_title: string
  publication: string
  author: string
  category: string
  isbn_number: string
  no_of_copies: string
  price: string
  total_issued_books?: string
}

interface FeaturedImageResponse {
  data: {
    attributes: {
      drupal_internal__fid: number
      langcode: string
      filename: string
      uri: {
        value: string
        url: string
      }
    }
  }
}

interface BorrowedBookResponse {
  id: string
  lmsbook: string
  created: string
  requested_book_issued_date: string
  requested_book_returned_date: string
}

interface RequestedBookResponse {
  id: string
  lmsbook: string
  created: string
  requested_book_issued_date: string
  requested_book_returned_date: string
}

interface BorrowedBook {
  id: string
  title: string
  bookname: string
  requested_on: string
  issued_on: string
  returned_on: string
  due_date: string
  days_remaining: number
  status: "requested" | "issued" | "returned"
  is_overdue: boolean
}

interface RequestedBook {
  id: string
  title: string
  bookname: string
  requested_on: string
  issued_on: string
  returned_on: string
}

interface UserProfile {
  uid: string
  uuid: string
  name: string
  email: string
  timezone: string
  created: string
  changed: string
  borrowed_books_count: number
  requested_books_count: number
  credits: number
  max_credits: number
  max_books_allowed: number
  can_borrow_more: boolean
}

interface UserProfileResponse {
  uid: Array<{ value: number }>
  uuid: Array<{ value: string }>
  name: Array<{ value: string }>
  mail: Array<{ value: string }>
  timezone: Array<{ value: string }>
  created: Array<{ value: string; format: string }>
  changed: Array<{ value: string; format: string }>
}

interface Reservation {
  id: string
  book_id: string
  book_title: string
  book_author: string
  reserved_at: string
  expires_at: string
  status: "active" | "expired" | "collected"
}

interface ApiError {
  message: string
  status: number
}

const isBrowser = typeof window !== "undefined"

class LibraryAPI {
  private baseUrl = API_CONFIG.BASE_URL
  private useProxy = true
  private csrfToken: string | null = null
  private logoutToken: string | null = null
  private username: string | null = null
  private password: string | null = null
  private sessionId: string | null = null
  private authorsCache: Map<string, Author> = new Map()
  private publicationsCache: Map<string, Publication> = new Map()
  private categoriesCache: Map<string, Category> = new Map()
  private imageCache: Map<string, string> = new Map()
  private secondaryBooksCache: Map<string, any> = new Map()
  private authorsLoaded = false
  private publicationsLoaded = false
  private categoriesLoaded = false
  private user: { uid: string; name: string } | null = null

  constructor() {
    if (isBrowser) {
      this.csrfToken = localStorage.getItem("library_csrf_token")
      this.logoutToken = localStorage.getItem("library_logout_token")
      this.sessionId = localStorage.getItem("library_session_id")
    }
  }

  private async makeProxyRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (DEBUG.LOG_API_REQUESTS) {
      console.log(`REQUEST: Making proxy request to ${endpoint}`, options.method || "GET")
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      if (options.method === "POST" && this.csrfToken) {
        headers["X-CSRF-Token"] = this.csrfToken
        console.log("AUTH: Adding CSRF token to POST request headers")
      }

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: options.method || "GET",
          headers,
          data: options.body ? JSON.parse(options.body as string) : undefined,
        }),
      })

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status)
      }

      const result = await response.json()
      console.log(`RESPONSE: Proxy response for ${endpoint}:`, {
        status: result.status,
        success: result.success,
        hasData: !!result.data,
      })

      if (!result.success) {
        // Handle different types of error responses
        let errorMessage = "Unknown error"

        if (result.data && typeof result.data === "object" && result.data.error) {
          errorMessage = result.data.error
        } else if (result.data && typeof result.data === "object" && result.data.raw_response) {
          // Handle HTML error responses
          const htmlResponse = result.data.raw_response
          if (htmlResponse.includes("<title>")) {
            const titleMatch = htmlResponse.match(/<title>(.*?)<\/title>/i)
            errorMessage = titleMatch ? titleMatch[1] : "Server error"
          } else {
            errorMessage = "Invalid response format"
          }
        } else if (result.error) {
          errorMessage = result.error
        } else if (result.details) {
          errorMessage = result.details
        }

        // Special handling for login endpoint
        if (endpoint.includes("/user/login")) {
          if (result.status === 400 || result.status === 401 || result.status === 403) {
            throw new ApiError("Invalid Credentials!!", result.status)
          } else if (result.status === 404) {
            throw new ApiError("Login endpoint not found. Please check the API URL.", result.status)
          }
        }

        const apiError = new ApiError(errorMessage, result.status || 500)

        if (
          result.status === 404 &&
          (endpoint.includes("/lmsbookauthor/") ||
            endpoint.includes("/lmspublication") ||
            endpoint.includes("/taxonomy_term/"))
        ) {
          console.log(`INFO: Resource not found (404): ${endpoint}`)
        } else {
          console.error(`ERROR: API Error for ${endpoint}:`, errorMessage)
        }

        throw apiError
      }

      if (result.data) {
        console.log("DATA: Response data received successfully")
      }

      return result.data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      console.error(`ERROR: Proxy request error for ${endpoint}:`, error)
      throw new ApiError(`Request failed: ${error.message}`, 500)
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<ApiResponse> {
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: options.method || "GET",
          headers: options.headers || {},
          data: options.body ? JSON.parse(options.body as string) : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("API request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async loadSecondaryBooksData(): Promise<void> {
    try {
      console.log("BOOKS: Loading secondary books data with copies and issued_count...")

      const secondaryBooksData = await this.makeProxyRequest(API_CONFIG.ENDPOINTS.BOOKS, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (secondaryBooksData && secondaryBooksData.data && Array.isArray(secondaryBooksData.data)) {
        console.log(`SUCCESS: Found ${secondaryBooksData.data.length} books from secondary API`)

        for (const bookData of secondaryBooksData.data) {
          if (bookData.id && bookData.attributes) {
            this.secondaryBooksCache.set(bookData.id, bookData.attributes)

            console.log(
              `DATA: Cached book "${bookData.attributes.title}": copies=${bookData.attributes.copies}, issued_count=${bookData.attributes.issued_count}`,
            )
          }
        }

        console.log(`SUCCESS: Cached ${this.secondaryBooksCache.size} books from secondary API`)
      } else {
        console.warn("WARNING: No data found in secondary API response")
      }
    } catch (error) {
      console.warn("WARNING: Failed to load secondary books data:", error.message)
    }
  }

  async getFeaturedImage(bookId: string): Promise<string | null> {
    try {
      if (this.imageCache.has(bookId)) {
        const cachedUrl = this.imageCache.get(bookId)
        console.log(`IMAGE: Using cached image for book ${bookId}: ${cachedUrl}`)
        return cachedUrl
      }

      console.log(`LOADING: Fetching featured image for book ID: ${bookId}`)

      const imageData = await this.makeProxyRequest(`${API_CONFIG.ENDPOINTS.FEATURED_IMAGE}/${bookId}/featured_image`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (imageData && imageData.data && imageData.data.attributes && imageData.data.attributes.uri) {
        const imageUrl = imageData.data.attributes.uri.url
        if (imageUrl) {
          const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${this.baseUrl}${imageUrl}`
          this.imageCache.set(bookId, fullImageUrl)
          console.log(`SUCCESS: Found featured image for book ${bookId}: ${fullImageUrl}`)
          return fullImageUrl
        }
      }

      console.log(`INFO: No featured image found for book ${bookId}`)
      return null
    } catch (error) {
      if (error.status === 404) {
        console.log(`INFO: Featured image not found for book ${bookId} (404)`)
      } else {
        console.warn(`WARNING: Error fetching featured image for book ${bookId}:`, error.message)
      }
      return null
    }
  }

  async loadFeaturedImages(bookIds: string[]): Promise<void> {
    console.log(`IMAGE: Loading featured images for ${bookIds.length} books...`)

    const imagePromises = bookIds.map(async (bookId) => {
      try {
        await this.getFeaturedImage(bookId)
      } catch (error) {
        console.warn(`Failed to load image for book ${bookId}:`, error.message)
      }
    })

    await Promise.allSettled(imagePromises)
    console.log(`SUCCESS: Finished loading featured images. Cache size: ${this.imageCache.size}`)
  }

  async login(username: string, password: string, sessionId: string): Promise<LoginResponse> {
    try {
      console.log("AUTH: Attempting login with credentials:", { username })

      const loginData: LoginRequest = {
        name: username,
        pass: password,
      }

      const data = await this.makeProxyRequest(`${API_CONFIG.ENDPOINTS.LOGIN}?_format=json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      })

      if (!data.current_user?.uid || !data.current_user?.name || !data.csrf_token) {
        throw new ApiError("Invalid login response", 400)
      }

      this.user = {
        uid: String(data.current_user.uid),
        name: data.current_user.name,
      }
      this.csrfToken = data.csrf_token
      this.logoutToken = data.logout_token
      this.username = username
      this.password = password
      this.sessionId = sessionId

      if (isBrowser) {
        localStorage.setItem("library_csrf_token", data.csrf_token)
        if (data.logout_token) {
          localStorage.setItem("library_logout_token", data.logout_token)
        }
        localStorage.setItem("library_session_id", sessionId)
      }

      console.log("SUCCESS: Login successful:", {
        uid: this.user.uid,
        name: this.user.name,
      })

      return data
    } catch (error) {
      console.error("ERROR: Login error:", error)

      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403 || error.status === 400) {
          throw new ApiError("Invalid Credentials!!", error.status)
        }
        throw error
      }

      throw new ApiError(`Login failed: ${error.message}`, 0)
    }
  }

  async logout(sessionId?: string): Promise<void> {
    this.user = null
    this.csrfToken = null
    this.logoutToken = null
    this.username = null
    this.password = null
    this.sessionId = null

    this.authorsCache.clear()
    this.publicationsCache.clear()
    this.categoriesCache.clear()
    this.imageCache.clear()
    this.secondaryBooksCache.clear()
    this.authorsLoaded = false
    this.publicationsLoaded = false
    this.categoriesLoaded = false

    if (isBrowser) {
      localStorage.removeItem("library_csrf_token")
      localStorage.removeItem("library_logout_token")
      localStorage.removeItem("library_session_id")
      localStorage.removeItem("library_user")
    }

    console.log("CLEANUP: Logout cleanup completed")
  }

  async verifySession(sessionId: string): Promise<boolean> {
    try {
      if (!this.csrfToken) {
        console.log("ERROR: No CSRF token available for session verification")
        return false
      }

      console.log("SUCCESS: Session verification: CSRF token exists")
      return true
    } catch (error) {
      console.warn("WARNING: Session verification failed:", error)
      return false
    }
  }

  private async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.csrfToken) {
      throw new ApiError("Not authenticated - missing CSRF token", 401)
    }

    if (!this.username || !this.password) {
      throw new ApiError("Not authenticated - missing credentials", 401)
    }

    const basicAuth = btoa(`${this.username}:${this.password}`)

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": this.csrfToken,
      Authorization: `Basic ${basicAuth}`,
      ...options.headers,
    }

    console.log(`AUTH: Making authenticated request to ${endpoint} with CSRF token`)

    try {
      const response = await this.makeProxyRequest(endpoint, {
        ...options,
        headers,
      })
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          throw new ApiError("Session expired. Please login again.", 401)
        } else if (error.status === 404) {
          throw new ApiError(`Endpoint not found: ${endpoint}`, 404)
        }
      }
      throw error
    }
  }

  private parseAuthorData(authorData: any): Author {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    let id = ""
    if (authorData.id && Array.isArray(authorData.id)) {
      id = String(authorData.id[0].value || "")
    } else {
      id = String(authorData.id || "")
    }

    return {
      id: id,
      uuid: getValue(authorData.uuid),
      title: getValue(authorData.title),
      description: getProcessedValue(authorData.text_long),
      created: getValue(authorData.created),
    }
  }

  private parsePublicationData(publicationData: any): Publication {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    if (publicationData.attributes) {
      return {
        id: String(publicationData.attributes.drupal_internal__id || publicationData.id || ""),
        title: publicationData.attributes.title || "Unknown Publisher",
        description:
          publicationData.attributes.text_long?.processed || publicationData.attributes.text_long?.value || "",
      }
    }

    let id = ""
    if (publicationData.id && Array.isArray(publicationData.id)) {
      id = String(publicationData.id[0].value || "")
    } else {
      id = String(publicationData.id || "")
    }

    return {
      id: id,
      title: getValue(publicationData.title) || "Unknown Publisher",
      description: getProcessedValue(publicationData.text_long),
    }
  }

  private parseCategoryData(categoryData: any): Category {
    // Handle the new API response format
    if (categoryData.attributes) {
      return {
        id: String(categoryData.attributes.drupal_internal__tid || categoryData.id || ""),
        title: categoryData.attributes.name || "NULL", // Use "name" field, fallback to "NULL"
        description: categoryData.attributes.description || "",
      }
    }

    // Fallback for old format
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    let id = ""
    if (categoryData.id && Array.isArray(categoryData.id)) {
      id = String(categoryData.id[0].value || "")
    } else {
      id = String(categoryData.id || "")
    }

    return {
      id: id,
      title: getValue(categoryData.title) || getValue(categoryData.name) || "NULL",
      description: getProcessedValue(categoryData.text_long) || getProcessedValue(categoryData.description),
    }
  }

  async getAuthor(authorId: string): Promise<Author> {
    try {
      console.log(`LOADING: Fetching author details for ID: ${authorId}`)

      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      const basicAuth = btoa(`${this.username}:${this.password}`)

      try {
        const authorData = await this.makeProxyRequest(
          `${API_CONFIG.ENDPOINTS.AUTHOR_DETAILS}/${authorId}?_format=json`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Basic ${basicAuth}`,
            },
          },
        )

        return this.parseAuthorData(authorData)
      } catch (standardEndpointError) {
        console.log(`WARNING: Standard author endpoint failed for ID ${authorId}, trying JSON API endpoint...`)

        const jsonApiResponse = await this.makeProxyRequest(`${API_CONFIG.ENDPOINTS.AUTHORS}/${authorId}`, {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
            Authorization: `Basic ${basicAuth}`,
          },
        })

        if (jsonApiResponse && jsonApiResponse.data) {
          const authorData = jsonApiResponse.data
          return {
            id: authorId,
            uuid: authorData.id || "",
            title: authorData.attributes?.title || "Unknown Author",
            description: authorData.attributes?.text_long?.processed || "",
            created: authorData.attributes?.created || "",
          }
        } else {
          throw new ApiError("Author data not found in JSON API response", 404)
        }
      }
    } catch (error) {
      throw new ApiError(`Failed to fetch author details: ${error.message}`, error.status || 500)
    }
  }

  private async loadAuthors(): Promise<void> {
    if (this.authorsLoaded) return

    try {
      console.log("BOOKS: Loading authors data using Basic Auth...")

      if (!this.username || !this.password) {
        console.log("ERROR: Authentication required for author data")
        this.authorsLoaded = true
        return
      }

      const basicAuth = btoa(`${this.username}:${this.password}`)
      const testAuthorIds = ["7", "8", "13", "1", "2", "3", "4", "5", "6", "9", "10", "11", "12", "14", "15"]

      let successCount = 0
      let errorCount = 0

      try {
        console.log("LOADING: Fetching all authors via JSON API endpoint")

        const authorsResponse = await this.makeProxyRequest(API_CONFIG.ENDPOINTS.AUTHORS, {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
            Authorization: `Basic ${basicAuth}`,
          },
        })

        if (authorsResponse && authorsResponse.data && Array.isArray(authorsResponse.data)) {
          console.log(`SUCCESS: Found ${authorsResponse.data.length} authors via JSON API`)

          for (const authorData of authorsResponse.data) {
            const author = {
              id: String(authorData.attributes?.drupal_internal__id || ""),
              uuid: authorData.id || "",
              title: authorData.attributes?.title || "Unknown Author",
              description: authorData.attributes?.text_long?.processed || "",
              created: authorData.attributes?.created || "",
            }

            if (author.id) {
              this.authorsCache.set(author.id, author)
              successCount++
            }
          }
        }
      } catch (jsonApiError) {
        console.warn("WARNING: JSON API author endpoint failed, falling back to individual author requests")
      }

      if (successCount === 0) {
        for (const authorId of testAuthorIds) {
          try {
            console.log(`LOADING: Fetching author ID: ${authorId}`)

            const authorData = await this.makeProxyRequest(
              `${API_CONFIG.ENDPOINTS.AUTHOR_DETAILS}/${authorId}?_format=json`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization: `Basic ${basicAuth}`,
                },
              },
            )

            if (authorData) {
              const author = this.parseAuthorData(authorData)
              this.authorsCache.set(String(authorId), author)
              console.log(`SUCCESS: Loaded author: "${author.title}" (ID: ${authorId})`)
              successCount++
            }
          } catch (error) {
            errorCount++
            if (error.status === 404) {
              console.log(`INFO: Author ID ${authorId} not found (404) - skipping`)
            } else {
              console.warn(`WARNING: Error fetching author ${authorId}:`, error.message)
            }
            continue
          }
        }
      }

      this.authorsLoaded = true
      console.log(`SUCCESS: Author loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`LIST: Total cached authors: ${this.authorsCache.size}`)

      if (this.authorsCache.size > 0) {
        console.log("LIST: Successfully cached authors:")
        this.authorsCache.forEach((author, id) => {
          console.log(`  - ID ${id}: "${author.title}"`)
        })
      } else {
        console.log("WARNING: No authors were successfully loaded")
      }
    } catch (error) {
      console.error("ERROR: Failed to load authors data:", error)
      this.authorsLoaded = true
    }
  }

  private async loadPublications(bookUuids: string[]): Promise<void> {
    if (this.publicationsLoaded || bookUuids.length === 0) return

    try {
      console.log("PUBLICATION: Loading publications data...")

      let successCount = 0
      let errorCount = 0

      for (const bookUuid of bookUuids) {
        try {
          console.log(`LOADING: Fetching publication for book UUID: ${bookUuid}`)

          const publicationData = await this.makeProxyRequest(
            `${API_CONFIG.ENDPOINTS.PUBLICATIONS}/${bookUuid}/lmspublication`,
            {
              method: "GET",
              headers: {
                Accept: "application/vnd.api+json",
              },
            },
          )

          if (publicationData && publicationData.data) {
            const publication = this.parsePublicationData(publicationData.data)
            this.publicationsCache.set(String(publication.id), publication)
            console.log(`SUCCESS: Loaded publication: "${publication.title}" (ID: ${publication.id})`)
            successCount++
          }
        } catch (error) {
          errorCount++
          if (error.status === 404) {
            console.log(`INFO: Publication for book ${bookUuid} not found (404) - skipping`)
          } else {
            console.warn(`WARNING: Error fetching publication for book ${bookUuid}:`, error.message)
          }
          continue
        }
      }

      this.publicationsLoaded = true
      console.log(`SUCCESS: Publication loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`LIST: Total cached publications: ${this.publicationsCache.size}`)

      if (this.publicationsCache.size > 0) {
        console.log("LIST: Successfully cached publications:")
        this.publicationsCache.forEach((publication, id) => {
          console.log(`  - ID ${id}: "${publication.title}"`)
        })
      } else {
        console.log("WARNING: No publications were successfully loaded")
      }
    } catch (error) {
      console.error("ERROR: Failed to load publications data:", error)
      this.publicationsLoaded = true
    }
  }

  private async loadCategories(bookUuids: string[]): Promise<void> {
    if (this.categoriesLoaded || bookUuids.length === 0) return

    try {
      console.log("CATEGORY: Loading categories data...")

      let successCount = 0
      let errorCount = 0

      for (const bookUuid of bookUuids) {
        try {
          console.log(`LOADING: Fetching category for book UUID: ${bookUuid}`)

          const categoryData = await this.makeProxyRequest(
            `/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmsbook_category`,
            {
              method: "GET",
              headers: {
                Accept: "application/vnd.api+json",
              },
            },
          )

          if (categoryData && categoryData.data) {
            const category = this.parseCategoryData(categoryData.data)
            this.categoriesCache.set(String(category.id), category)
            console.log(`SUCCESS: Loaded category: "${category.title}" (ID: ${category.id})`)
            successCount++
          } else {
            console.log(`INFO: Category for book ${bookUuid} returned null data - skipping`)
          }
        } catch (error) {
          errorCount++
          if (error.status === 404) {
            console.log(`INFO: Category for book ${bookUuid} not found (404) - skipping`)
          } else {
            console.warn(`WARNING: Error fetching category for book ${bookUuid}:`, error.message)
          }
          continue
        }
      }

      this.categoriesLoaded = true
      console.log(`SUCCESS: Category loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`LIST: Total cached categories: ${this.categoriesCache.size}`)

      if (this.categoriesCache.size > 0) {
        console.log("LIST: Successfully cached categories:")
        this.categoriesCache.forEach((category, id) => {
          console.log(`  - ID ${id}: "${category.title}"`)
        })
      } else {
        console.log("WARNING: No categories were successfully loaded")
      }
    } catch (error) {
      console.error("ERROR: Failed to load categories data:", error)
      this.categoriesLoaded = true
    }
  }

  private transformDrupalBookData(drupalBook: any): Book {
    const bookData = drupalBook
    const attributes = drupalBook.attributes || drupalBook
    const relationships = drupalBook.relationships || {}

    const getValue = (field: any) => {
      if (!field) return ""
      if (Array.isArray(field) && field.length > 0) {
        return field[0].value || field[0].target_id || field[0]
      }
      if (field.value !== undefined) return field.value
      return field
    }

    const getAuthorIds = (book: any): string[] => {
      try {
        if (book.relationships?.uid?.data && Array.isArray(book.relationships.uid.data)) {
          const authorIds = book.relationships.uid.data
            .map((author: any) => String(author.meta?.drupal_internal__target_id || ""))
            .filter((id) => id !== "")

          console.log(`BOOKS: Extracted author IDs from relationships:`, authorIds)
          return authorIds
        }

        if (book.uid && Array.isArray(book.uid)) {
          return book.uid.map((item: any) => String(item.target_id || item.value || item)).filter(Boolean)
        }

        console.log(`WARNING: No author IDs found in book structure`)
        return []
      } catch (error) {
        console.warn("WARNING: Error extracting author IDs:", error)
        return []
      }
    }

    const getPublicationId = (book: any): string => {
      try {
        if (book.relationships?.lmspublication?.data?.meta?.drupal_internal__target_id) {
          return String(book.relationships.lmspublication.data.meta.drupal_internal__target_id)
        }
        return ""
      } catch (error) {
        console.warn("WARNING: Error extracting publication ID:", error)
        return ""
      }
    }

    const id = bookData.id || attributes?.id || attributes?.nid || String(Math.random())
    const title = getValue(attributes.title) || "Unknown Title"

    let totalCopies = 0
    let issuedCount = 0
    let availableBooks = 0

    const secondaryData = this.secondaryBooksCache.get(String(id))
    if (secondaryData) {
      totalCopies = Number(secondaryData.copies) || 0
      issuedCount = Number(secondaryData.issued_count) || 0
      availableBooks = Math.max(0, totalCopies - issuedCount)

      console.log(
        `DATA: Book "${title}" (from secondary API): Total copies: ${totalCopies}, Issued: ${issuedCount}, Available: ${availableBooks}`,
      )
    } else {
      totalCopies = Number(getValue(attributes.copies)) || 1
      issuedCount = 0
      availableBooks = totalCopies

      console.log(
        `DATA: Book "${title}" (fallback to primary API): Total copies: ${totalCopies}, Issued: ${issuedCount}, Available: ${availableBooks}`,
      )
    }

    const status = availableBooks > 0 ? "available" : "borrowed"

    const publicationId = getPublicationId(bookData)
    let publisher = "Unknown Publisher"

    if (publicationId) {
      const publicationData = this.publicationsCache.get(publicationId)
      if (publicationData && publicationData.title) {
        publisher = publicationData.title
        console.log(`SUCCESS: Found publisher for book "${title}": ${publisher} (ID: ${publicationId})`)
      } else {
        console.log(`WARNING: Publication ID ${publicationId} not found in cache for book "${title}"`)
        this.fetchMissingPublication(bookData.id, publicationId).catch((err) =>
          console.warn(`Failed to fetch missing publication ${publicationId}:`, err.message),
        )
      }
    }

    const getCategoryId = (book: any): string => {
      try {
        if (book.relationships?.lmsbook_category?.data?.meta?.drupal_internal__target_id) {
          return String(book.relationships.lmsbook_category.data.meta.drupal_internal__target_id)
        }

        return ""
      } catch (error) {
        console.warn("WARNING: Error extracting category ID:", error)
        return ""
      }
    }

    const categoryId = getCategoryId(bookData)
    let category = "" // Default to empty string

    if (categoryId) {
      const categoryData = this.categoriesCache.get(categoryId)
      if (categoryData && categoryData.title && categoryData.title !== "NULL" && categoryData.title !== "") {
        category = categoryData.title
        console.log(`SUCCESS: Found category for book "${title}": ${category} (ID: ${categoryId})`)
      } else {
        console.log(`WARNING: Category ID ${categoryId} not found in cache for book "${title}"`)
        this.fetchMissingCategory(bookData.id, categoryId).catch((err) =>
          console.warn(`Failed to fetch missing category ${categoryId}:`, err.message),
        )
      }
    } else {
      console.log(`INFO: No category found for book "${title}", keeping blank`)
    }

    let description = ""
    try {
      if (attributes.details?.processed) {
        description = attributes.details.processed
      } else if (attributes.details?.value) {
        description = attributes.details.value
      } else {
        description = getValue(attributes.details) || ""
      }
    } catch (error) {
      console.warn("WARNING: Error extracting description:", error)
    }

    const price = getValue(attributes.price) || ""
    const isbn = getValue(attributes.isbn) || ""

    const authorIds = getAuthorIds(bookData)
    console.log(`BOOKS: Book "${title}" has author IDs:`, authorIds)

    let author = "Unknown Author"

    if (authorIds.length > 0) {
      const authorNames: string[] = []

      for (const authorId of authorIds) {
        const authorData = this.authorsCache.get(authorId)
        if (authorData && authorData.title) {
          authorNames.push(authorData.title)
          console.log(`SUCCESS: Found author for book "${title}": ${authorData.title} (ID: ${authorId})`)
        } else {
          console.log(`WARNING: Author ID ${authorId} not found in cache for book "${title}"`)
          this.fetchMissingAuthor(authorId).catch((err) =>
            console.warn(`Failed to fetch missing author ${authorId}:`, err.message),
          )
        }
      }

      if (authorNames.length > 0) {
        author = authorNames.join(", ")
      }
    }

    const cachedImageUrl = this.imageCache.get(String(id))

    const transformedBook: Book = {
      id: String(id),
      title,
      author,
      isbn,
      category,
      status: status,
      description: description,
      cover_image: cachedImageUrl || "",
      publisher,
      price,
      copies: String(totalCopies),
      books_available: availableBooks,
      books_issued: issuedCount,
      featured_image: cachedImageUrl || "",
      details: description,
      lmsbook_category: category,
      lmspublication: publisher,
      uid: authorIds,
    }

    return transformedBook
  }

  private async fetchMissingAuthor(authorId: string): Promise<void> {
    if (this.authorsCache.has(authorId)) return

    try {
      if (!this.username || !this.password) {
        console.log(`WARNING: Cannot fetch author ${authorId}: no authentication`)
        return
      }

      console.log(`LOADING: Fetching missing author ID: ${authorId}`)
      const basicAuth = btoa(`${this.username}:${this.password}`)

      const authorData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.AUTHOR_DETAILS}/${authorId}?_format=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
        },
      )

      if (authorData) {
        const author = this.parseAuthorData(authorData)
        this.authorsCache.set(String(authorId), author)
        console.log(`SUCCESS: Fetched missing author: "${author.title}" (ID: ${authorId})`)
      }
    } catch (error) {
      console.warn(`WARNING: Failed to fetch missing author ${authorId}:`, error.message)
    }
  }

  private async fetchMissingPublication(bookUuid: string, publicationId: string): Promise<void> {
    if (this.publicationsCache.has(publicationId)) return

    try {
      console.log(`LOADING: Fetching missing publication for book UUID: ${bookUuid}`)

      const publicationData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.PUBLICATIONS}/${bookUuid}/lmspublication`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        },
      )

      if (publicationData && publicationData.data) {
        const publication = this.parsePublicationData(publicationData.data)
        this.publicationsCache.set(String(publication.id), publication)
        console.log(`SUCCESS: Fetched missing publication: "${publication.title}" (ID: ${publication.id})`)
      }
    } catch (error) {
      console.warn(`WARNING: Failed to fetch missing publication for book ${bookUuid}:`, error.message)
    }
  }

  private async fetchMissingCategory(bookUuid: string, categoryId: string): Promise<void> {
    if (this.categoriesCache.has(categoryId)) return

    try {
      console.log(`LOADING: Fetching missing category for book UUID: ${bookUuid}`)

      const categoryData = await this.makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmsbook_category`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (categoryData && categoryData.data) {
        const category = this.parseCategoryData(categoryData.data)
        this.categoriesCache.set(String(categoryId), category)
        console.log(`SUCCESS: Fetched missing category: "${category.title}" (ID: ${category.id})`)
      }
    } catch (error) {
      console.warn(`WARNING: Failed to fetch missing category for book ${bookUuid}:`, error.message)
    }
  }

  private parseUserProfileData(profileData: UserProfileResponse): UserProfile {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    return {
      uid: String(getValue(profileData.uid)),
      uuid: getValue(profileData.uuid),
      name: getValue(profileData.name),
      email: getValue(profileData.mail),
      timezone: getValue(profileData.timezone),
      created: getValue(profileData.created),
      changed: getValue(profileData.changed),
      borrowed_books_count: 0,
      requested_books_count: 0,
      credits: 5,
      max_credits: 5,
      max_books_allowed: 4,
      can_borrow_more: true,
    }
  }

  private parseBorrowedBooksData(borrowedData: BorrowedBookResponse[]): BorrowedBook[] {
    return borrowedData.map((book) => {
      const cleanCreatedDate = book.created ? book.created.replace(/<[^>]*>/g, "").trim() : ""
      const bookName = book.lmsbook || "Unknown Book"
      const issuedDate = book.requested_book_issued_date || ""
      const returnedDate = book.requested_book_returned_date || ""

      let status: "requested" | "issued" | "returned" = "requested"
      if (returnedDate && returnedDate !== "Not returned yet." && returnedDate.trim() !== "") {
        status = "returned"
      } else if (issuedDate && issuedDate.trim() !== "") {
        status = "issued"
      }

      let dueDate = ""
      let daysRemaining = 0
      let isOverdue = false

      if (status === "issued" && issuedDate) {
        try {
          const issueDate = new Date(issuedDate)
          const dueDateObj = new Date(issueDate)
          dueDateObj.setDate(dueDateObj.getDate() + 15)

          dueDate = dueDateObj.toISOString().split("T")[0]

          const today = new Date()
          const timeDiff = dueDateObj.getTime() - today.getTime()
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))

          isOverdue = daysRemaining < 0

          console.log(
            `DATE: Book "${bookName}": Issued ${issuedDate}, Due ${dueDate}, Days remaining: ${daysRemaining}, Overdue: ${isOverdue}`,
          )
        } catch (error) {
          console.warn(`WARNING: Error calculating due date for book "${bookName}":`, error)
        }
      }

      return {
        id: book.id,
        title: bookName,
        bookname: bookName,
        requested_on: cleanCreatedDate,
        issued_on: issuedDate,
        returned_on: returnedDate,
        due_date: dueDate,
        days_remaining: daysRemaining,
        status: status,
        is_overdue: isOverdue,
      }
    })
  }

  private parseRequestedBooksData(requestedData: RequestedBookResponse[]): RequestedBook[] {
    return requestedData.map((book) => {
      const cleanCreatedDate = book.created ? book.created.replace(/<[^>]*>/g, "").trim() : ""
      const bookName = book.lmsbook || "Unknown Book"
      const issuedDate = book.requested_book_issued_date || ""
      const returnedDate = book.requested_book_returned_date || ""

      return {
        id: book.id,
        title: bookName,
        bookname: bookName,
        requested_on: cleanCreatedDate,
        issued_on: issuedDate,
        returned_on: returnedDate,
      }
    })
  }

  async getBooks(params?: {
    search?: string
    searchField?: "title" | "author" | "isbn" | "all"
    category?: string
    author?: string
    page?: number
    limit?: number
    offset?: number
  }): Promise<Book[]> {
    console.log("getBooks called with params:", params)

    try {
      try {
        await this.loadSecondaryBooksData()
      } catch (secondaryError) {
        console.warn(
          "WARNING: Secondary books data loading failed, continuing with basic data:",
          secondaryError.message,
        )
      }

      try {
        await this.loadAuthors()
      } catch (authorError) {
        console.warn("WARNING: Author loading failed, continuing with basic book data:", authorError.message)
      }

      let endpoint = API_CONFIG.ENDPOINTS.BOOKS

      const fields = "title,uid,isbn,lmsbook_category,lmspublication,copies,price,details,featured_image,author"
      const queryParams = new URLSearchParams()

      queryParams.append("fields[lmsbook--lmsbook]", fields)

      if (params?.limit) {
        queryParams.append("page[limit]", params.limit.toString())
      } else {
        queryParams.append("page[limit]", "12")
      }

      if (params?.offset) {
        queryParams.append("page[offset]", params.offset.toString())
      }

      if (params?.search) {
        console.log("LOADING: Search term provided:", params.search)
      }

      endpoint += `?${queryParams.toString()}`

      console.log(`LOADING: Fetching from JSON API endpoint: ${endpoint}`)

      const result = await this.makeProxyRequest(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      const bookUuids = result.data?.map((book: any) => book.id).filter(Boolean) || []

      try {
        await this.loadPublications(bookUuids.slice(0, 10))
      } catch (publicationError) {
        console.warn("WARNING: Publication loading failed, continuing with basic book data:", publicationError.message)
      }

      try {
        await this.loadCategories(bookUuids.slice(0, 10))
      } catch (categoryError) {
        console.warn("WARNING: Category loading failed, continuing with basic book data:", categoryError.message)
      }

      try {
        const bookIds = result.data?.map((book: any) => book.id).filter(Boolean) || []
        await this.loadFeaturedImages(bookIds)
      } catch (imageError) {
        console.warn("WARNING: Image loading failed, continuing without images:", imageError.message)
      }

      const books = this.processJsonApiResponse(result, params)
      console.log(`SUCCESS: Processed ${books.length} books successfully for page ${params?.page || 1}`)

      return books
    } catch (error) {
      console.error("ERROR: Books API error:", error)
      throw new ApiError(`Failed to fetch books: ${error.message}`, error.status || 500)
    }
  }

  private processJsonApiResponse(result: any, params?: any): Book[] {
    if (!result.data || !Array.isArray(result.data)) {
      console.log("ERROR: No data array found in response")
      return []
    }

    const booksData = result.data
    console.log(`BOOKS: Processing ${booksData.length} books from JSON API`)

    const transformedBooks: Book[] = booksData.map((book: any) => {
      console.log(`LOADING: Processing book:`, book.attributes?.title, `with relationships:`, !!book.relationships?.uid)
      return this.transformDrupalBookData(book)
    })

    let filteredBooks = transformedBooks

    if (params?.search) {
      const searchTerm = params.search.toLowerCase()
      const searchField = params.searchField || "all"

      filteredBooks = filteredBooks.filter((book) => {
        const title = book.title.toLowerCase()
        const isbn = book.isbn?.toLowerCase() || ""
        const author = book.author.toLowerCase()

        switch (searchField) {
          case "title":
            return title.includes(searchTerm)
          case "author":
            return author.includes(searchTerm)
          case "isbn":
            return isbn.includes(searchTerm)
          case "all":
          default:
            return title.includes(searchTerm) || isbn.includes(searchTerm) || author.includes(searchTerm)
        }
      })
    }

    if (params?.category && params.category !== "all") {
      filteredBooks = filteredBooks.filter((book) => {
        // Handle both exact match and case-insensitive match
        const bookCategory = book.category || ""
        const searchCategory = params.category || ""

        // Skip books with NULL or empty categories when filtering by specific category
        if (bookCategory === "NULL" || bookCategory === "") {
          return false
        }

        return bookCategory.toLowerCase() === searchCategory.toLowerCase()
      })
    }

    if (params?.author) {
      const authorTerm = params.author.toLowerCase()
      filteredBooks = filteredBooks.filter((book) => book.author.toLowerCase().includes(authorTerm))
    }

    return filteredBooks
  }

  async getPublication(bookUuid: string): Promise<Publication> {
    try {
      console.log(`LOADING: Fetching publication details for book UUID: ${bookUuid}`)

      const publicationData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.PUBLICATIONS}/${bookUuid}/lmspublication`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        },
      )

      if (!publicationData || !publicationData.data) {
        throw new ApiError("No publication data found", 404)
      }

      return this.parsePublicationData(publicationData.data)
    } catch (error) {
      throw new ApiError(`Failed to fetch publication details: ${error.message}`, error.status || 500)
    }
  }

  async getAuthors(): Promise<Author[]> {
    await this.loadAuthors()
    return Array.from(this.authorsCache.values())
  }

  async getPublications(): Promise<Publication[]> {
    return Array.from(this.publicationsCache.values())
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesCache.values())
  }

  async getBookDetails(bookId: string): Promise<Book> {
    try {
      console.log(`LOADING: Fetching book details for ID: ${bookId}`)

      await this.loadAuthors()

      const result = await this.makeAuthenticatedRequest(`${API_CONFIG.ENDPOINTS.BOOK_DETAILS}/${bookId}?_format=json`)
      return this.transformDrupalBookData(result)
    } catch (error) {
      throw new ApiError(`Failed to fetch book details: ${error.message}`, error.status || 500)
    }
  }

  async reserveBook(bookId: string): Promise<{
    success: boolean
    message: string
    reservation?: Reservation
  }> {
    try {
      console.log(`LOADING: Starting book reservation for book ID: ${bookId}`)

      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      if (!this.user?.uid) {
        throw new ApiError("User ID not available", 401)
      }

      if (!this.csrfToken) {
        throw new ApiError("CSRF token not available", 401)
      }

      console.log(`BOOKS: Fetching book details from JSON API for ID: ${bookId}`)

      const bookDetailsResponse = await this.makeProxyRequest(`${API_CONFIG.ENDPOINTS.BOOKS}/${bookId}`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (!bookDetailsResponse || !bookDetailsResponse.data || !bookDetailsResponse.data.attributes) {
        throw new ApiError("Book not found", 404)
      }

      const drupalInternalId = bookDetailsResponse.data.attributes.drupal_internal__id
      if (!drupalInternalId) {
        throw new ApiError("Book internal ID not found", 404)
      }

      console.log(
        `SUCCESS: Found drupal_internal__id: ${drupalInternalId} for book: ${bookDetailsResponse.data.attributes.title}`,
      )

      const basicAuth = btoa(`${this.username}:${this.password}`)

      const reservationData = {
        title: [{ value: "Request API" }],
        uid: [{ target_id: this.user.uid }],
        lmsbook: [{ target_id: String(drupalInternalId) }],
      }

      console.log(`FORM: Making reservation request with data:`, reservationData)
      console.log(`AUTH: Using CSRF token: ${this.csrfToken.substring(0, 10)}...`)

      const reservationResponse = await this.makeProxyRequest(`${API_CONFIG.ENDPOINTS.BOOK_RESERVATION}?_format=json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": this.csrfToken,
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify(reservationData),
      })

      console.log(`SUCCESS: Reservation response:`, reservationResponse)

      if (reservationResponse) {
        return {
          success: true,
          message: `Book "${bookDetailsResponse.data.attributes.title}" has been successfully reserved!`,
          reservation: {
            id: reservationResponse.id || String(Date.now()),
            book_id: bookId,
            book_title: bookDetailsResponse.data.attributes.title,
            book_author: "Unknown Author",
            reserved_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active",
          },
        }
      } else {
        throw new ApiError("Reservation request failed", 500)
      }
    } catch (error) {
      console.error("ERROR: Book reservation error:", error)

      let errorMessage = "Failed to reserve book. Please try again."

      if (error instanceof ApiError) {
        if (error.status === 404) {
          errorMessage = "Book not found or not available for reservation."
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = "Authentication failed. Please login again."
        } else if (error.status === 400) {
          errorMessage = "Invalid reservation request. Please check your borrowing limits."
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  async cancelReservation(reservationId: string): Promise<{
    success: boolean
    message: string
  }> {
    return this.makeAuthenticatedRequest(`/web/reservations/${reservationId}/cancel?_format=json`, {
      method: "POST",
    })
  }

  async getUserReservations(): Promise<Reservation[]> {
    return this.makeAuthenticatedRequest("/web/user/reservations?_format=json")
  }

  async getUserBorrowedBooks(): Promise<BorrowedBook[]> {
    try {
      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      if (!this.user?.uid) {
        throw new ApiError("User ID not available", 401)
      }

      console.log(`LOADING: Fetching borrowed books for UID: ${this.user.uid}`)

      const basicAuth = btoa(`${this.username}:${this.password}`)

      const borrowedData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.BORROWED_BOOKS}/${this.user.uid}?_format=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
        },
      )

      if (!borrowedData) {
        console.log("INFO: No borrowed books data returned")
        return []
      }

      if (!Array.isArray(borrowedData)) {
        console.warn("Borrowed books API returned non-array data:", typeof borrowedData)
        return []
      }

      return this.parseBorrowedBooksData(borrowedData)
    } catch (error) {
      console.error("ERROR: Borrowed books API error:", error)
      return []
    }
  }

  async getUserRequestedBooks(): Promise<RequestedBook[]> {
    try {
      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      if (!this.user?.uid) {
        throw new ApiError("User ID not available", 401)
      }

      console.log(`LOADING: Fetching requested books for UID: ${this.user.uid}`)

      const basicAuth = btoa(`${this.username}:${this.password}`)

      const requestedData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.REQUESTED_BOOKS}/${this.user.uid}?_format=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
        },
      )

      if (!requestedData) {
        console.log("INFO: No requested books data returned")
        return []
      }

      if (!Array.isArray(requestedData)) {
        console.warn("Requested books API returned non-array data:", typeof requestedData)
        return []
      }

      return this.parseRequestedBooksData(requestedData)
    } catch (error) {
      console.error("ERROR: Requested books API error:", error)
      return []
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      if (!this.user?.uid) {
        throw new ApiError("User ID not available", 401)
      }

      console.log(`LOADING: Fetching user profile for UID: ${this.user.uid}`)

      const basicAuth = btoa(`${this.username}:${this.password}`)

      const profileData = await this.makeProxyRequest(
        `${API_CONFIG.ENDPOINTS.USER_PROFILE}/${this.user.uid}?_format=json`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
        },
      )

      const profile = this.parseUserProfileData(profileData)

      try {
        const borrowedBooks = await this.getUserBorrowedBooks()

        const currentlyBorrowedCount = borrowedBooks.filter((book) => book.status === "issued").length

        profile.borrowed_books_count = currentlyBorrowedCount

        profile.can_borrow_more = currentlyBorrowedCount < profile.max_books_allowed

        console.log(`DATA: User borrowing status:`, {
          borrowed: currentlyBorrowedCount,
          max_allowed: profile.max_books_allowed,
          can_borrow_more: profile.can_borrow_more,
        })
      } catch (error) {
        console.warn("Failed to get book counts:", error.message)
      }

      return profile
    } catch (error) {
      console.error("ERROR: Profile API error:", error)

      console.warn("Profile API not available, using mock data")
      return {
        uid: this.user?.uid || "28",
        uuid: "ff5758b1-51e0-401b-bb08-efa21593e20a",
        name: this.user?.name || "Alana Rivers",
        email: "test@test.com13",
        timezone: "Asia/Kolkata",
        created: "2025-06-09T05:55:29+00:00",
        changed: "2025-06-11T05:06:15+00:00",
        borrowed_books_count: 2,
        requested_books_count: 1,
        credits: 3,
        max_credits: 5,
        max_books_allowed: 4,
        can_borrow_more: true,
      }
    }
  }

  async checkBorrowingEligibility(): Promise<{
    can_borrow: boolean
    current_books: number
    max_books: number
    message: string
  }> {
    try {
      const profile = await this.getUserProfile()
      const borrowedBooks = await this.getUserBorrowedBooks()

      const currentlyBorrowedCount = borrowedBooks.filter((book) => book.status === "issued").length

      const canBorrow = currentlyBorrowedCount < profile.max_books_allowed

      let message = ""
      if (!canBorrow) {
        message = `You have reached the maximum limit of ${profile.max_books_allowed} books. Please return some books before borrowing more.`
      } else {
        const remaining = profile.max_books_allowed - currentlyBorrowedCount
        message = `You can borrow ${remaining} more book${remaining !== 1 ? "s" : ""}.`
      }

      return {
        can_borrow: canBorrow,
        current_books: currentlyBorrowedCount,
        max_books: profile.max_books_allowed,
        message: message,
      }
    } catch (error) {
      console.error("Failed to check borrowing eligibility:", error)
      return {
        can_borrow: false,
        current_books: 0,
        max_books: 4,
        message: "Unable to check borrowing eligibility. Please try again.",
      }
    }
  }

  async returnBook(bookId: string): Promise<{
    success: boolean
    message: string
  }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/return?_format=json`, {
      method: "POST",
    })
  }

  async renewBook(bookId: string): Promise<{
    success: boolean
    message: string
    new_due_date?: string
  }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/renew?_format=json`, {
      method: "POST",
    })
  }

  async checkUserCredits(): Promise<{
    available_credits: number
    max_credits: number
    used_credits: number
  }> {
    return this.makeAuthenticatedRequest("/web/user/credits?_format=json")
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.makeProxyRequest(`/web/search/suggestions?q=${encodeURIComponent(query)}`)
  }

  async getCategoriesList(): Promise<string[]> {
    console.log("LOADING: Getting categories...")
    try {
      // First try to get categories from cache
      const cachedCategories = Array.from(this.categoriesCache.values())
      if (cachedCategories.length > 0) {
        const categoryNames = cachedCategories.map((cat) => cat.title).filter(Boolean)
        console.log("SUCCESS: Categories from cache:", categoryNames)
        return categoryNames
      }

      // Skip the problematic taxonomy API endpoint and go straight to extracting from books
      console.log("INFO: Skipping taxonomy API endpoint, extracting categories from books...")

      // Fallback: extract categories from books
      const books = await this.getBooks({ limit: 1000 })
      const categories = [
        ...new Set(
          books
            .map((book) => book.category)
            .filter(Boolean)
            .filter((cat) => cat !== "NULL"),
        ),
      ]

      if (categories.length > 0) {
        console.log("SUCCESS: Categories extracted from books:", categories)
        return categories as string[]
      }
    } catch (error) {
      console.log("ERROR: Failed to extract categories:", error.message)
    }

    console.log("REQUEST: Using default categories")
    return [
      "Fiction",
      "Non-Fiction",
      "Science",
      "History",
      "Biography",
      "Technology",
      "Business",
      "Arts",
      "Philosophy",
      "Religion",
    ]
  }

  setUseProxy(useProxy: boolean) {
    this.useProxy = useProxy
    console.log(`API mode changed to: ${useProxy ? "Proxy" : "Direct"}`)
  }

  async getActiveSessions(): Promise<any> {
    try {
      const response = await fetch("/api/sessions", {
        method: "GET",
      })
      return await response.json()
    } catch (error) {
      console.error("Failed to get active sessions:", error)
      return { total_sessions: 0, sessions: [] }
    }
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export const libraryAPI = new LibraryAPI()

function createAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`
}

async function makeAuthenticatedRequest(
  endpoint: string,
  username: string,
  password: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const headers = {
    Authorization: createAuthHeader(username, password),
    "Content-Type": "application/json",
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

export async function searchBooks(
  username: string,
  password: string,
  searchTerm = "",
  page = 1,
  limit = 12,
): Promise<ApiResponse> {
  try {
    const offset = (page - 1) * limit
    let endpoint = `/web/api/books?page[limit]=${limit}&page[offset]=${offset}`

    if (searchTerm.trim()) {
      const encodedSearch = encodeURIComponent(searchTerm.trim())
      endpoint += `&filter[search]=${encodedSearch}`
    }

    const response = await makeAuthenticatedRequest(endpoint, username, password)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: data.data || [],
      total: data.meta?.total || data.data?.length || 0,
    }
  } catch (error) {
    console.error("Error searching books:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getUserProfile(username: string, password: string): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest("/web/api/profile", username, password)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getBorrowedBooks(username: string, password: string): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest("/web/api/borrowed-books", username, password)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || [],
    }
  } catch (error) {
    console.error("Error fetching borrowed books:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getReservations(username: string, password: string): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest("/web/api/reservations", username, password)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || [],
    }
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function reserveBook(username: string, password: string, bookId: string): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest("/web/api/reservations", username, password, {
      method: "POST",
      body: JSON.stringify({ book_id: bookId }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error("Error reserving book:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function cancelReservation(
  username: string,
  password: string,
  reservationId: string,
): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest(`/web/api/reservations/${reservationId}`, username, password, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return {
      success: true,
      data: { message: "Reservation cancelled successfully" },
    }
  } catch (error) {
    console.error("Error cancelling reservation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function renewBook(username: string, password: string, borrowId: string): Promise<ApiResponse> {
  try {
    const response = await makeAuthenticatedRequest(`/web/api/borrowed-books/${borrowId}/renew`, username, password, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error("Error renewing book:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export { ApiError }
export type {
  Book,
  Author,
  Publication,
  Category,
  UserProfile,
  Reservation,
  BorrowedBook,
  BooksApiResponse,
  RequestedBook,
  FeaturedImageResponse,
}

// Add UserProfileType export for compatibility
export type UserProfileType = UserProfile
