"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function MathCaptcha({ onVerify, disabled = false }: MathCaptchaProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [operator, setOperator] = useState("+")
  const [userAnswer, setUserAnswer] = useState("")
  const [isValid, setIsValid] = useState(false)

  const generateProblem = () => {
    const operators = ["+", "-", "*"]
    const selectedOperator = operators[Math.floor(Math.random() * operators.length)]

    let n1, n2

    if (selectedOperator === "+") {
      n1 = Math.floor(Math.random() * 50) + 1
      n2 = Math.floor(Math.random() * 50) + 1
    } else if (selectedOperator === "-") {
      n1 = Math.floor(Math.random() * 50) + 25
      n2 = Math.floor(Math.random() * 25) + 1
    } else {
      // multiplication
      n1 = Math.floor(Math.random() * 12) + 1
      n2 = Math.floor(Math.random() * 12) + 1
    }

    setNum1(n1)
    setNum2(n2)
    setOperator(selectedOperator)
    setUserAnswer("")
    setIsValid(false)
    onVerify(false)
  }

  useEffect(() => {
    generateProblem()
  }, [])

  useEffect(() => {
    let correctAnswer
    switch (operator) {
      case "+":
        correctAnswer = num1 + num2
        break
      case "-":
        correctAnswer = num1 - num2
        break
      case "*":
        correctAnswer = num1 * num2
        break
      default:
        correctAnswer = 0
    }

    const answer = Number.parseInt(userAnswer)
    const valid = answer === correctAnswer && userAnswer !== ""
    setIsValid(valid)
    onVerify(valid)
  }, [userAnswer, num1, num2, operator, onVerify])

  return (
    <div className="space-y-3">
      <Label htmlFor="math-captcha" className="text-sm font-medium text-gray-700">
        Math Verification
      </Label>

      <div className="flex items-center gap-3">
        <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded font-mono text-lg">
          {num1} {operator} {num2} = ?
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generateProblem} disabled={disabled}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Input
        id="math-captcha"
        type="number"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Enter your answer"
        disabled={disabled}
        className={isValid ? "border-green-500 bg-green-50" : ""}
      />

      {isValid && <p className="text-sm text-green-600 font-medium">✓ Math verification successful</p>}
    </div>
  )
}
