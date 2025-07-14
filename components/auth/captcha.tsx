"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

interface CaptchaProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function Captcha({ onVerify, disabled = false }: CaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isValid, setIsValid] = useState(false)

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    setUserInput("")
    setIsValid(false)
    onVerify(false)
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    const valid = userInput.toLowerCase() === captchaText.toLowerCase() && userInput !== ""
    setIsValid(valid)
    onVerify(valid)
  }, [userInput, captchaText, onVerify])

  return (
    <div className="space-y-3">
      <Label htmlFor="captcha" className="text-sm font-medium text-gray-700">
        Security Verification
      </Label>

      <div className="flex items-center gap-3">
        <div className="bg-gray-100 border-2 border-gray-300 px-4 py-2 rounded font-mono text-lg tracking-wider select-none">
          {captchaText}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generateCaptcha} disabled={disabled}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Input
        id="captcha"
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter the text above"
        disabled={disabled}
        className={isValid ? "border-green-500 bg-green-50" : ""}
      />

      {isValid && <p className="text-sm text-green-600 font-medium">✓ Verification successful</p>}
    </div>
  )
}
