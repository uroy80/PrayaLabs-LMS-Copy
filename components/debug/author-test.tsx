"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, XCircle, CheckCircle, User, Building2 } from "lucide-react"

export function AuthorTest() {
  const [authorId, setAuthorId] = useState("13")
  const [bookUuid, setBookUuid] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [authors, setAuthors] = useState<any[]>([])
  const [publications, setPublications] = useState<any[]>([])
  const [username, setUsername] = useState("test")
  const [password, setPassword] = useState("test")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authUsername, setAuthUsername] = useState("")

  // Simple function to make API requests through the proxy
  const makeProxyRequest = async (endpoint: string, options: any = {}) => {
    try {
      setLoading(true)
      setError(null)

      // Always add basic auth
      const basicAuth = btoa(`${username}:${password}`)
      const headers = {
        ...options.headers,
        Authorization: `Basic ${basicAuth}`,
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
          data: options.body ? JSON.parse(options.body) : undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Request failed")
      }

      // If we get a successful response, consider the user authenticated
      setIsAuthenticated(true)
      setAuthUsername(username)

      return result.data
    } catch (err: any) {
      // If we get a 401 or 403, mark as not authenticated
      if (err.message?.includes("401") || err.message?.includes("403")) {
        setIsAuthenticated(false)
      }

      setError(err.message || "Request failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Test authentication directly
  const testAuthentication = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Try to get user profile as authentication test
      const data = await makeProxyRequest("/web/user/current?_format=json", {
        headers: {
          Accept: "application/json",
        },
      })

      setResult({
        type: "authentication",
        success: true,
        user: data,
      })

      setIsAuthenticated(true)
      setAuthUsername(username)
    } catch (err: any) {
      setError(`Authentication failed: ${err.message}`)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  // Test single author endpoint
  const testAuthorEndpoint = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Try standard endpoint first
      try {
        const data = await makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
          headers: {
            Accept: "application/json",
          },
        })

        setResult({
          id: authorId,
          title: data.title?.[0]?.value || "Unknown",
          description: data.text_long?.[0]?.processed || "",
          created: data.created?.[0]?.value || "",
        })
      } catch (err) {
        // If standard endpoint fails, try JSON API endpoint
        console.log("Standard endpoint failed, trying JSON API")

        const data = await makeProxyRequest(`/web/jsonapi/lmsbookauthor/lmsbookauthor/${authorId}`, {
          headers: {
            Accept: "application/vnd.api+json",
          },
        })

        if (data && data.data) {
          setResult({
            id: authorId,
            title: data.data.attributes?.title || "Unknown Author",
            description: data.data.attributes?.text_long?.processed || "",
            created: data.data.attributes?.created || "",
          })
        } else {
          throw new Error("Author not found")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch author")
    } finally {
      setLoading(false)
    }
  }

  // Test publication endpoint
  const testPublicationEndpoint = async () => {
    if (!bookUuid.trim()) {
      setError("Please enter a book UUID")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const data = await makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmspublication`, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (data && data.data) {
        setResult({
          id: data.data.id,
          title: data.data.attributes?.title || "Unknown Publisher",
          description: data.data.attributes?.text_long?.processed || "",
        })
      } else {
        throw new Error("Publication not found")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch publication")
    } finally {
      setLoading(false)
    }
  }

  // Test multiple author IDs
  const testSpecificAuthorIds = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const testIds = ["13", "8", "1", "2", "3", "4", "5"]
      const results = []

      for (const id of testIds) {
        try {
          const data = await makeProxyRequest(`/web/lmsbookauthor/${id}?_format=json`, {
            headers: {
              Accept: "application/json",
            },
          })

          results.push({
            id,
            success: true,
            data: {
              title: data.title?.[0]?.value || "Unknown",
              description: data.text_long?.[0]?.processed || "",
            },
          })
        } catch (err) {
          results.push({ id, success: false, error: "Author not found" })
        }
      }

      setResult(results)
    } catch (err: any) {
      setError(err.message || "Failed to test author IDs")
    } finally {
      setLoading(false)
    }
  }

  // Test both author endpoints
  const testBothAuthorEndpoints = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const results = {
        standardEndpoint: { success: false, data: null, error: null },
        jsonApiEndpoint: { success: false, data: null, error: null },
      }

      // Test standard endpoint
      try {
        const data = await makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
          headers: {
            Accept: "application/json",
          },
        })

        results.standardEndpoint.success = true
        results.standardEndpoint.data = {
          title: data.title?.[0]?.value || "Unknown",
          description: data.text_long?.[0]?.processed || "",
        }
      } catch (err: any) {
        results.standardEndpoint.error = err.message
      }

      // Test JSON API endpoint
      try {
        const data = await makeProxyRequest(`/web/jsonapi/lmsbookauthor/lmsbookauthor/${authorId}`, {
          headers: {
            Accept: "application/vnd.api+json",
          },
        })

        results.jsonApiEndpoint.success = true
        results.jsonApiEndpoint.data = {
          title: data.data?.attributes?.title || "Unknown",
          description: data.data?.attributes?.text_long?.processed || "",
        }
      } catch (err: any) {
        results.jsonApiEndpoint.error = err.message
      }

      setResult(results)
    } catch (err: any) {
      setError(err.message || "Failed to test endpoints")
    } finally {
      setLoading(false)
    }
  }

  // Load all authors
  const loadAllAuthors = async () => {
    try {
      setLoading(true)
      setError(null)
      setAuthors([])

      // Try to get all authors via JSON API endpoint
      const data = await makeProxyRequest("/web/jsonapi/lmsbookauthor/lmsbookauthor", {
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (data && data.data && Array.isArray(data.data)) {
        const authorsList = data.data.map((author: any) => ({
          id: author.attributes?.drupal_internal__id || "",
          title: author.attributes?.title || "Unknown Author",
          description: author.attributes?.text_long?.processed || "",
          created: author.attributes?.created || "",
        }))

        setAuthors(authorsList)
      } else {
        throw new Error("No authors found")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load authors")
    } finally {
      setLoading(false)
    }
  }

  // Load all publications
  const loadAllPublications = async () => {
    try {
      setLoading(true)
      setError(null)
      setPublications([])

      // Get some books first to get their UUIDs
      const booksData = await makeProxyRequest("/web/jsonapi/lmsbook/lmsbook?page[limit]=5", {
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (!booksData || !booksData.data || !Array.isArray(booksData.data)) {
        throw new Error("No books found")
      }

      const bookUuids = booksData.data.map((book: any) => book.id)
      const publicationsList = []

      for (const uuid of bookUuids) {
        try {
          const data = await makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${uuid}/lmspublication`, {
            headers: {
              Accept: "application/vnd.api+json",
            },
          })

          if (data && data.data) {
            publicationsList.push({
              id: data.data.id,
              title: data.data.attributes?.title || "Unknown Publisher",
              description: data.data.attributes?.text_long?.processed || "",
            })
          }
        } catch (err) {
          // Skip if publication not found
        }
      }

      setPublications(publicationsList)
    } catch (err: any) {
      setError(err.message || "Failed to load publications")
    } finally {
      setLoading(false)
    }
  }

  // Test book-author link
  const testBookAuthorLink = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Get a book
      const booksData = await makeProxyRequest("/web/jsonapi/lmsbook/lmsbook?page[limit]=1", {
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (!booksData || !booksData.data || !booksData.data[0]) {
        throw new Error("No books found")
      }

      const book = booksData.data[0]
      const authorIds =
        book.relationships?.uid?.data?.map((author: any) => author.meta?.drupal_internal__target_id) || []

      const results = {
        book: {
          id: book.id,
          title: book.attributes?.title || "Unknown",
        },
        authorIds,
        authors: [] as any[],
      }

      // Try to fetch each author
      for (const authorId of authorIds) {
        try {
          const data = await makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
            headers: {
              Accept: "application/json",
            },
          })

          results.authors.push({
            id: authorId,
            success: true,
            title: data.title?.[0]?.value || "Unknown",
          })
        } catch (err) {
          results.authors.push({
            id: authorId,
            success: false,
            error: "Author not found",
          })
        }
      }

      setResult(results)
    } catch (err: any) {
      setError(err.message || "Failed to test book-author link")
    } finally {
      setLoading(false)
    }
  }

  // Debug book structure
  const debugBookStructure = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const data = await makeProxyRequest("/web/jsonapi/lmsbook/lmsbook?page[limit]=3", {
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error("No books found")
      }

      const books = data.data
      const bookStructures = books.map((book: any) => ({
        id: book.id,
        title: book.attributes?.title,
        hasRelationships: !!book.relationships,
        hasUidRelationship: !!book.relationships?.uid,
        hasPublicationRelationship: !!book.relationships?.lmspublication,
        uidData: book.relationships?.uid?.data,
        publicationData: book.relationships?.lmspublication?.data,
        authorIds: book.relationships?.uid?.data?.map((author: any) => author.meta?.drupal_internal__target_id) || [],
        publicationId: book.relationships?.lmspublication?.data?.meta?.drupal_internal__target_id || null,
      }))

      setResult({
        type: "book_structure",
        books: bookStructures,
        rawSample: books[0],
      })
    } catch (err: any) {
      setError(err.message || "Failed to debug book structure")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Author & Publication API Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Authentication Status:</span>
            {isAuthenticated ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Authenticated as {authUsername}
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <XCircle className="h-3 w-3 mr-1" />
                Not Authenticated
              </Badge>
            )}
          </div>

          {/* Simple Auth Form */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Input
              placeholder="Username (default: test)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="Password (default: test)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={testAuthentication} className="h-10" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Authentication"
              )}
            </Button>
          </div>

          {/* Test Single Author */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Single Author</label>
            <div className="flex gap-2">
              <Input
                placeholder="Author ID (e.g., 13)"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testAuthorEndpoint} className="min-w-[120px] h-10" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Test Author
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Single Publication */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Single Publication</label>
            <div className="flex gap-2">
              <Input
                placeholder="Book UUID (e.g., 866211a4-1d92-4d43-b40f-010da229a54c)"
                value={bookUuid}
                onChange={(e) => setBookUuid(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testPublicationEndpoint} className="min-w-[120px] h-10" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Test Publication
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Multiple Authors */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testSpecificAuthorIds} disabled={loading} variant="outline" className="h-10">
              {loading ? "Testing..." : "Test Multiple Author IDs"}
            </Button>

            <Button onClick={testBothAuthorEndpoints} disabled={loading} variant="outline" className="h-10">
              {loading ? "Testing..." : "Test Both Author APIs"}
            </Button>

            <Button onClick={loadAllAuthors} disabled={loading} variant="outline" className="h-10">
              {loading ? "Loading..." : "Load All Authors"}
            </Button>

            <Button onClick={loadAllPublications} disabled={loading} variant="outline" className="h-10">
              {loading ? "Loading..." : "Load Publications"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testBookAuthorLink} disabled={loading} variant="outline" className="h-10">
              {loading ? "Testing..." : "Test Book-Author Link"}
            </Button>

            <Button onClick={debugBookStructure} disabled={loading} variant="outline" className="h-10">
              {loading ? "Debugging..." : "Debug Book Structure"}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
              <h3 className="text-lg font-medium mb-2">Results:</h3>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {/* Authors List */}
          {authors.length > 0 && !loading && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Authors ({authors.length}):</h3>
              <div className="grid gap-2">
                {authors.slice(0, 10).map((author, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="font-medium">{author.title}</div>
                    <div className="text-sm text-gray-500">ID: {author.id}</div>
                  </div>
                ))}
                {authors.length > 10 && (
                  <div className="text-sm text-gray-500 text-center">...and {authors.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          {/* Publications List */}
          {publications.length > 0 && !loading && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Publications ({publications.length}):</h3>
              <div className="grid gap-2">
                {publications.map((pub, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="font-medium">{pub.title}</div>
                    <div className="text-sm text-gray-500">ID: {pub.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Information */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Author API:</strong> <code>/web/lmsbookauthor/{"{id}"}?_format=json</code>
              <br />
              <strong>Publication API:</strong> <code>/web/jsonapi/lmsbook/lmsbook/{"{book_uuid}"}/lmspublication</code>
              <br />
              <strong>Authentication:</strong> HTTP Basic Auth for authors, JSON API for publications
              <br />
              <strong>Response Format:</strong> Drupal field array format for authors, JSON API format for publications
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
