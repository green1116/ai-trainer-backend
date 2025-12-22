import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Trainer Backend API",
  description: "震动训练系统后端API",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

