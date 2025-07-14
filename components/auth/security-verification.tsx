"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Shield, CheckCircle } from "lucide-react"

interface SecurityVerificationProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function SecurityVerification({ onVerify, disabled = false }: SecurityVerificationProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [isVerified, setIsVerified] = useState(false)

  const generateNewProblem = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setUserAnswer("")
    setIsVerified(false)
    onVerify(false)
  }

  useEffect(() => {
    generateNewProblem()
  }, [])

  useEffect(() => {
    const answer = Number.parseInt(userAnswer)
    const correctAnswer = num1 + num2
    const isCorrect = answer === correctAnswer && userAnswer !== ""

    setIsVerified(isCorrect)
    onVerify(isCorrect)
  }, [userAnswer, num1, num2, onVerify])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-black text-gray-900">
        <Shield className="h-4 w-4" />
        <span>Security Verification</span>
        {isVerified && (
          <div className="flex items-center gap-1 text-green-700 font-black">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-black">Verified</span>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-2 border-gray-200 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="captcha" className="text-sm text-gray-800 font-black mb-2 block">
              Please solve this math problem:
            </Label>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white px-4 py-3 rounded-lg border-2 border-gray-300 font-mono text-lg font-black text-gray-900 shadow-sm">
                {num1} + {num2} = ?
              </div>
            </div>
            <Input
              id="captcha"
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer"
              disabled={disabled}
              className={`h-10 ${
                isVerified
                  ? "border-2 border-green-500 bg-green-50 focus:border-green-600 focus:ring-2 focus:ring-green-500/20"
                  : "border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateNewProblem}
            disabled={disabled}
            className="h-10 px-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white shadow-sm"
            title="Generate new problem"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
