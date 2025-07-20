"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import type { SocketEvents } from "@/types/chat"

export function useSocket(token: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket<SocketEvents> | null>(null)

  useEffect(() => {
    if (!token) {
      console.log("No token provided, skipping socket connection")
      return
    }

    console.log("Attempting to connect to socket server...")
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://vintage-chat-app.onrender.com"
    console.log("Socket URL:", socketUrl)

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket connected successfully!")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    return () => {
      console.log("Cleaning up socket connection")
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  return {
    socket: socketRef.current,
    isConnected,
  }
}
