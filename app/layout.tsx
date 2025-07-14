import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Library Management System",
  description: "Institutional Library Management Portal",
  manifest: "/manifest.json",
  themeColor: "#1e3a8a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Library System",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=3",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        url: "/favicon-16.png?v=3",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32.png?v=3",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=3",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico?v=3",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  generator: "usham.roy",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Force favicon refresh with cache busting */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />

        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Library System" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />

        {/* Android PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Library System" />

        {/* Microsoft PWA */}
        <meta name="msapplication-TileColor" content="#1e3a8a" />
        <meta name="msapplication-TileImage" content="/favicon-32.png?v=3" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
