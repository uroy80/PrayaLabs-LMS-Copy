# Library Management System - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Environment Configuration](#environment-configuration)
5. [API Documentation](#api-documentation)
6. [Component Documentation](#component-documentation)
7. [Authentication System](#authentication-system)
8. [Database Integration](#database-integration)
9. [Features Documentation](#features-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance Guide](#maintenance-guide)

---

## Project Overview

### Description
A modern Progressive Web Application (PWA) for library management built with Next.js 15, TypeScript, and Tailwind CSS. The system provides comprehensive book management, user authentication, reservation system, and administrative features.

### Key Features
- **Book Management**: Search, browse, reserve, and manage books
- **User Authentication**: Secure login with session management
- **Progressive Web App**: Offline support and installable on devices
- **Advanced Search**: Smart search with suggestions and filters
- **Reservation System**: Book reservation and tracking
- **User Dashboard**: Personal library management
- **Calendar Integration**: Due date reminders and calendar exports
- **QR Code Generation**: Digital reservation tracking
- **Responsive Design**: Mobile-first approach

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Authentication**: HTTP Basic Auth with CSRF protection
- **API Integration**: RESTful APIs with proxy layer
- **PWA**: Service Worker, Web Manifest
- **Icons**: Lucide React
- **Calendar**: ICS file generation
- **QR Codes**: External QR service integration

---

## Architecture

### Project Structure
```
library-pwa/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy, captcha)
│   ├── login-error/       # Error pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── debug/            # Development tools
│   └── ui/               # Reusable UI components
├── lib/                  # Core libraries
│   ├── api.ts            # Main API client
│   ├── api-client.ts     # HTTP client utilities
│   ├── config.ts         # Configuration management
│   ├── ics-generator.ts  # Calendar file generation
│   ├── qr-generator.ts   # QR code utilities
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── styles/               # Additional styles
```

### Data Flow
1. **Authentication**: User logs in → CSRF token obtained → Stored in context
2. **API Requests**: Component → API Client → Proxy Route → External API
3. **State Management**: React Context for auth, local state for components
4. **Caching**: In-memory caching for authors, publications, categories

---

## Installation & Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Access to the library API endpoint

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd library-pwa
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment setup**
```bash
cp .env.example .env.local
```

4. **Configure environment variables** (see Environment Configuration section)

5. **Start development server**
```bash
npm run dev
# or
yarn dev
```

6. **Access the application**
Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production
```bash
npm run build
npm start
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration (REQUIRED)
NEXT_PUBLIC_LIBRARY_API_URL=https://your-api-domain.com

# Application Configuration (OPTIONAL)
NEXT_PUBLIC_APP_NAME=Library Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_LIBRARY_API_URL` | Base URL for the library API | Yes | None |
| `NEXT_PUBLIC_APP_NAME` | Application display name | No | "Library Management System" |
| `NEXT_PUBLIC_APP_VERSION` | Application version | No | "1.0.0" |

### Configuration Management

The application uses a centralized configuration system in `lib/config.ts`:

```typescript
// Example configuration access
import { API_CONFIG, APP_CONFIG } from '@/lib/config'

// API endpoints
const booksEndpoint = API_CONFIG.ENDPOINTS.BOOKS
const baseUrl = API_CONFIG.BASE_URL

// App settings
const appName = APP_CONFIG.NAME
const sessionDuration = APP_CONFIG.SESSION.DURATION
```

---

## API Documentation

### API Client Architecture

The application uses a layered API architecture:

1. **LibraryAPI Class** (`lib/api.ts`) - Main API interface
2. **ApiClient Class** (`lib/api-client.ts`) - HTTP client utilities
3. **Proxy Route** (`app/api/proxy/route.ts`) - Server-side proxy
4. **External API** - Drupal-based library system

### Core API Endpoints

#### Authentication Endpoints

**Login**
```typescript
await libraryAPI.login(username: string, password: string, sessionId: string)
```
- **Endpoint**: `/web/user/login`
- **Method**: POST
- **Returns**: `LoginResponse` with user data and CSRF token

**Logout**
```typescript
await libraryAPI.logout(sessionId?: string)
```
- **Endpoint**: `/web/user/logout`
- **Method**: POST
- **Returns**: void

**Session Verification**
```typescript
await libraryAPI.verifySession(sessionId: string)
```
- **Returns**: boolean indicating session validity

#### Book Management Endpoints

**Get Books**
```typescript
await libraryAPI.getBooks(params?: {
  search?: string
  searchField?: "title" | "author" | "isbn" | "all"
  category?: string
  author?: string
  page?: number
  limit?: number
  offset?: number
})
```
- **Endpoint**: `/web/jsonapi/lmsbook/lmsbook`
- **Method**: GET
- **Returns**: `Book[]`

**Get Book Details**
```typescript
await libraryAPI.getBookDetails(bookId: string)
```
- **Endpoint**: `/web/lmsbook/{id}`
- **Method**: GET
- **Returns**: `Book`

**Reserve Book**
```typescript
await libraryAPI.reserveBook(bookId: string)
```
- **Endpoint**: `/web/entity/requestedlmsbook`
- **Method**: POST
- **Returns**: Reservation result with success status

#### User Management Endpoints

**Get User Profile**
```typescript
await libraryAPI.getUserProfile()
```
- **Endpoint**: `/web/user/{uid}`
- **Method**: GET
- **Returns**: `UserProfile`

**Get Borrowed Books**
```typescript
await libraryAPI.getUserBorrowedBooks()
```
- **Endpoint**: `/web/borrowed/{uid}`
- **Method**: GET
- **Returns**: `BorrowedBook[]`

**Get Requested Books**
```typescript
await libraryAPI.getUserRequestedBooks()
```
- **Endpoint**: `/web/requested/{uid}`
- **Method**: GET
- **Returns**: `RequestedBook[]`

**Check Borrowing Eligibility**
```typescript
await libraryAPI.checkBorrowingEligibility()
```
- **Returns**: Eligibility status with current limits

#### Metadata Endpoints

**Get Authors**
```typescript
await libraryAPI.getAuthors()
```
- **Endpoint**: `/web/jsonapi/lmsbookauthor/lmsbookauthor`
- **Method**: GET
- **Returns**: `Author[]`

**Get Categories**
```typescript
await libraryAPI.getCategoriesList()
```
- **Endpoint**: `/web/jsonapi/taxonomy_term/lmsbook_category`
- **Method**: GET
- **Returns**: `string[]`

### Data Types

#### Core Interfaces

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

interface UserProfile {
  uid: string
  name: string
  email: string
  timezone: string
  created: string
  changed: string
  borrowed_books_count: number
  requested_books_count: number
  max_books_allowed: number
  can_borrow_more: boolean
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
```

### Error Handling

The API uses a custom `ApiError` class:

```typescript
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// Usage example
try {
  const books = await libraryAPI.getBooks()
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`)
  }
}
```

### API Usage Examples

#### Basic Book Search
```typescript
import { libraryAPI } from '@/lib/api'

// Search for books
const books = await libraryAPI.getBooks({
  search: "javascript",
  searchField: "title",
  limit: 12,
  page: 1
})

// Filter by category
const fictionBooks = await libraryAPI.getBooks({
  category: "Fiction",
  limit: 20
})
```

#### User Operations
```typescript
// Get user's borrowed books
const borrowedBooks = await libraryAPI.getUserBorrowedBooks()

// Check if user can borrow more books
const eligibility = await libraryAPI.checkBorrowingEligibility()
if (eligibility.can_borrow) {
  // User can borrow more books
  await libraryAPI.reserveBook(bookId)
}
```

#### Authentication Flow
```typescript
// Login
const loginResult = await libraryAPI.login(username, password, sessionId)
if (loginResult.current_user) {
  // Login successful, CSRF token automatically stored
  console.log('Logged in as:', loginResult.current_user.name)
}

// Logout
await libraryAPI.logout()
```

---

## Component Documentation

### Authentication Components

#### AuthProvider (`components/auth/auth-context.tsx`)
Central authentication state management using React Context.

**Features:**
- User session management
- CSRF token handling
- Automatic session expiration
- Activity tracking

**Usage:**
```typescript
import { useAuth } from '@/components/auth/auth-context'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginForm />
  }
  
  return <Dashboard />
}
```

#### LoginForm (`components/auth/login-form.tsx`)
Complete login interface with security verification.

**Features:**
- Username/password authentication
- Math CAPTCHA verification
- Password visibility toggle
- Loading states
- Error handling

#### SessionTimer (`components/auth/session-timer.tsx`)
Session monitoring and warning system.

**Features:**
- Real-time session countdown
- Warning notifications
- Auto-logout on expiration
- Dismissible warnings

### Dashboard Components

#### BookSearch (`components/dashboard/book-search.tsx`)
Main book search and browsing interface.

**Features:**
- Advanced search with suggestions
- Category filtering
- Pagination
- Real-time search suggestions
- Book reservation
- Responsive design

**Key Methods:**
```typescript
// Search books
const searchBooks = async (newPage = 1) => {
  // Implementation
}

// Handle book reservation
const handleReserve = async (bookId: string) => {
  // Implementation
}
```

#### BookDetailsModal (`components/dashboard/book-details-modal.tsx`)
Detailed book information modal.

**Features:**
- Complete book information
- Availability status
- User borrowing limits
- Reservation functionality
- Responsive modal design

#### UserProfile (`components/dashboard/user-profile.tsx`)
User account information and statistics.

**Features:**
- Account details
- Borrowing statistics
- Session information
- Profile management

#### BorrowedBooks (`components/dashboard/borrowed-books.tsx`)
Management of currently borrowed books.

**Features:**
- Borrowed books list
- Due date tracking
- Overdue notifications
- Calendar reminder generation

#### Reservations (`components/dashboard/reservations.tsx`)
Book reservation management.

**Features:**
- Reservation history
- QR code generation
- Status tracking
- Pagination

### UI Components

The application uses a comprehensive set of reusable UI components based on Radix UI:

- **Button**: Various button styles and states
- **Card**: Content containers with headers and footers
- **Dialog**: Modal dialogs and overlays
- **Input**: Form input fields with validation
- **Select**: Dropdown selection components
- **Badge**: Status indicators and labels
- **Progress**: Progress bars and indicators
- **Tabs**: Tabbed navigation interfaces

### Utility Components

#### QRCode (`components/ui/qr-code.tsx`)
QR code generation and display.

**Usage:**
```typescript
<QRCode 
  value={JSON.stringify(reservationData)} 
  size={200} 
  className="border rounded"
/>
```

#### CalendarReminderModal (`components/dashboard/calendar-reminder-modal.tsx`)
Calendar reminder generation for due dates.

**Features:**
- Single and multiple reminder options
- ICS file generation
- Download functionality
- Mobile-optimized interface

---

## Authentication System

### Authentication Flow

1. **Login Process**
   - User enters credentials
   - Math CAPTCHA verification
   - HTTP Basic Auth to API
   - CSRF token received and stored
   - User session established

2. **Session Management**
   - 10-minute session duration
   - Activity-based session extension
   - Automatic logout on expiration
   - Session verification with server

3. **Request Authentication**
   - CSRF token included in headers
   - Basic Auth for API requests
   - Automatic token refresh

### Security Features

- **CSRF Protection**: All state-changing requests include CSRF tokens
- **Session Timeout**: Configurable session duration with warnings
- **Activity Tracking**: Session extension based on user activity
- **Secure Storage**: Tokens stored in localStorage with cleanup
- **Math CAPTCHA**: Human verification for login attempts

### Authentication Configuration

```typescript
// Session configuration in lib/config.ts
export const APP_CONFIG = {
  SESSION: {
    DURATION: 10 * 60 * 1000,        // 10 minutes
    WARNING_TIME: 2 * 60 * 1000,     // 2 minutes warning
    CHECK_INTERVAL: 30 * 1000,       // Check every 30 seconds
  }
}
```

---

## Database Integration

### API Integration Pattern

The application integrates with a Drupal-based library management system through RESTful APIs.

#### Data Sources

1. **Primary API**: JSON API endpoints for books and metadata
2. **Secondary API**: Traditional REST endpoints for user data
3. **Authentication API**: Login/logout endpoints
4. **File API**: Image and document endpoints

#### Data Caching Strategy

```typescript
// Caching implementation in LibraryAPI class
private authorsCache: Map<string, Author> = new Map()
private publicationsCache: Map<string, Publication> = new Map()
private categoriesCache: Map<string, Category> = new Map()
private imageCache: Map<string, string> = new Map()
```

#### Data Transformation

The application transforms Drupal field arrays into usable objects:

```typescript
private parseAuthorData(authorData: any): Author {
  const getValue = (field: any) => {
    if (!field || !Array.isArray(field) || field.length === 0) return ""
    return field[0].value || ""
  }

  return {
    id: String(authorData.id || ""),
    title: getValue(authorData.title),
    description: getValue(authorData.text_long),
    created: getValue(authorData.created),
  }
}
```

---

## Features Documentation

### Book Management

#### Search Functionality
- **Text Search**: Search across titles, authors, and ISBN
- **Field-Specific Search**: Target specific fields
- **Category Filtering**: Filter by book categories
- **Smart Suggestions**: Real-time search suggestions
- **Pagination**: Efficient data loading

#### Book Reservation
- **Availability Check**: Real-time availability status
- **User Limits**: Borrowing limit enforcement
- **Reservation Tracking**: Status monitoring
- **Calendar Integration**: Due date reminders

### User Features

#### Dashboard
- **Personal Library**: Borrowed and reserved books
- **Due Date Tracking**: Overdue notifications
- **Borrowing Statistics**: Usage analytics
- **Profile Management**: Account information

#### Calendar Integration
- **ICS File Generation**: Standard calendar format
- **Multiple Reminders**: Configurable reminder schedule
- **Due Date Alerts**: Automatic notifications

#### QR Code System
- **Reservation QR Codes**: Digital tracking
- **Data Export**: JSON format export
- **Mobile Scanning**: QR code scanning support

### Progressive Web App Features

#### PWA Capabilities
- **Offline Support**: Basic offline functionality
- **Install Prompt**: Add to home screen
- **App Manifest**: PWA configuration
- **Service Worker**: Caching and offline support

#### Mobile Optimization
- **Responsive Design**: Mobile-first approach
- **Touch Interactions**: Optimized for touch
- **Performance**: Fast loading and smooth animations

---

## Deployment Guide

### Environment Setup

#### Production Environment Variables
```env
# Production API URL
NEXT_PUBLIC_LIBRARY_API_URL=https://production-api.domain.com

# Application Configuration
NEXT_PUBLIC_APP_NAME=Library Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional: Analytics and monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Build Process

#### Local Build
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Deployment Platforms

#### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

#### Netlify Deployment
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Configure environment variables

#### Self-Hosted Deployment
1. Build the application
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure environment variables

### Performance Optimization

#### Build Optimization
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Use `@next/bundle-analyzer`

#### Runtime Optimization
- **Caching**: API response caching
- **Lazy Loading**: Component lazy loading
- **Prefetching**: Route prefetching

---

## Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "Authentication required" errors
**Solution**:
1. Check if API URL is correct in `.env.local`
2. Verify credentials are valid
3. Check CSRF token is being sent
4. Ensure session hasn't expired

**Issue**: CSRF token errors
**Solution**:
1. Clear browser storage
2. Re-login to get fresh token
3. Check token is included in request headers

#### API Connection Issues

**Issue**: "Body is unusable: Body has already been read"
**Solution**:
1. Check proxy route implementation
2. Ensure request body is read only once
3. Restart development server

**Issue**: Network errors
**Solution**:
1. Verify API endpoint is accessible
2. Check CORS configuration
3. Verify SSL certificates

#### Build Issues

**Issue**: TypeScript errors
**Solution**:
1. Run `npm run type-check`
2. Fix type mismatches
3. Update type definitions

**Issue**: Missing environment variables
**Solution**:
1. Check `.env.local` exists
2. Verify all required variables are set
3. Restart development server

### Debug Tools

#### Development Debug Panel
Access the debug panel in development mode:
- Navigate to the "Debug" tab in the dashboard
- Test API connections
- View configuration
- Monitor requests

#### Console Logging
Enable detailed logging:
```typescript
// In lib/config.ts
export const DEBUG = {
  ENABLED: true,
  LOG_API_REQUESTS: true,
  LOG_AUTH_EVENTS: true,
  LOG_SESSION_EVENTS: true,
}
```

#### Network Monitoring
Monitor API requests in browser DevTools:
1. Open Network tab
2. Filter by "Fetch/XHR"
3. Check request/response details

---

## Maintenance Guide

### Regular Maintenance Tasks

#### Weekly Tasks
- Monitor error logs
- Check API response times
- Review user feedback
- Update dependencies (patch versions)

#### Monthly Tasks
- Security audit
- Performance review
- Backup verification
- Update documentation

#### Quarterly Tasks
- Major dependency updates
- Security penetration testing
- Performance optimization
- Feature usage analysis

### Monitoring and Analytics

#### Error Monitoring
Set up error tracking:
```typescript
// Example error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Send to monitoring service
})
```

#### Performance Monitoring
Monitor key metrics:
- Page load times
- API response times
- User session duration
- Error rates

### Security Maintenance

#### Security Checklist
- [ ] Regular dependency updates
- [ ] Security header configuration
- [ ] HTTPS enforcement
- [ ] Input validation
- [ ] Authentication security
- [ ] Session management
- [ ] CSRF protection
- [ ] XSS prevention

#### Dependency Management
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Backup and Recovery

#### Data Backup
- User session data (if persistent)
- Configuration files
- Environment variables
- SSL certificates

#### Recovery Procedures
1. Restore from backup
2. Verify environment variables
3. Test API connections
4. Validate functionality

### Performance Optimization

#### Regular Optimization Tasks
- Bundle size analysis
- Image optimization
- Cache configuration
- Database query optimization
- CDN configuration

#### Monitoring Tools
- Google PageSpeed Insights
- Lighthouse audits
- Web Vitals monitoring
- Real User Monitoring (RUM)

---

## API Reference Quick Guide

### Authentication
```typescript
// Login
await libraryAPI.login(username, password, sessionId)

// Logout
await libraryAPI.logout()

// Check session
await libraryAPI.verifySession(sessionId)
```

### Books
```typescript
// Get books
await libraryAPI.getBooks({ search, category, page, limit })

// Get book details
await libraryAPI.getBookDetails(bookId)

// Reserve book
await libraryAPI.reserveBook(bookId)
```

### User Data
```typescript
// Get profile
await libraryAPI.getUserProfile()

// Get borrowed books
await libraryAPI.getUserBorrowedBooks()

// Get reservations
await libraryAPI.getUserRequestedBooks()

// Check eligibility
await libraryAPI.checkBorrowingEligibility()
```

### Metadata
```typescript
// Get categories
await libraryAPI.getCategoriesList()

// Get authors
await libraryAPI.getAuthors()

// Get publications
await libraryAPI.getPublications()
```

---

## Support and Contact

### Technical Support
- **Documentation**: This file and inline code comments
- **Error Logs**: Check browser console and network tab
- **Debug Tools**: Use the built-in debug panel

### Development Resources
- **Next.js Documentation**: https://nextjs.org/docs
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

*This documentation is comprehensive . For specific implementation details, refer to the inline code comments and TypeScript type definitions.*
