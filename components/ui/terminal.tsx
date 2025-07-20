"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Terminal({ children, className, title = "VINTAGE_CHAT_v1.0" }: TerminalProps) {
  return (
    <div
      className={cn(
        "bg-black border-2 border-green-500 rounded-xl overflow-hidden shadow-2xl",
        "font-mono text-green-400 relative backdrop-blur-sm",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-green-500/5 before:to-transparent before:pointer-events-none",
        "flex flex-col h-full",
        "ring-1 ring-green-500/20",
        className,
      )}
    >
      {/* Terminal Header */}
      <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-500 text-black px-4 py-3 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-inner animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-inner animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-green-600 rounded-full shadow-inner animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-sm font-bold tracking-wider drop-shadow-sm">{title}</span>
        </div>

        <div className="flex items-center space-x-2 relative z-10">
          <div className="w-2 h-2 bg-black/20 rounded-full"></div>
          <div className="w-2 h-2 bg-black/20 rounded-full"></div>
          <div className="w-2 h-2 bg-black/20 rounded-full"></div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 bg-black relative overflow-hidden">
        {children}

        {/* Enhanced Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/3 to-transparent animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/2 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>

          {/* CRT scanlines */}
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-px bg-green-500"
                style={{ top: `${i * 2}%` }}
              ></div>
            ))}
          </div>

          {/* Corner glow effects */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-500/10 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-green-500/10 to-transparent"></div>
        </div>
      </div>
    </div>
  )
}

export interface TerminalLineProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
  type?: "input" | "output" | "system" | "error"
}

export function TerminalLine({
  children,
  className,
  prefix = "$",
  type = "system"
}: TerminalLineProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "input":
        return "text-green-400 font-semibold"
      case "output":
        return "text-blue-400"
      case "error":
        return "text-red-400"
      case "system":
      default:
        return "text-green-400"
    }
  }

  return (
    <div className={cn("flex items-start space-x-2 py-1", className)}>
      <span className="text-green-600 font-bold flex-shrink-0">{prefix}</span>
      <span className={cn("flex-1", getTypeStyles())}>
        {children}
      </span>
    </div>
  )
}
