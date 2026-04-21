import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/nav"
import { auth } from "@/auth"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Goal Tracker",
  description: "Personal goal tracking with AI-powered reviews",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {session?.user && <Nav />}
        <main style={{ flex: 1, padding: "24px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  )
}
