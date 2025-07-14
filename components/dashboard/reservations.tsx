"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BookOpen,
  QrCode,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { libraryAPI, type RequestedBook } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { QRCode } from "@/components/ui/qr-code"

const ITEMS_PER_PAGE = 10

export function Reservations() {
  const { user } = useAuth()
  const [requestedBooks, setRequestedBooks] = useState<RequestedBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<RequestedBook | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user) {
      loadRequestedBooks()
    }
  }, [user])

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [requestedBooks])

  const loadRequestedBooks = async () => {
    setLoading(true)
    setError(null)

    try {
      const books = await libraryAPI.getUserRequestedBooks()
      setRequestedBooks(books)
      console.log("SUCCESS: Requested books loaded:", books)
    } catch (err) {
      console.error("ERROR: Failed to load requested books:", err)
      setError(err instanceof Error ? err.message : "Failed to load requested books")
    } finally {
      setLoading(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(requestedBooks.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentBooks = requestedBooks.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }, [currentPage, totalPages])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of reservations section
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Not available"

      const cleanDate = dateString.replace(/<[^>]*>/g, "").trim()
      if (!cleanDate) return "Not available"

      const date = new Date(cleanDate)
      if (isNaN(date.getTime())) return cleanDate

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString || "Not available"
    }
  }

  const generateQRData = (book: RequestedBook) => {
    const qrData = {
      type: "library_reservation",
      reservation_id: book.id,
      book_title: book.bookname || "Unknown Book",
      user_name: user?.name || "Unknown User",
      user_id: user?.uid || "Unknown",
      requested_date: book.requested_on,
      issued_date: book.issued_on,
      status:
        book.returned_on && book.returned_on.trim() !== ""
          ? "returned"
          : book.issued_on && book.issued_on !== "Not issued yet"
            ? "issued"
            : "pending",
      library: "University Library System",
    }

    return JSON.stringify(qrData, null, 2)
  }

  const downloadQRData = (book: RequestedBook) => {
    const qrData = generateQRData(book)
    const blob = new Blob([qrData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reservation-${book.bookname?.replace(/[^a-zA-Z0-9]/g, "-")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyQRData = async (book: RequestedBook) => {
    try {
      const qrData = generateQRData(book)
      await navigator.clipboard.writeText(qrData)
      console.log("QR data copied to clipboard")
    } catch (err) {
      console.error("Failed to copy QR data:", err)
    }
  }

  const handleShowQR = (book: RequestedBook) => {
    setSelectedReservation(book)
    setShowQRModal(true)
  }

  const getStatusBadge = (book: RequestedBook) => {
    if (book.returned_on && book.returned_on.trim() !== "") {
      return <Badge className="bg-gray-100 text-gray-800">Returned</Badge>
    } else if (book.issued_on && book.issued_on !== "Not issued yet") {
      return <Badge className="bg-green-100 text-green-800">Issued</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
    }
  }

  const getStatusIcon = (book: RequestedBook) => {
    if (book.returned_on && book.returned_on.trim() !== "") {
      return <CheckCircle className="h-4 w-4 text-gray-600" />
    } else if (book.issued_on && book.issued_on !== "Not issued yet") {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading requested books...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                My Book Requests
              </CardTitle>
              <CardDescription>
                Books you have requested from the library
                {requestedBooks.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({requestedBooks.length} total, showing {startIndex + 1}-{Math.min(endIndex, requestedBooks.length)}
                    )
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadRequestedBooks} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {requestedBooks.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No book requests</p>
            <p className="text-sm text-gray-400">Books you request will appear here</p>
          </CardContent>
        </Card>
      )}

      {requestedBooks.length > 0 && (
        <>
          <div className="space-y-4">
            {currentBooks.map((book) => (
              <Card key={book.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(book)}
                        <div>
                          <h3 className="font-semibold text-lg">{book.bookname || "Unknown Book"}</h3>
                          <p className="text-gray-600 text-sm">{book.title}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <div>
                            <span className="font-medium">Requested:</span>
                            <br />
                            <span>{formatDate(book.requested_on)}</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          <div>
                            <span className="font-medium">Status:</span>
                            <br />
                            <span>{book.issued_on === "Not issued yet" ? "Pending" : "Approved"}</span>
                          </div>
                        </div>

                        {book.issued_on && book.issued_on !== "Not issued yet" && (
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <div>
                              <span className="font-medium">Issued:</span>
                              <br />
                              <span>{formatDate(book.issued_on)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {getStatusBadge(book)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQR(book)}
                        className="flex items-center gap-1"
                      >
                        <QrCode className="h-3 w-3" />
                        Show QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, requestedBooks.length)} of {requestedBooks.length}{" "}
                    entries
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {getPageNumbers.map((page, index) => (
                        <div key={index}>
                          {page === "..." ? (
                            <span className="px-3 py-1 text-gray-500">...</span>
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Reservation QR Code
            </DialogTitle>
            <DialogDescription>Scan this QR code to view reservation details</DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              {/* Book Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-sm">{selectedReservation.bookname}</h3>
                <p className="text-xs text-gray-600">Requested: {formatDate(selectedReservation.requested_on)}</p>
                <div className="mt-1">{getStatusBadge(selectedReservation)}</div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                <QRCode value={generateQRData(selectedReservation)} size={200} id="reservation-qr-code" />
              </div>

              {/* QR Data Preview */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">QR Code Contains:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Reservation ID: {selectedReservation.id}</li>
                  <li>• Book: {selectedReservation.bookname}</li>
                  <li>• User: {user?.name}</li>
                  <li>
                    • Status:{" "}
                    {selectedReservation.returned_on && selectedReservation.returned_on.trim() !== ""
                      ? "Returned"
                      : selectedReservation.issued_on && selectedReservation.issued_on !== "Not issued yet"
                        ? "Issued"
                        : "Pending"}
                  </li>
                  <li>• Library: University Library System</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={() => copyQRData(selectedReservation)} variant="outline" className="flex-1" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Data
                </Button>
                <Button
                  onClick={() => downloadQRData(selectedReservation)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setShowQRModal(false)} size="sm">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
