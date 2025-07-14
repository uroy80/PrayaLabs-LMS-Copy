"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Globe, RefreshCw, CheckCircle, XCircle, Info } from "lucide-react"
import { API_CONFIG, APP_CONFIG, ENV, DEBUG } from "@/lib/config"

export function ApiConfigDebug() {
  const [testUrl, setTestUrl] = useState(API_CONFIG.BASE_URL)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    responseTime?: number
  } | null>(null)

  const testApiConnection = async () => {
    setTesting(true)
    setTestResult(null)

    const startTime = Date.now()

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/jsonapi/lmsbook/lmsbook?page[limit]=1",
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }),
      })

      const result = await response.json()
      const responseTime = Date.now() - startTime

      if (result.success) {
        setTestResult({
          success: true,
          message: "API connection successful",
          responseTime,
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || "API connection failed",
          responseTime,
        })
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`,
        responseTime,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Environment</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mode:</span>
                  <Badge variant={ENV.IS_PRODUCTION ? "default" : "secondary"}>{process.env.NODE_ENV}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Debug:</span>
                  <Badge variant={DEBUG.ENABLED ? "destructive" : "secondary"}>
                    {DEBUG.ENABLED ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client:</span>
                  <Badge variant={ENV.IS_CLIENT ? "default" : "secondary"}>
                    {ENV.IS_CLIENT ? "Browser" : "Server"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Application</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-mono">{APP_CONFIG.NAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Version:</span>
                  <span className="text-sm font-mono">{APP_CONFIG.VERSION}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Configuration
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Base URL</label>
                <div className="mt-1 font-mono text-sm bg-white p-2 rounded border">{API_CONFIG.BASE_URL}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Timeout</label>
                <div className="mt-1 text-sm text-gray-600">{API_CONFIG.TIMEOUT / 1000} seconds</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Retry Attempts</label>
                <div className="mt-1 text-sm text-gray-600">{API_CONFIG.RETRY_ATTEMPTS}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Connection Test</h3>

            <div className="flex gap-2">
              <Input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="API Base URL"
                className="flex-1"
                disabled={testing}
              />
              <Button onClick={testApiConnection} disabled={testing} className="min-w-[120px]">
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Test API
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  <div className="space-y-1">
                    <div>{testResult.message}</div>
                    {testResult.responseTime && (
                      <div className="text-xs">Response time: {testResult.responseTime}ms</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Available Endpoints</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(API_CONFIG.ENDPOINTS).map(([key, endpoint]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="font-mono text-gray-600">{endpoint}</span>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Environment Variables:</div>
                <div className="text-sm space-y-1">
                  <div>
                    • <code>NEXT_PUBLIC_LIBRARY_API_URL</code> - API base URL
                  </div>
                  <div>
                    • <code>NEXT_PUBLIC_APP_NAME</code> - Application name
                  </div>
                  <div>
                    • <code>NEXT_PUBLIC_APP_VERSION</code> - Application version
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Update these values in your <code>.env.local</code> file to change the configuration.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
