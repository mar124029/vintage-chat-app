import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vintage Chat App",
  description: "A retro-style chat application with vintage terminal aesthetics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/icons8-chat-16.png" />
      </head>
      <body className={`${inter.className} main-container`}>
        {children}
      </body>
    </html>
  )
}
