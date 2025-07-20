# 🔄 Actualizar Frontend para usar Backend en Render

Una vez que tengas tu backend desplegado en Render, sigue estos pasos para actualizar el frontend:

## 📝 **Paso 1: Obtener la URL del Backend**

Tu backend estará disponible en una URL como:
`https://vintage-chat-backend.onrender.com`

## 🔧 **Paso 2: Actualizar useSocket.ts**

```typescript
// hooks/useSocket.ts
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
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://vintage-chat-backend.onrender.com"
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
```

## 🔧 **Paso 3: Actualizar useChat.ts**

```typescript
// hooks/useChat.ts
// Reemplazar el contenido actual con el código original que usa Socket.io
"use client"

import { useCallback, useEffect, useReducer } from "react"
import { useSocket } from "./useSocket"
import type { ChatState, Message, Room, User } from "@/types/chat"

// ... resto del código original del useChat
```

## 🔧 **Paso 4: Actualizar services/auth.ts**

```typescript
// services/auth.ts
class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://vintage-chat-backend.onrender.com"
  
  // ... resto del código
}
```

## 🔧 **Paso 5: Actualizar _redirects**

```
# Manejar rutas de SPA
/*    /index.html   200

# Redirigir API calls al backend en Render
/api/*  https://vintage-chat-backend.onrender.com/api/:splat  200
```

## 🚀 **Paso 6: Reconstruir y Desplegar**

```bash
# Construir
npm run build

# Desplegar en Cloudflare Pages
wrangler pages deploy out
```

## ✅ **Resultado Final**

- **Frontend**: Cloudflare Pages (rápido)
- **Backend**: Render (con Redis y WebSockets)
- **Base de datos**: Redis en Render
- **Funcionalidad completa**: Chat en tiempo real con persistencia

## 🔍 **Verificar Funcionamiento**

1. Abre la aplicación en Cloudflare Pages
2. Regístrate o inicia sesión
3. Verifica que los mensajes se envíen y reciban en tiempo real
4. Verifica que los mensajes persistan al recargar la página 