"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Search, Loader2, Database, Wifi } from "lucide-react"

export function SearchLoadingState() {
  return (
    <div className="space-y-4">
      {/* Animated Search Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-5 w-5 text-blue-600" />
              <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-ping"></div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">Searching Library Database</div>
              <div className="text-xs text-blue-700">Please wait while we fetch the latest book information...</div>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
      </div>
    </div>
  )
}

export function DataLoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <Database className="h-12 w-12 text-blue-600" />
        <div className="absolute -inset-2 rounded-full border-4 border-blue-200 animate-spin border-t-blue-600"></div>
      </div>
      <div className="text-center">
        <div className="text-lg font-medium text-gray-900">{message}</div>
        <div className="text-sm text-gray-600 mt-1">Connecting to library server...</div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Wifi className="h-3 w-3" />
        <span>Secure connection established</span>
      </div>
    </div>
  )
}

export function BookGridLoadingState({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <BookOpen className="h-8 w-8 text-gray-300" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PulsingDots() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: "0.1s" }}></div>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
    </div>
  )
}

export function LoadingSpinner({ size = "md", message }: { size?: "sm" | "md" | "lg"; message?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className="flex items-center gap-3">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  )
}
