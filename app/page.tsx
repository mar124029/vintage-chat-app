"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ChatInterface } from "@/components/chat/chat-interface"
import { authService } from "@/services/auth"

export default function Home() {
  const [token, setToken] = useState<string | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = authService.getToken()
      if (savedToken) {
        const isValid = await authService.validateToken(savedToken)
        if (isValid) {
          setToken(savedToken)
        } else {
          authService.removeToken()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    setToken(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono text-xl animate-pulse">LOADING VINTAGE CHAT...</div>
      </div>
    )
  }

  if (token) {
    return <ChatInterface token={token} onLogout={handleLogout} />
  }

  return isLogin ? (
    <LoginForm onLogin={handleLogin} onToggleMode={() => setIsLogin(false)} />
  ) : (
    <RegisterForm onRegister={handleLogin} onToggleMode={() => setIsLogin(true)} />
  )
}
