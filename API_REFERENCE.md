# Library Management System - API Reference

## Overview

This document provides a comprehensive reference for all API endpoints, data structures, and integration patterns used in the Library Management System.

## Base Configuration

### Environment Setup
```env
NEXT_PUBLIC_LIBRARY_API_URL=https://your-api-domain.com
```

### API Client Initialization
```typescript
import { libraryAPI } from '@/lib/api'

// The API client is automatically configured with the base URL
// and handles authentication, caching, and error handling
```

## Authentication APIs

### Login
Authenticate user and establish session.

```typescript
await libraryAPI.login(username: string, password: string, sessionId: string)
```

**Endpoint**: `POST /web/user/login`

**Request Body**:
```json
{
  "name": "username",
  "pass": "password"
}
```

**Response**:
```typescript
interface LoginResponse {
  current_user: {
    uid: string
    name: string
  }
  csrf_token: string
  logout_token: string
}
```

**Example**:
```typescript
try {
  const result = await libraryAPI.login('john_doe', 'password123', 'session_123')
  console.log('Logged in as:', result.current_user.name)
  // CSRF token is automatically stored for subsequent requests
} catch (error) {
  console.error('Login failed:', error.message)
}
```

### Logout
End user session and cleanup.

```typescript
await libraryAPI.logout(sessionId?: string)
```

**Endpoint**: `POST /web/user/logout`

**Example**:
```typescript
await libraryAPI.logout()
// All cached data and tokens are cleared
```

### Session Verification
Check if current session is valid.

```typescript
await libraryAPI.verifySession(sessionId: string): Promise<boolean>
```

**Example**:
```typescript
const isValid = await libraryAPI.verifySession('session_123')
if (!isValid) {
  // Redirect to login
}
```

## Book Management APIs

### Get Books
Retrieve books with optional filtering and pagination.

```typescript
await libraryAPI.getBooks(params?: GetBooksParams): Promise<Book[]>
```

**Endpoint**: `GET /web/jsonapi/lmsbook/lmsbook`

**Parameters**:
```typescript
interface GetBooksParams {
  search?: string                                    // Search term
  searchField?: "title" | "author" | "isbn" | "all" // Search field
  category?: string                                  // Category filter
  author?: string                                    // Author filter
  page?: number                                      // Page number (1-based)
  limit?: number                                     // Items per page (default: 12)
  offset?: number                                    // Offset for pagination
}
```

**Response**:
```typescript
interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  category?: string
  status: "available" | "borrowed" | "reserved"
  description?: string
  cover_image?: string
  publisher?: string
  price?: string
  copies?: string
  books_available?: number
  books_issued?: number
  featured_image?: string
}
```

**Examples**:

```typescript
// Basic search
const books = await libraryAPI.getBooks({
  search: "javascript",
  limit: 20
})

// Search by specific field
const books = await libraryAPI.getBooks({
  search: "John Doe",
  searchField: "author",
  page: 1,
  limit: 12
})

// Filter by category
const fictionBooks = await libraryAPI.getBooks({
  category: "Fiction",
  limit: 50
})

// Combined filters
const books = await libraryAPI.getBooks({
  search: "programming",
  category: "Technology",
  page: 2,
  limit: 15
})
```

### Get Book Details
Retrieve detailed information for a specific book.

```typescript
await libraryAPI.getBookDetails(bookId: string): Promise<Book>
```

**Endpoint**: `GET /web/lmsbook/{id}`

**Example**:
```typescript
const book = await libraryAPI.getBookDetails('123')
console.log('Book title:', book.title)
console.log('Available copies:', book.books_available)
```

### Reserve Book
Create a reservation for a book.

```typescript
await libraryAPI.reserveBook(bookId: string): Promise<ReservationResult>
```

**Endpoint**: `POST /web/entity/requestedlmsbook`

**Response**:
```typescript
interface ReservationResult {
  success: boolean
  message: string
  reservation?: {
    id: string
    book_id: string
    book_title: string
    book_author: string
    reserved_at: string
    expires_at: string
    status: "active" | "expired" | "collected"
  }
}
```

**Example**:
```typescript
try {
  const result = await libraryAPI.reserveBook('book_123')
  if (result.success) {
    console.log('Reservation successful:', result.message)
    // Show success notification
  } else {
    console.error('Reservation failed:', result.message)
  }
} catch (error) {
  console.error('Reservation error:', error.message)
}
```

## User Management APIs

### Get User Profile
Retrieve current user's profile information.

```typescript
await libraryAPI.getUserProfile(): Promise<UserProfile>
```

**Endpoint**: `GET /web/user/{uid}`

**Response**:
```typescript
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
```

**Example**:
```typescript
const profile = await libraryAPI.getUserProfile()
console.log('User:', profile.name)
console.log('Books borrowed:', profile.borrowed_books_count)
console.log('Can borrow more:', profile.can_borrow_more)
```

### Get Borrowed Books
Retrieve user's currently borrowed books.

```typescript
await libraryAPI.getUserBorrowedBooks(): Promise<BorrowedBook[]>
```

**Endpoint**: `GET /web/borrowed/{uid}`

**Response**:
```typescript
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
```

**Example**:
```typescript
const borrowedBooks = await libraryAPI.getUserBorrowedBooks()

borrowedBooks.forEach(book => {
  console.log(`${book.bookname}: ${book.status}`)
  if (book.is_overdue) {
    console.log(`⚠️ OVERDUE by ${Math.abs(book.days_remaining)} days`)
  } else if (book.status === 'issued') {
    console.log(`📅 Due in ${book.days_remaining} days`)
  }
})
```

### Get Requested Books
Retrieve user's book requests/reservations.

```typescript
await libraryAPI.getUserRequestedBooks(): Promise<RequestedBook[]>
```

**Endpoint**: `GET /web/requested/{uid}`

**Response**:
```typescript
interface RequestedBook {
  id: string
  title: string
  bookname: string
  requested_on: string
  issued_on: string
  returned_on: string
}
```

**Example**:
```typescript
const requestedBooks = await libraryAPI.getUserRequestedBooks()

requestedBooks.forEach(book => {
  const status = book.issued_on !== "Not issued yet" ? "Approved" : "Pending"
  console.log(`${book.bookname}: ${status}`)
})
```

### Check Borrowing Eligibility
Check if user can borrow more books.

```typescript
await libraryAPI.checkBorrowingEligibility(): Promise<EligibilityResult>
```

**Response**:
```typescript
interface EligibilityResult {
  can_borrow: boolean
  current_books: number
  max_books: number
  message: string
}
```

**Example**:
```typescript
const eligibility = await libraryAPI.checkBorrowingEligibility()

if (eligibility.can_borrow) {
  console.log(`✅ ${eligibility.message}`)
  // Show reserve button
} else {
  console.log(`❌ ${eligibility.message}`)
  // Disable reserve button
}
```

## Metadata APIs

### Get Categories
Retrieve list of book categories.

```typescript
await libraryAPI.getCategoriesList(): Promise<string[]>
```

**Endpoint**: `GET /web/jsonapi/taxonomy_term/lmsbook_category`

**Example**:
```typescript
const categories = await libraryAPI.getCategoriesList()
console.log('Available categories:', categories)
// Output: ["Fiction", "Science", "History", "Technology", ...]
```

### Get Authors
Retrieve list of authors.

```typescript
await libraryAPI.getAuthors(): Promise<Author[]>
```

**Endpoint**: `GET /web/jsonapi/lmsbookauthor/lmsbookauthor`

**Response**:
```typescript
interface Author {
  id: string
  uuid: string
  title: string
  description: string
  created: string
}
```

**Example**:
```typescript
const authors = await libraryAPI.getAuthors()
authors.forEach(author => {
  console.log(`${author.title} (ID: ${author.id})`)
})
```

### Get Publications
Retrieve list of publications/publishers.

```typescript
await libraryAPI.getPublications(): Promise<Publication[]>
```

**Response**:
```typescript
interface Publication {
  id: string
  title: string
  description: string
}
```

## Error Handling

### API Error Class
All API methods throw `ApiError` instances on failure.

```typescript
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}
```

### Error Handling Patterns

```typescript
// Basic error handling
try {
  const books = await libraryAPI.getBooks()
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        break
      case 404:
        // Show not found message
        break
      case 500:
        // Show server error message
        break
      default:
        // Show generic error
        console.error('API Error:', error.message)
    }
  }
}

// Specific error handling for reservations
try {
  const result = await libraryAPI.reserveBook(bookId)
  if (!result.success) {
    // Handle business logic errors
    showErrorMessage(result.message)
  }
} catch (error) {
  // Handle technical errors
  if (error.status === 401) {
    redirectToLogin()
  } else {
    showErrorMessage('Unable to reserve book. Please try again.')
  }
}
```

## Caching and Performance

### Automatic Caching
The API client automatically caches:
- Author information
- Publication data
- Category lists
- Featured images

### Cache Management
```typescript
// Caches are automatically managed, but you can force refresh by:
await libraryAPI.logout() // Clears all caches
await libraryAPI.login(username, password, sessionId) // Rebuilds caches
```

### Performance Optimization
```typescript
// Load books with metadata in parallel
const [books, categories, authors] = await Promise.all([
  libraryAPI.getBooks({ limit: 20 }),
  libraryAPI.getCategoriesList(),
  libraryAPI.getAuthors()
])
```

## Rate Limiting and Best Practices

### Request Patterns
```typescript
// ✅ Good: Batch operations
const bookIds = ['1', '2', '3', '4', '5']
const books = await Promise.all(
  bookIds.map(id => libraryAPI.getBookDetails(id))
)

// ❌ Avoid: Sequential requests in loops
for (const id of bookIds) {
  const book = await libraryAPI.getBookDetails(id) // Slow!
}
```

### Pagination Best Practices
```typescript
// Implement efficient pagination
const loadMoreBooks = async (page: number) => {
  const books = await libraryAPI.getBooks({
    page,
    limit: 12,
    search: currentSearchTerm,
    category: selectedCategory
  })
  
  if (page === 1) {
    setBooks(books)
  } else {
    setBooks(prev => [...prev, ...books])
  }
}
```

### Search Optimization
```typescript
// Debounce search requests
import { debounce } from 'lodash'

const debouncedSearch = debounce(async (searchTerm: string) => {
  if (searchTerm.length >= 2) {
    const books = await libraryAPI.getBooks({
      search: searchTerm,
      limit: 10
    })
    setSuggestions(books)
  }
}, 300)
```

## Integration Examples

### React Component Integration
```typescript
import { useEffect, useState } from 'react'
import { libraryAPI, Book } from '@/lib/api'

function BookList() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true)
        const books = await libraryAPI.getBooks({ limit: 20 })
        setBooks(books)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {books.map(book => (
        <div key={book.id}>
          <h3>{book.title}</h3>
          <p>by {book.author}</p>
          <p>Status: {book.status}</p>
        </div>
      ))}
    </div>
  )
}
```

### Search Implementation
```typescript
function BookSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  const searchBooks = async () => {
    const books = await libraryAPI.getBooks({
      search: searchTerm,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      limit: 12
    })
    setBooks(books)
  }

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await libraryAPI.getCategoriesList()
      setCategories(cats)
    }
    loadCategories()
  }, [])

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search books..."
      />
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <button onClick={searchBooks}>Search</button>
      
      {/* Display books */}
    </div>
  )
}
```

### Reservation Flow
```typescript
function BookReservation({ bookId }: { bookId: string }) {
  const [reserving, setReserving] = useState(false)

  const handleReserve = async () => {
    try {
      setReserving(true)
      
      // Check eligibility first
      const eligibility = await libraryAPI.checkBorrowingEligibility()
      if (!eligibility.can_borrow) {
        alert(eligibility.message)
        return
      }

      // Make reservation
      const result = await libraryAPI.reserveBook(bookId)
      if (result.success) {
        alert('Book reserved successfully!')
        // Refresh book list or redirect
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Failed to reserve book. Please try again.')
    } finally {
      setReserving(false)
    }
  }

  return (
    <button 
      onClick={handleReserve} 
      disabled={reserving}
    >
      {reserving ? 'Reserving...' : 'Reserve Book'}
    </button>
  )
}
```

## Testing API Integration

### Mock API for Testing
```typescript
// Create mock API for testing
const mockLibraryAPI = {
  async getBooks(params) {
    return [
      {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        status: 'available',
        books_available: 3
      }
    ]
  },
  
  async reserveBook(bookId) {
    return {
      success: true,
      message: 'Book reserved successfully'
    }
  }
}

// Use in tests
test('book reservation', async () => {
  const result = await mockLibraryAPI.reserveBook('1')
  expect(result.success).toBe(true)
})
```

### API Testing Checklist
- [ ] Authentication flow works
- [ ] Book search returns results
- [ ] Pagination works correctly
- [ ] Reservation process completes
- [ ] Error handling works
- [ ] Caching improves performance
- [ ] Session management works
- [ ] User data loads correctly

---

This API reference provides comprehensive documentation for integrating with the Library Management System. For implementation examples, refer to the existing components in the codebase.
