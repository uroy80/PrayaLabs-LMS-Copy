"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Clock, Bell, CheckCircle, AlertTriangle, X } from "lucide-react"
import { ICSGenerator } from "@/lib/ics-generator"

interface CalendarReminderModalProps {
  isOpen: boolean
  onClose: () => void
  bookTitle: string
  authorName: string
  dueDate: Date
  onReminderCreated?: () => void
}

export function CalendarReminderModal({
  isOpen,
  onClose,
  bookTitle,
  authorName,
  dueDate,
  onReminderCreated,
}: CalendarReminderModalProps) {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success">("idle")

  const handleSingleReminder = () => {
    setDownloadStatus("downloading")
    try {
      ICSGenerator.generateBookReminderAndDownload(bookTitle, authorName, dueDate)
      setDownloadStatus("success")
      onReminderCreated?.()

      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Failed to generate reminder:", error)
      setDownloadStatus("idle")
    }
  }

  const handleMultipleReminders = () => {
    setDownloadStatus("downloading")
    try {
      ICSGenerator.generateAndDownloadMultipleReminders(bookTitle, authorName, dueDate)
      setDownloadStatus("success")
      onReminderCreated?.()

      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Failed to generate reminders:", error)
      setDownloadStatus("idle")
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getReminderDate = (daysBefore: number) => {
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - daysBefore)
    return reminderDate
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
        {/* Mobile-optimized header with close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <DialogHeader className="flex-1 text-left space-y-1">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Set Calendar Reminder
            </DialogTitle>
            <DialogDescription className="text-sm">
              Add reminders to your calendar so you don't forget to return your book on time.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Book Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 text-base line-clamp-2">{bookTitle}</h3>
            <p className="text-sm text-blue-700 mb-2">by {authorName}</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-800">Due: {formatDate(dueDate)}</span>
            </div>
          </div>

          {/* Reminder Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-base">Choose Reminder Type:</h4>

            {/* Single Reminder Option */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Single Reminder</h5>
                  <p className="text-sm text-gray-600 mb-2">Get reminded 3 days before the due date</p>
                  <div className="flex items-start gap-2">
                    <Bell className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-orange-700 font-medium">
                      {formatDate(getReminderDate(3))} at 9:00 AM
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleSingleReminder}
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  disabled={downloadStatus === "downloading"}
                >
                  {downloadStatus === "downloading" ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-pulse" />
                      Creating...
                    </>
                  ) : downloadStatus === "success" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Reminder
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Multiple Reminders Option */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-gray-900">Multiple Reminders</h5>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Get reminded at 7 days, 3 days, and 1 day before due date
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Bell className="h-3 w-3 text-blue-500 flex-shrink-0 mt-1" />
                      <span className="text-xs text-blue-700">{formatDate(getReminderDate(7))} - First Notice</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Bell className="h-3 w-3 text-orange-500 flex-shrink-0 mt-1" />
                      <span className="text-xs text-orange-700">{formatDate(getReminderDate(3))} - Important</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0 mt-1" />
                      <span className="text-xs text-red-700">{formatDate(getReminderDate(1))} - Urgent</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleMultipleReminders}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={downloadStatus === "downloading"}
                >
                  {downloadStatus === "downloading" ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-pulse" />
                      Creating...
                    </>
                  ) : downloadStatus === "success" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-white" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download All Reminders
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">How to use:</h5>
            <ol className="text-xs text-gray-600 space-y-1 pl-4">
              <li>1. Click "Download" to save the calendar file (.ics)</li>
              <li>2. Open the file with your calendar app (Google Calendar, Outlook, Apple Calendar)</li>
              <li>3. The reminders will be automatically added to your calendar</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full bg-transparent border-2 border-gray-300 hover:bg-gray-50"
            >
              Skip Reminders
            </Button>
          </div>
        </div>

        {/* Mobile-friendly bottom padding */}
        <div className="h-4"></div>
      </DialogContent>
    </Dialog>
  )
}
