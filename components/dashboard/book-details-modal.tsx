"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, DollarSign, Package, Building2, Hash, Tag, Users, BookCheck, AlertCircle } from "lucide-react"
import { User as UserIcon } from "lucide-react"
import type { Book, UserProfileType } from "@/lib/api"
interface BookDetailsModalProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onReserve: (bookId: string) => void
  loading?: boolean
  userProfile?: UserProfileType // Add user profile to check limits
}

export function BookDetailsModal({
  book,
  isOpen,
  onClose,
  onReserve,
  loading = false,
  userProfile,
}: BookDetailsModalProps) {
  if (!book) return null

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

  // Check if user can borrow more books
  const canUserBorrowMore = userProfile?.can_borrow_more !== false
  const userBooksCount = (userProfile?.borrowed_books_count || 0) + (userProfile?.requested_books_count || 0)
  const maxBooks = userProfile?.max_books_allowed || 4

  const handleReserve = async () => {
    await onReserve(book.id)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <DialogHeader>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 pr-6">
                <DialogTitle className="text-2xl sm:text-3xl font-black line-clamp-2 text-gray-900 tracking-tight">
                  {book.title}
                </DialogTitle>
                <DialogDescription className="text-lg sm:text-xl mt-2 font-bold text-gray-700">
                  by {book.author}
                </DialogDescription>
              </div>
              <Badge className={`${getStatusColor(book.status)} font-black px-4 py-2 text-sm shadow-lg border-2 border-white`}>
                {getStatusText(book.status)}
              </Badge>
            </div>
          </DialogHeader>

          {/* Book Image Section */}
          <div className="flex justify-center mb-8">
            <div className="relative w-56 h-72 sm:w-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              {book.cover_image || book.featured_image ? (
                <img
                  src={book.cover_image || book.featured_image}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = `/placeholder.svg?height=256&width=192&text=${encodeURIComponent(book.title)}`
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6">
                  <BookOpen className="h-20 w-20 mb-4" />
                  <span className="text-lg text-center font-bold leading-tight">{book.title}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/80 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                <Hash className="h-5 w-5 mr-2 text-blue-600" />
                Book Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {book.isbn && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-black text-gray-900 block">ISBN</span>
                    <span className="text-sm font-bold text-blue-700">{book.isbn}</span>
                  </div>
                </div>
              )}

              {book.category && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <Tag className="h-5 w-5 text-purple-600" />
                  <div>
                    <span className="text-sm font-black text-gray-900 block">Category</span>
                    <span className="text-sm font-bold text-purple-700">{book.category}</span>
                  </div>
                </div>
              )}

              {book.publisher && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <div>
                    <span className="text-sm font-black text-gray-900 block">Publisher</span>
                    <span className="text-sm font-bold text-orange-700">{book.publisher}</span>
                  </div>
                </div>
              )}

              {book.price && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-green-600 font-bold text-lg">₹</span>
                  <div>
                    <span className="text-sm font-black text-gray-900 block">Price</span>
                    <span className="text-lg font-black text-green-700">₹{book.price}</span>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* User Borrowing Status */}
            {userProfile && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Your Borrowing Status
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-black text-blue-800">Books in use</div>
                    <div className="text-2xl font-black text-blue-900">
                      {userBooksCount} / {maxBooks}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-blue-800">Available slots</div>
                    <div className="text-2xl font-black text-green-600">{maxBooks - userBooksCount}</div>
                  </div>
                </div>
                {!canUserBorrowMore && (
                  <div className="mt-4 text-sm font-bold text-red-800 bg-red-100 p-4 rounded-xl border-2 border-red-200">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    <strong>WARNING:</strong> You have reached the maximum limit of {maxBooks} books. Please return some books before borrowing more.
                  </div>
                )}
              </div>
            )}

            {/* Availability Information */}
            <div className="bg-white/80 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Book Availability
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {book.copies && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 shadow-md">
                    <div className="text-sm font-black text-blue-900">Total Copies</div>
                    <div className="text-3xl font-black text-blue-700">{book.copies}</div>
                    <div className="text-xs font-bold text-blue-600">Total inventory</div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 shadow-md">
                  <div className="text-sm font-black text-green-900">Available to Borrow</div>
                  <div className="text-3xl font-black text-green-700">{book.books_available || 0}</div>
                  <div className="text-xs font-bold text-green-600">Books in library</div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200 shadow-md">
                  <div className="text-sm font-black text-red-900">Currently Borrowed</div>
                  <div className="text-3xl font-black text-red-700">{book.books_issued || 0}</div>
                  <div className="text-xs font-bold text-red-600">Books issued to students</div>
                </div>
              </div>

              {book.total_issued_books && (
                <div className="text-sm font-bold text-gray-700 bg-gray-100 p-4 rounded-xl border border-gray-200 flex items-center mt-4">
                  <BookCheck className="h-4 w-4 mr-2" />
                  <span className="font-black">Status:</span>&nbsp;{book.total_issued_books}
                </div>
              )}

              {/* Availability Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-black text-blue-900">Availability Summary</span>
                  </div>
                </div>
                <div className="mt-3 text-sm font-bold">
                  {book.books_available && book.books_available > 0 ? (
                    <span className="text-green-800 font-black">
                      {book.books_available} book{book.books_available !== 1 ? "s" : ""} available to borrow
                    </span>
                  ) : (
                    <span className="text-red-800 font-black">
                      No books available - All {book.books_issued || 0} copies are currently borrowed by students
                    </span>
                  )}
                </div>
              </div>
            </div>

            {book.description && (
              <div className="bg-white/80 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-xl font-black text-gray-900 mb-4">Description</h3>
                <p className="text-gray-800 leading-relaxed font-medium text-base">{book.description}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                className="flex-1 h-14 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-700"
                disabled={
                  !isBookAvailable(book.status) || loading || (book.books_available || 0) === 0 || !canUserBorrowMore
                }
                onClick={handleReserve}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                {!canUserBorrowMore
                  ? "Borrowing Limit Reached"
                  : isBookAvailable(book.status) && (book.books_available || 0) > 0
                    ? "Reserve Book"
                    : "Not Available"}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="h-14 px-8 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-black text-lg rounded-2xl shadow-lg transition-all duration-300"
              >
                Close
              </Button>
            </div>

            {/* Warning Messages */}
            {!canUserBorrowMore && (
              <div className="text-sm font-bold text-red-800 bg-red-100 p-4 rounded-xl border-2 border-red-200 flex items-center shadow-md">
                <AlertCircle className="h-4 w-4 mr-2" />
                <div>
                  <span className="font-black">Borrowing Limit Reached:</span> You have {userBooksCount} books (borrowed + requested) out
                  of the maximum {maxBooks} allowed. Please return some books before borrowing more.
                </div>
              </div>
            )}

            {(book.books_available || 0) === 0 && (
              <div className="text-sm font-bold text-red-800 bg-red-100 p-4 rounded-xl border-2 border-red-200 flex items-center shadow-md">
                <BookCheck className="h-4 w-4 mr-2" />
                <div>
                  <span className="font-black">Note:</span> All copies are currently borrowed by students.
                  {book.books_issued && book.books_issued > 0 && (
                    <span>
                      {" "}
                      {book.books_issued} book{book.books_issued !== 1 ? "s are" : " is"} currently issued.
                    </span>
                  )}{" "}
                  Please check back later or contact the library.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
