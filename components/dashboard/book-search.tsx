"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, BookOpen, Loader2, Filter, X, RefreshCw, AlertCircle, Eye, User, Hash, Sparkles, Building2, DollarSign } from "lucide-react"
import { libraryAPI, type Book } from "@/lib/api"
import { BookDetailsModal } from "./book-details-modal"
import { BookSearchSkeleton } from "./book-search-skeleton"
import { SearchLoadingState, BookGridLoadingState, LoadingSpinner } from "./loading-states"
import { useAuth } from "@/components/auth/auth-context"

interface SearchSuggestion {
  type: "title" | "author" | "isbn"
  value: string
  book?: Book
}

export function BookSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [allBooks, setAllBooks] = useState<Book[]>([])

  // Get authentication state
  const { user, authLoading } = useAuth()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only load data when authentication is ready and user is authenticated
    if (!authLoading && user) {
      loadInitialData()
    }
  }, [authLoading, user])

  // Load user profile along with initial data
  const loadInitialData = async () => {
    setInitialLoading(true)
    try {
      // Load categories, books, and user profile in parallel
      await Promise.all([loadCategories(), loadAllBooks(), searchBooks(), loadUserProfile()])
    } catch (error) {
      console.error("Failed to load initial data:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  // Add function to load user profile
  const loadUserProfile = async () => {
    try {
      const profile = await libraryAPI.getUserProfile()
      setUserProfile(profile)
      console.log("SUCCESS: User profile loaded:", profile)
    } catch (error) {
      console.warn("Failed to load user profile:", error.message)
    }
  }

  const loadAllBooks = async () => {
    try {
      // Make sure we're authenticated before loading books
      const books = await libraryAPI.getBooks({ limit: 1000 })
      setAllBooks(books)
      console.log(`SUCCESS: Loaded ${books.length} books for suggestions`)
    } catch (error) {
      console.warn("Failed to load all books for suggestions:", error)
      // Set empty array to prevent further attempts
      setAllBooks([])
    }
  }

  const loadCategories = async () => {
    try {
      console.log("SEARCH: Loading categories...")
      const cats = await libraryAPI.getCategoriesList()
      console.log("SUCCESS: Categories loaded:", cats)
      setCategories(cats)
    } catch (error) {
      console.warn("ERROR: Categories loading failed:", error.message)
      // Set minimal fallback categories
      setCategories(["Fiction", "Non-Fiction", "Science", "Technology"])
    }
  }

  // Generate search suggestions
  const generateSuggestions = (query: string): SearchSuggestion[] => {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    const suggestions: SearchSuggestion[] = []
    const seen = new Set<string>()

    // Search through all books
    allBooks.forEach((book) => {
      // Title suggestions
      if (book.title.toLowerCase().includes(lowerQuery) && !seen.has(book.title.toLowerCase())) {
        suggestions.push({
          type: "title",
          value: book.title,
          book,
        })
        seen.add(book.title.toLowerCase())
      }

      // Author suggestions
      if (book.author.toLowerCase().includes(lowerQuery) && !seen.has(book.author.toLowerCase())) {
        suggestions.push({
          type: "author",
          value: book.author,
          book,
        })
        seen.add(book.author.toLowerCase())
      }

      // ISBN suggestions
      if (book.isbn && book.isbn.includes(query) && !seen.has(book.isbn)) {
        suggestions.push({
          type: "isbn",
          value: book.isbn,
          book,
        })
        seen.add(book.isbn)
      }
    })

    // Sort suggestions by relevance (exact matches first, then partial)
    return suggestions
      .sort((a, b) => {
        const aExact = a.value.toLowerCase().startsWith(lowerQuery)
        const bExact = b.value.toLowerCase().startsWith(lowerQuery)
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.value.length - b.value.length
      })
      .slice(0, 8) // Limit to 8 suggestions
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setSelectedSuggestionIndex(-1)

    if (value.length >= 2) {
      setSuggestionLoading(true)
      // Debounce suggestions
      const timer = setTimeout(() => {
        const newSuggestions = generateSuggestions(value)
        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
        setSuggestionLoading(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setSuggestionLoading(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        searchBooksWithField("all")
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex])
        } else {
          searchBooksWithField("all")
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.value)
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    // Auto-search when suggestion is selected with specific field
    setTimeout(() => searchBooksWithField(suggestion.type), 100)
  }

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // New function to search with specific field
  const searchBooksWithField = async (searchField: "title" | "author" | "isbn" | "all" = "all", newPage = 1) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)
    setShowSuggestions(false) // Hide suggestions when searching

    try {
      console.log("SEARCH: Searching books with params:", {
        search: searchQuery || undefined,
        searchField: searchField,
        category: category === "all" ? undefined : category,
        page: newPage,
        limit: 12,
      })

      // Calculate offset for pagination
      const offset = (newPage - 1) * 12

      const books = await libraryAPI.getBooks({
        search: searchQuery || undefined,
        searchField: searchField,
        category: category === "all" ? undefined : category,
        page: newPage,
        limit: 12,
        offset: offset, // Add offset parameter
      })

      console.log("SUCCESS: Received books for page", newPage, ":", books.length)

      setBooks(books)
      setTotalBooks(books.length) // This represents books on current page
      setPage(newPage)

      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (apiError) {
      console.error("ERROR: Books API error:", apiError)

      let errorMessage = "Failed to load books"
      if (apiError.status === 404) {
        errorMessage = "Book data not available - some endpoints may not be configured"
      } else if (apiError.status === 401 || apiError.status === 403) {
        errorMessage = "Authentication failed - please login again"
      } else {
        errorMessage = `Failed to load books: ${apiError.message}`
      }

      setError(errorMessage)
      setBooks([])
      setTotalBooks(0)
    }

    setLoading(false)
  }

  // Update the regular searchBooks function to use "all" field search
  const searchBooks = async (newPage = 1) => {
    return searchBooksWithField("all", newPage)
  }

  // Update the handleReserve function to show calendar modal after successful reservation
  const handleReserve = async (bookId: string) => {
    try {
      setLoading(true)

      console.log(`REQUEST: Starting reservation process for book ID: ${bookId}`)

      // Check borrowing eligibility first
      const eligibility = await libraryAPI.checkBorrowingEligibility()

      if (!eligibility.can_borrow) {
        alert(`Cannot reserve book: ${eligibility.message}`)
        return
      }

      console.log(`SUCCESS: User is eligible to borrow. Proceeding with reservation...`)

      const result = await libraryAPI.reserveBook(bookId)

      if (result.success) {
        // Refresh the books list to show updated availability
        await searchBooks(page)

        // Show success message
        alert(`SUCCESS: ${result.message}`)

        // Close details modal if open
        setShowDetailsModal(false)

        console.log(`SUCCESS: Book reservation completed successfully`)
      } else {
        alert(`ERROR: Reservation failed: ${result.message}`)
        console.error(`ERROR: Reservation failed:`, result.message)
      }
    } catch (error) {
      console.error("ERROR: Reservation process failed:", error)
      alert("ERROR: Reservation failed. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleShowDetails = (book: Book) => {
    setSelectedBook(book)
    setShowDetailsModal(true)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCategory("all")
    setShowSuggestions(false)
    setSuggestions([])
    setPage(1) // Reset to first page
    searchBooks(1) // Start from page 1
  }

  const refreshBooks = () => {
    searchBooks(page) // Keep current page when refreshing
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "available":
        return "bg-green-100 text-green-800"
      case "borrowed":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "available":
        return "Available"
      case "borrowed":
        return "Borrowed"
      case "reserved":
        return "Reserved"
      default:
        return status || "Available"
    }
  }

  const isBookAvailable = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    return normalizedStatus === "available" || !status
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "author":
        return <User className="h-4 w-4 text-blue-500" />
      case "isbn":
        return <Hash className="h-4 w-4 text-green-500" />
      default:
        return <BookOpen className="h-4 w-4 text-purple-500" />
    }
  }

  // Show initial loading skeleton
  if (initialLoading) {
    return <BookSearchSkeleton count={6} />
  }

  return (
    <div className="space-y-4">
      {/* Compact Search Card */}
      <Card className="border border-gray-200/50 shadow-medium bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-900 rounded-lg border border-blue-800">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-black text-gray-900 text-base sm:text-lg">Search Library</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs sm:text-sm text-gray-700 font-bold">
                  Total Resources: <span className="font-black text-gray-900">{allBooks.length.toLocaleString()}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBooks}
                disabled={loading}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-soft transition-all-smooth rounded-lg"
                title="Refresh"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </div>
              <Input
                ref={searchInputRef}
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 border-2 border-gray-300 focus:border-blue-500 rounded-lg sm:rounded-xl shadow-soft transition-all-smooth text-sm sm:text-base"
                autoComplete="off"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 rounded-full transition-colors-smooth"
                  onClick={() => {
                    setSearchQuery("")
                    setShowSuggestions(false)
                    setSuggestions([])
                  }}
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              )}

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-3 bg-white border border-gray-200/50 rounded-xl shadow-strong max-h-64 overflow-y-auto backdrop-blur-sm"
                >
                  {suggestionLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      <span className="text-sm">Finding suggestions...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <>
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <Sparkles className="h-3 w-3" />
                          Suggestions
                        </div>
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.type}-${suggestion.value}`}
                          className={`p-4 cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-b-0 flex items-center gap-3 transition-all-smooth ${
                            index === selectedSuggestionIndex ? "bg-blue-50 border-blue-100" : ""
                          }`}
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          <div className="flex-shrink-0">{getSuggestionIcon(suggestion.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate text-sm">{suggestion.value}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Badge variant="outline" className="text-xs font-medium">
                                {suggestion.type === "isbn" ? "ISBN" : suggestion.type.toUpperCase()}
                              </Badge>
                              {suggestion.book && suggestion.type !== "title" && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{suggestion.book.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm">No suggestions found</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 sm:h-12 border-2 border-gray-300 focus:border-blue-500 rounded-lg sm:rounded-xl shadow-soft transition-all-smooth">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => searchBooksWithField("all")}
                  disabled={loading}
                  className="h-10 sm:h-12 px-4 sm:px-8 bg-blue-900 hover:bg-blue-800 hover:shadow-lg text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-300 border border-blue-800 flex-1 sm:flex-initial"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">Search</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Search</span>
                    </>
                  )}
                </Button>

                {(searchQuery || category !== "all") && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="h-10 sm:h-12 px-3 sm:px-6 border-2 border-gray-200 hover:bg-gray-50 bg-white shadow-soft rounded-lg sm:rounded-xl transition-all-smooth"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Clear</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Search Tips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 bg-gray-50/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200/50">
              <div className="flex items-center gap-1">
                <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="font-medium">Titles</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="font-medium">Authors</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="font-medium">ISBN</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <SearchLoadingState />}

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50/50 shadow-soft rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasSearched && !loading && (
        <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-xl shadow-soft">
          <div className="text-sm text-blue-900 font-medium">
            {totalBooks > 0 ? (
              <>
                Found "<span className="font-bold">{totalBooks}</span>" book{totalBooks !== 1 ? "s" : ""}
                {searchQuery && (
                  <>
                    {" "}
                    for "<span className="font-semibold">{searchQuery}</span>"
                  </>
                )}
                {category !== "all" && (
                  <>
                    {" "}
                    in <span className="font-semibold">{category}</span>
                  </>
                )}
              </>
            ) : (
              "No books found matching your criteria"
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <BookGridLoadingState count={6} />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="book-card shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-blue-300 bg-white backdrop-blur-sm transition-all duration-300 overflow-hidden group">
              <CardHeader className="pb-4 sm:pb-6 bg-gradient-to-br from-white to-gray-50/50">
                <div className="flex items-start gap-4 mb-4 sm:mb-6">
                  {/* Book Image */}
                  <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border-2 border-gray-200 group-hover:shadow-xl transition-all duration-300">
                    {book.cover_image || book.featured_image ? (
                      <img
                        src={book.cover_image || book.featured_image}
                        alt={`Cover of ${book.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = `/placeholder.svg?height=80&width=64&text=${encodeURIComponent(book.title.substring(0, 8))}`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2">
                        <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                        <span className="text-xs text-center font-medium leading-tight">{book.title.substring(0, 20)}...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge className={`${getStatusColor(book.status)} font-bold px-3 py-1.5 rounded-full text-xs shadow-md border-2 border-white`}>
                        {getStatusText(book.status)}
                      </Badge>
                      {book.books_available !== undefined && (
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-600">Available</div>
                          <div className="text-lg font-black text-green-600">{book.books_available}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl line-clamp-2 font-black tracking-tight text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                        {book.title}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base font-bold text-gray-700 mt-1">
                        by {book.author}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 bg-gradient-to-b from-transparent to-gray-50/30">
                <div className="space-y-3 sm:space-y-4">
                  {/* Book Details Grid */}
                  <div className="grid grid-cols-1 gap-2 bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    {book.isbn && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-bold text-gray-700">ISBN:</span>
                        <span className="text-xs font-black text-gray-900">{book.isbn}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-bold text-gray-700">Category:</span>
                      <span className="text-xs font-black text-gray-900">{book.category || "General"}</span>
                    </div>
                    {book.publisher && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-orange-600" />
                        <span className="text-xs font-bold text-gray-700">Publisher:</span>
                        <span className="text-xs font-black text-gray-900 truncate">{book.publisher}</span>
                      </div>
                    )}
                    {book.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold text-sm">₹</span>
                        <span className="text-xs font-bold text-gray-700">Price:</span>
                        <span className="text-xs font-black text-green-700">₹{book.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    {/* Update the Reserve button in the book cards to check borrowing limits */}
                    <Button
                      size="sm"
                      className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 hover:shadow-xl text-white font-black rounded-xl transition-all duration-300 border-2 border-blue-700 shadow-lg text-sm group-hover:scale-105"
                      disabled={
                        !isBookAvailable(book.status) ||
                        loading ||
                        (book.books_available || 0) === 0 ||
                        userProfile?.can_borrow_more === false
                      }
                      onClick={() => handleReserve(book.id)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Reserving...</span>
                        </>
                      ) : userProfile?.can_borrow_more === false ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Limit Reached</span>
                        </>
                      ) : isBookAvailable(book.status) && (book.books_available || 0) > 0 ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          <span>Reserve Book</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          <span>Unavailable</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShowDetails(book)}
                      className="h-10 sm:h-12 px-4 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 shadow-lg rounded-xl transition-all duration-300 text-sm font-bold group-hover:scale-105"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span>Details</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {books.length === 0 && hasSearched && !loading && (
        <Card className="shadow-soft border border-gray-200/50 bg-white/80">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-500 mb-3 text-lg font-medium">No books found</p>
            <p className="text-sm text-gray-400">Try adjusting your search criteria or browse all books</p>
            <Button 
              variant="outline" 
              onClick={clearSearch} 
              className="mt-6 bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-soft rounded-lg transition-all-smooth"
            >
              Browse All Books
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {(totalBooks > 12 || page > 1) && (
        <div className="flex justify-center pt-4 px-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl shadow-medium border border-gray-200/50 p-1.5 sm:p-2 w-full max-w-md overflow-x-auto">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => searchBooksWithField("all", page - 1)}
              size="sm"
              className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all-smooth text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Previous"}
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              {page > 2 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => searchBooksWithField("all", 1)}
                    className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 transition-colors-smooth text-xs sm:text-sm"
                  >
                    1
                  </Button>
                  {page > 3 && <span className="text-gray-400 text-xs sm:text-sm">...</span>}
                </>
              )}

              {page > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => searchBooksWithField("all", page - 1)}
                  className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 transition-colors-smooth text-xs sm:text-sm"
                >
                  {page - 1}
                </Button>
              )}

              <Button variant="default" size="sm" className="h-7 w-7 sm:h-9 sm:w-9 p-0 bg-blue-900 hover:bg-blue-800 text-white border border-blue-800 shadow-md text-xs sm:text-sm">
                {page}
              </Button>

              {books.length === 12 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => searchBooksWithField("all", page + 1)}
                  className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 transition-colors-smooth text-xs sm:text-sm"
                >
                  {page + 1}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              disabled={loading || books.length < 12}
              onClick={() => searchBooksWithField("all", page + 1)}
              size="sm"
              className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all-smooth text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Next"}
            </Button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {hasSearched && !loading && books.length > 0 && (
        <div className="text-center text-xs sm:text-sm text-gray-600 font-medium px-4">
          Showing page {page} • {books.length} books on this page
          {books.length === 12 && " • More books available"}
        </div>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onReserve={handleReserve}
        loading={loading}
        userProfile={userProfile}
      />
    </div>
  )
}
