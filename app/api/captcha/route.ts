import { type NextRequest, NextResponse } from "next/server"

// Enhanced CAPTCHA generation with more complexity
function generateCaptcha(): { text: string; svg: string } {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let text = ""
  for (let i = 0; i < 5; i++) {
    text += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  // Generate more complex SVG CAPTCHA with distortions
  const colors = ["#333", "#555", "#777", "#222", "#444"]
  const bgColors = ["#f0f0f0", "#e8e8e8", "#f5f5f5", "#eeeeee"]

  const svg = `
    <svg width="150" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="noise" patternUnits="userSpaceOnUse" width="3" height="3">
          <circle cx="1.5" cy="1.5" r="0.5" fill="#ddd" opacity="0.4"/>
        </pattern>
        <filter id="roughpaper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence baseFrequency="0.04" numOctaves="5" result="noise" seed="1"/>
          <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="1">
            <feDistantLight azimuth="45" elevation="60"/>
          </feDiffuseLighting>
        </filter>
      </defs>
      
      <!-- Background with texture -->
      <rect width="150" height="60" fill="${bgColors[Math.floor(Math.random() * bgColors.length)]}" filter="url(#roughpaper)" opacity="0.8"/>
      <rect width="150" height="60" fill="url(#noise)"/>
      
      <!-- Random background lines for distraction -->
      ${Array.from(
        { length: 3 },
        (_, i) => `
        <line x1="${Math.random() * 150}" y1="${Math.random() * 60}" 
              x2="${Math.random() * 150}" y2="${Math.random() * 60}" 
              stroke="#ccc" stroke-width="${Math.random() * 2 + 0.5}" opacity="0.6"/>
      `,
      ).join("")}
      
      <!-- Random dots for distraction -->
      ${Array.from(
        { length: 8 },
        (_, i) => `
        <circle cx="${Math.random() * 150}" cy="${Math.random() * 60}" 
                r="${Math.random() * 2 + 1}" fill="#ddd" opacity="0.5"/>
      `,
      ).join("")}
      
      <!-- Main text with individual character transformations -->
      <g font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">
        ${text
          .split("")
          .map((char, i) => {
            const x = 25 + i * 25
            const y = 35
            const rotation = Math.random() * 30 - 15
            const color = colors[Math.floor(Math.random() * colors.length)]
            const skew = Math.random() * 10 - 5
            return `
              <text x="${x}" y="${y}" 
                    fill="${color}" 
                    transform="rotate(${rotation} ${x} ${y}) skewX(${skew})"
                    opacity="0.9">
                ${char}
              </text>
            `
          })
          .join("")}
      </g>
      
      <!-- Additional distraction lines over text -->
      ${Array.from(
        { length: 2 },
        (_, i) => `
        <line x1="10" y1="${Math.random() * 60}" 
              x2="140" y2="${Math.random() * 60}" 
              stroke="#999" stroke-width="1" opacity="0.4"/>
      `,
      ).join("")}
      
      <!-- Random shapes for complexity -->
      ${Array.from(
        { length: 3 },
        (_, i) => `
        <ellipse cx="${Math.random() * 150}" cy="${Math.random() * 60}" 
                 rx="${Math.random() * 8 + 2}" ry="${Math.random() * 8 + 2}" 
                 fill="none" stroke="#ccc" stroke-width="1" opacity="0.3"/>
      `,
      ).join("")}
    </svg>
  `

  return { text, svg }
}

// Store CAPTCHAs temporarily (in production, use Redis or database)
const captchaStore = new Map<string, { text: string; expires: number; attempts: number }>()

// Clean expired CAPTCHAs
setInterval(() => {
  const now = Date.now()
  for (const [id, data] of captchaStore.entries()) {
    if (data.expires < now) {
      captchaStore.delete(id)
    }
  }
}, 60000) // Clean every minute

export async function GET() {
  try {
    const { text, svg } = generateCaptcha()
    const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

    // Store CAPTCHA for 10 minutes with attempt tracking
    captchaStore.set(id, {
      text: text.toLowerCase(),
      expires: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    })

    return NextResponse.json({
      id,
      svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    })
  } catch (error) {
    console.error("CAPTCHA generation error:", error)
    return NextResponse.json({ error: "Failed to generate CAPTCHA" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, answer } = await request.json()

    if (!id || !answer) {
      return NextResponse.json({ error: "Missing CAPTCHA ID or answer" }, { status: 400 })
    }

    const stored = captchaStore.get(id)

    if (!stored) {
      return NextResponse.json({ error: "CAPTCHA expired or invalid" }, { status: 400 })
    }

    if (stored.expires < Date.now()) {
      captchaStore.delete(id)
      return NextResponse.json({ error: "CAPTCHA expired" }, { status: 400 })
    }

    // Increment attempt counter
    stored.attempts += 1

    // Limit attempts to prevent brute force
    if (stored.attempts > 5) {
      captchaStore.delete(id)
      return NextResponse.json({ error: "Too many attempts. Please refresh and try again." }, { status: 429 })
    }

    const isValid = stored.text === answer.toLowerCase().trim()

    if (isValid) {
      // Remove CAPTCHA after successful verification
      captchaStore.delete(id)
      return NextResponse.json({ valid: true })
    } else {
      // Update the stored data with new attempt count
      captchaStore.set(id, stored)
      return NextResponse.json({
        valid: false,
        attemptsRemaining: 5 - stored.attempts,
      })
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error)
    return NextResponse.json({ error: "Failed to verify CAPTCHA" }, { status: 500 })
  }
}
