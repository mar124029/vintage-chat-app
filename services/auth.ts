export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  username: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
  }
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth` : "https://vintage-chat-app.onrender.com/api/auth"

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Login failed")
    }

    return response.json()
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Registration failed")
    }

    return response.json()
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("chat_token")
  }

  setToken(token: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("chat_token", token)
  }

  removeToken(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("chat_token")
  }
}

export const authService = new AuthService()
