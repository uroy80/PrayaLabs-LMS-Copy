"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, AlertCircle, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginErrorPage() {
  const router = useRouter()

  const handleRetry = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-red-600 rounded-xl shadow-lg">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Authentication Failed</h1>
            <p className="text-gray-600 mt-2">Unable to access the library system</p>
          </div>
        </div>

        <Card className="shadow-lg border-red-200">
          <CardHeader className="text-center pb-6 bg-red-50 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-red-900">Login Error</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">Wrong Credentials</h2>
                <p className="text-red-700">
                  The username or password you entered is incorrect. Please check your credentials and try again.
                </p>
              </div>

              <Button
                onClick={handleRetry}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Try Again
              </Button>

              <div className="text-sm text-gray-600">
                <p>Need help? Contact your library administrator.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Library Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 text-gray-500">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm">Library Management System</span>
          </div>
        </div>
      </div>
    </div>
  )
}
