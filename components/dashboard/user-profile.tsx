"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, User, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { libraryAPI, type UserProfile as UserProfileType } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"

export function UserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const userProfile = await libraryAPI.getUserProfile()
      setProfile(userProfile)
      console.log("SUCCESS: User profile loaded:", userProfile)
    } catch (err) {
      console.error("ERROR: Failed to load user profile:", err)
      setError(err instanceof Error ? err.message : "Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading profile...</span>
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
                <User className="mr-2 h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>Your account information and library statistics</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadUserProfile} disabled={loading}>
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

      {profile && (
        <>
          {/* Basic Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User ID:</span>
                  <p className="text-gray-900">{profile.uid}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Timezone:</span>
                  <p className="text-gray-900">{profile.timezone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Member Since:</span>
                  <p className="text-gray-900">{formatDate(profile.created)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-900">{formatDate(profile.changed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Borrowing Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Borrowing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{profile.borrowed_books_count || 0}</div>
                    <div className="text-sm text-blue-800">Books in Use</div>
                    <div className="text-xs text-blue-600">Currently issued books</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(profile.max_books_allowed || 4) - (profile.borrowed_books_count || 0)}
                    </div>
                    <div className="text-sm text-green-800">Available Limit</div>
                    <div className="text-xs text-green-600">out of {profile.max_books_allowed || 4} maximum</div>
                  </div>
                </div>

                {(profile.borrowed_books_count || 0) >= (profile.max_books_allowed || 4) && (
                  <Alert className="border-yellow-300 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You have reached the maximum borrowing limit of {profile.max_books_allowed || 4} books. Please
                      return some books before borrowing more.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
