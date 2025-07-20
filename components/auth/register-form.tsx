"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Terminal, TerminalLine } from "@/components/ui/terminal"
import { authService } from "@/services/auth"

interface RegisterFormProps {
  onRegister: (token: string) => void
  onToggleMode: () => void
}

export function RegisterForm({ onRegister, onToggleMode }: RegisterFormProps) {
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await authService.register(credentials)
      authService.setToken(response.token)
      onRegister(response.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Terminal className="w-full max-w-md" title="REGISTER_TERMINAL">
        <div className="space-y-4">
          <TerminalLine prefix="$" type="system">
            NEW USER REGISTRATION
          </TerminalLine>
          <TerminalLine prefix="$" type="system">
            Creating new account...
          </TerminalLine>

          {error && (
            <TerminalLine prefix="!" type="error">
              ERROR: {error}
            </TerminalLine>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <TerminalLine prefix=">" type="input">
                USERNAME:
              </TerminalLine>
              <Input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                className="bg-black border-green-500 text-green-400 focus:border-green-300 font-mono"
                placeholder="vintage_user"
                required
              />
            </div>

            <div>
              <TerminalLine prefix=">" type="input">
                EMAIL:
              </TerminalLine>
              <Input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-black border-green-500 text-green-400 focus:border-green-300 font-mono"
                placeholder="user@vintage.chat"
                required
              />
            </div>

            <div>
              <TerminalLine prefix=">" type="input">
                PASSWORD:
              </TerminalLine>
              <Input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                className="bg-black border-green-500 text-green-400 focus:border-green-300 font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-black font-mono font-bold flex-1"
              >
                {isLoading ? "CREATING..." : "REGISTER"}
              </Button>
              <Button
                type="button"
                onClick={onToggleMode}
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono font-bold bg-transparent"
              >
                LOGIN
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-green-500/30">
            <TerminalLine prefix="$" type="system">
              Registration system ready...
            </TerminalLine>
          </div>
        </div>
      </Terminal>
    </div>
  )
}
