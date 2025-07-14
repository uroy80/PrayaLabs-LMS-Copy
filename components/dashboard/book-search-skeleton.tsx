"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Search } from "lucide-react"

interface BookSearchSkeletonProps {
  count?: number
}

export function BookSearchSkeleton({ count = 6 }: BookSearchSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search Card Skeleton */}
      <Card className="border border-gray-300 shadow-sm bg-white">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-900" />
              <span className="font-semibold text-gray-900">Search Library</span>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Search Input Skeleton */}
            <div className="relative">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 flex-1 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded" />
                <Skeleton className="h-10 w-20 rounded" />
              </div>
            </div>

            {/* Search Tips Skeleton */}
            <Skeleton className="h-8 w-full rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Loading Status */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <div className="text-sm text-blue-900">Loading books from library database...</div>
        </div>
      </div>

      {/* Book Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function BookCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <BookOpen className="h-8 w-8 text-gray-300 flex-shrink-0" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />

          {/* Availability Info Skeleton */}
          <div className="flex justify-end">
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Buttons Skeleton */}
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-9 flex-1 rounded" />
            <Skeleton className="h-9 w-20 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
