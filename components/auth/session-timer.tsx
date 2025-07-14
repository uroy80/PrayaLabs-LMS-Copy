"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "./auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, LogOut, Shield, X } from "lucide-react"

export function SessionTimer() {
  const { sessionTimeRemaining, logout, user, updateSessionTime } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [showActiveTimer, setShowActiveTimer] = useState(true)
  const [warningDismissed, setWarningDismissed] = useState(false)
  const [finalWarningDismissed, setFinalWarningDismissed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes
  const WARNING_TIME = 2 * 60 * 1000 // 2 minutes
  const FINAL_WARNING_TIME = 5 * 1000 // 5 seconds

  // Update timer every second for smooth countdown
  useEffect(() => {
    if (!user) {
      // Clear timer if no user
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Update immediately on mount
    updateSessionTime()

    // Then update every second
    timerRef.current = setInterval(() => {
      updateSessionTime()
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [user]) // Only depend on user, not updateSessionTime to avoid infinite loop

  // Show warning when time is running low
  useEffect(() => {
    if (sessionTimeRemaining <= WARNING_TIME && sessionTimeRemaining > FINAL_WARNING_TIME) {
      // Show warning if not dismissed
      if (!warningDismissed) {
        setShowWarning(true)
      }
    } else if (sessionTimeRemaining <= FINAL_WARNING_TIME && sessionTimeRemaining > 0) {
      // Show final warning if not dismissed
      if (!finalWarningDismissed) {
        setShowWarning(true)
      }
    } else {
      setShowWarning(false)
    }
  }, [sessionTimeRemaining, warningDismissed, finalWarningDismissed])

  // Reset dismissal flags when session resets
  useEffect(() => {
    if (sessionTimeRemaining > WARNING_TIME) {
      setWarningDismissed(false)
      setFinalWarningDismissed(false)
    }
  }, [sessionTimeRemaining])

  const handleWarningDismiss = () => {
    setShowWarning(false)
    if (sessionTimeRemaining <= FINAL_WARNING_TIME) {
      setFinalWarningDismissed(true)
    } else {
      setWarningDismissed(true)
    }
  }

  const toggleActiveTimer = () => {
    setShowActiveTimer(!showActiveTimer)
  }

  if (!user || sessionTimeRemaining <= 0) {
    return null
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressValue = (sessionTimeRemaining / SESSION_DURATION) * 100
  const isFinalWarning = sessionTimeRemaining <= FINAL_WARNING_TIME

  if (showWarning) {
    return (
      <div className="fixed top-2 right-2 left-2 md:top-6 md:right-6 md:left-auto z-50 md:w-96 w-auto">
        <Alert variant="destructive" className="border-orange-300 bg-orange-50 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWarningDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-orange-100 rounded-full"
          >
            <X className="h-3 w-3 text-orange-600" />
          </Button>
          <AlertDescription>
            <div className="space-y-4 pr-6">
              <div>
                <div className="font-semibold text-orange-800 text-sm md:text-base">
                  {isFinalWarning ? "Session Expiring Now!" : "Session Expiration Warning"}
                </div>
                <div className="text-xs md:text-sm text-orange-700 mt-1">
                  Your session will expire in {formatTime(sessionTimeRemaining)}
                  {isFinalWarning && " - Please save your work!"}
                </div>
              </div>
              <Progress value={progressValue} className="h-2 bg-orange-200" />
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logout}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs md:text-sm py-1 h-8"
                >
                  <LogOut className="h-3 w-3 mr-1 md:mr-2" />
                  Sign Out Now
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show shield icon when timer is hidden
  if (!showActiveTimer) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={toggleActiveTimer}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-900 hover:bg-blue-800 text-white shadow-lg"
          title="Show session timer"
        >
          <Shield className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white border border-gray-300 rounded-lg p-3 md:p-4 shadow-lg relative max-w-[calc(100vw-2rem)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleActiveTimer}
          className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
        >
          <X className="h-3 w-3 text-gray-600" />
        </Button>
        <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-700 pr-6">
          <Shield className="h-4 w-4 text-blue-900 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">Active Session</div>
            <div className="text-xs text-gray-500">Time Remaining: {formatTime(sessionTimeRemaining)}</div>
          </div>
        </div>
        <Progress value={progressValue} className="h-1 mt-2 md:mt-3 bg-gray-200" />
      </div>
    </div>
  )
}
