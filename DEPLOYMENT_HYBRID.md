# 🚀 Despliegue Híbrido con Redis

Esta guía te permite mantener Redis y Socket.io funcionando en producción.

## 🏗️ Arquitectura Híbrida

```
Frontend (Cloudflare Pages)
├── Next.js App Router
└── Componentes React

Backend (VPS/Heroku/Railway)
├── Express Server
├── Socket.io
└── Redis Connection

Cloudflare (Proxy)
└── DNS + CDN
```

## 📋 Opciones de Despliegue

### 1. Railway (Recomendado - Gratis)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto
railway init

# 4. Agregar Redis
railway add redis

# 5. Configurar variables de entorno
railway variables set JWT_SECRET=tu-secret-key
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
railway variables set FRONTEND_URL=https://tu-app.pages.dev

# 6. Desplegar
railway up
```

### 2. Render (Gratis)

```bash
# 1. Conectar repositorio a Render
# 2. Crear Web Service
# 3. Configurar:
#    - Build Command: npm install
#    - Start Command: npm start
#    - Environment: Node.js

# 4. Agregar Redis Database
# 5. Configurar variables de entorno
```

### 3. Heroku (Pago)

```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Crear app
heroku create tu-chat-app

# 4. Agregar Redis
heroku addons:create heroku-redis:hobby-dev

# 5. Configurar variables
heroku config:set JWT_SECRET=tu-secret-key
heroku config:set FRONTEND_URL=https://tu-app.pages.dev

# 6. Desplegar
git push heroku main
```

### 4. DigitalOcean App Platform

```bash
# 1. Crear app en DigitalOcean
# 2. Conectar repositorio
# 3. Configurar:
#    - Source: GitHub
#    - Branch: main
#    - Build Command: npm install
#    - Run Command: npm start

# 4. Agregar Redis Database
# 5. Configurar variables de entorno
```

## 🔧 Configuración del Frontend

### Actualizar useChat.ts para usar Socket.io original:

```typescript
// hooks/useChat.ts
import { useSocket } from "./useSocket"

export function useChat(token: string | null) {
  const { socket, isConnected } = useSocket(token)
  
  // Usar Socket.io en lugar de REST API
  const sendMessage = useCallback((content: string, recipientId?: string) => {
    if (!socket || !state.currentUser) return
    
    socket.emit("send-message", {
      content,
      senderId: state.currentUser.id,
      recipientId,
      type: recipientId ? "private" : "public"
    })
  }, [socket, state.currentUser])
  
  // ... resto del código original
}
```

### Actualizar services/auth.ts:

```typescript
// services/auth.ts
class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://tu-backend.railway.app"
  
  // ... resto del código
}
```

## 🌐 Configuración de DNS

### Opción A: Cloudflare DNS (Recomendado)

1. **Configurar dominio en Cloudflare**
2. **Crear registro A** apuntando a tu backend
3. **Configurar CNAME** para el frontend
4. **Activar proxy** para mejor rendimiento

### Opción B: DNS Directo

```
# Registros DNS
backend.tudominio.com    A     tu-ip-backend
app.tudominio.com        CNAME tu-app.pages.dev
```

## 🔄 Scripts de Despliegue

### package.json
```json
{
  "scripts": {
    "deploy:frontend": "npm run build && wrangler pages deploy out",
    "deploy:backend": "railway up",
    "deploy:all": "npm run deploy:backend && npm run deploy:frontend"
  }
}
```

## 💰 Costos Estimados

### Railway (Recomendado)
- **Backend**: Gratis (500 horas/mes)
- **Redis**: Gratis (1GB)
- **Total**: $0/mes

### Render
- **Backend**: Gratis (750 horas/mes)
- **Redis**: $7/mes
- **Total**: $7/mes

### Heroku
- **Backend**: $7/mes
- **Redis**: $15/mes
- **Total**: $22/mes

## 🚀 Pasos para Migrar

1. **Elegir plataforma** (Railway recomendado)
2. **Configurar backend** con Redis
3. **Actualizar frontend** para usar Socket.io
4. **Configurar DNS** y variables de entorno
5. **Desplegar y probar**

## ✅ Ventajas del Enfoque Híbrido

- ✅ **Mantiene funcionalidad original**
- ✅ **Redis para persistencia**
- ✅ **Socket.io para tiempo real**
- ✅ **Frontend en Cloudflare** (rápido)
- ✅ **Escalabilidad** según necesidades

## ⚠️ Consideraciones

- **Latencia**: Backend puede estar más lejos
- **Costos**: Depende de la plataforma elegida
- **Mantenimiento**: Dos servicios que gestionar
- **Complejidad**: Configuración más compleja

## 🎯 Recomendación Final

**Para desarrollo/producción pequeña**: Usar Railway (gratis)
**Para producción empresarial**: Usar DigitalOcean o AWS
**Para máxima simplicidad**: Mantener Cloudflare Workers (sin Redis) 