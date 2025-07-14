"use client"

import { useState, useEffect } from "react"
import { QRCodeGenerator } from "@/lib/qr-generator"
import { QrCode } from "lucide-react"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  id?: string
}

export function QRCode({ value, size = 200, className = "", id }: QRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const generateQR = async () => {
      setLoading(true)
      setError(false)

      try {
        // Use QR Server API for generating QR codes
        const url = QRCodeGenerator.generateQRCodeURL(value, size)
        setQrUrl(url)
      } catch (err) {
        console.error("QR generation failed:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (value) {
      generateQR()
    }
  }, [value, size])

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-gray-200 bg-gray-50 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <QrCode className="h-8 w-8 mx-auto mb-2 animate-pulse text-gray-400" />
          <div className="text-xs text-gray-500">Generating...</div>
        </div>
      </div>
    )
  }

  if (error || !qrUrl) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-red-200 bg-red-50 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <QrCode className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <div className="text-xs text-red-500">Failed to generate</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <img
        id={id}
        src={qrUrl || "/placeholder.svg"}
        alt="QR Code"
        width={size}
        height={size}
        className="border border-gray-200 rounded"
        onError={() => setError(true)}
      />
    </div>
  )
}
