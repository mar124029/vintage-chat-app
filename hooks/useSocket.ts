"use client"

import { useEffect, useRef, useState } from "react"

// Mock socket para compatibilidad con Workers
export function useSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!token) {
      console.log("No token provided, skipping socket connection")
      return
    }

    console.log("Using Cloudflare Workers - WebSockets not available")
    console.log("Connection status will be managed by useChat hook")
    
    // Simular conexión exitosa para compatibilidad
    setIsConnected(true)

    return () => {
      console.log("Cleaning up mock socket connection")
      setIsConnected(false)
    }
  }, [token])

  return {
    socket: socketRef.current,
    isConnected,
  }
}
