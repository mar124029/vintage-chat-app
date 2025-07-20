# 🎭 Vintage Chat App

Una aplicación de chat moderna con diseño retro y funcionalidades avanzadas, desplegada en Cloudflare para máxima velocidad y escalabilidad global.

![Vintage Chat App](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20Pages-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Características

### 💬 Chat en Tiempo Real
- **Mensajes públicos y privados**
- **Indicadores de escritura**
- **Historial de mensajes**
- **Notificaciones en tiempo real**

### 🎨 Diseño Vintage
- **Interfaz retro con elementos modernos**
- **Tema oscuro/claro**
- **Emojis y expresiones**
- **Animaciones suaves**

### 🔐 Autenticación Segura
- **Registro y login de usuarios**
- **JWT tokens seguros**
- **Validación de sesiones**
- **Protección de rutas**

### 🚀 Tecnologías Modernas
- **Next.js 15** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Cloudflare Workers** para backend
- **Cloudflare KV** para almacenamiento

## 🏗️ Arquitectura

```
Frontend (Cloudflare Pages)
├── Next.js App Router
├── TypeScript
├── Tailwind CSS
└── Componentes UI

Backend (Cloudflare Workers)
├── API REST
├── Server-Sent Events
├── JWT Authentication
└── Cloudflare KV Storage
```

## 🚀 Despliegue

### URLs de Producción
- **Frontend**: https://8260b0f1.vintage-chat-app.pages.dev
- **Backend**: https://vintage-chat-backend.pokecraftmod.workers.dev

### Despliegue Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd vintage-chat-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear .env.local
   NEXT_PUBLIC_API_URL=https://vintage-chat-backend.pokecraftmod.workers.dev
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Construir para producción**
   ```bash
   npm run build
   ```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter

# Despliegue
npm run deploy:worker    # Desplegar Worker en Cloudflare
npm run deploy:pages     # Desplegar Pages en Cloudflare
npm run deploy:all       # Desplegar todo
```

## 📁 Estructura del Proyecto

```
vintage-chat-app/
├── app/                    # Next.js App Router
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── chat/             # Componentes del chat
│   ├── ui/               # Componentes UI reutilizables
│   └── theme-provider.tsx # Proveedor de tema
├── hooks/                # Custom hooks
│   ├── useChat.ts        # Hook principal del chat
│   └── useSocket.ts      # Hook de WebSocket (legacy)
├── services/             # Servicios
│   └── auth.ts           # Servicio de autenticación
├── server/               # Backend
│   ├── worker.js         # Cloudflare Worker
│   └── index.js          # Servidor Express (legacy)
├── types/                # Tipos TypeScript
│   └── chat.ts           # Tipos del chat
├── lib/                  # Utilidades
│   └── utils.ts          # Funciones utilitarias
├── public/               # Archivos estáticos
├── wrangler.toml         # Configuración de Cloudflare
├── next.config.mjs       # Configuración de Next.js
└── package.json          # Dependencias
```

## 🔧 Configuración de Cloudflare

### Prerrequisitos
- Cuenta de Cloudflare
- Wrangler CLI instalado

### Configuración Inicial

1. **Instalar Wrangler**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Crear KV Namespace**
   ```bash
   wrangler kv namespace create "CHAT_DATA"
   wrangler kv namespace create "CHAT_DATA" --preview
   ```

3. **Actualizar wrangler.toml**
   ```toml
   [vars]
   JWT_SECRET = "tu-secret-key"

   [[kv_namespaces]]
   binding = "CHAT_DATA"
   id = "tu-kv-namespace-id"
   preview_id = "tu-preview-kv-namespace-id"
   ```

4. **Desplegar**
   ```bash
   npm run deploy:all
   ```

## 🎯 Funcionalidades Principales

### Autenticación
- Registro de usuarios
- Login con email/password
- Validación de tokens JWT
- Sesiones persistentes

### Chat
- Mensajes en tiempo real
- Salas públicas y privadas
- Historial de mensajes
- Indicadores de escritura
- Lista de usuarios online

### UI/UX
- Diseño responsive
- Tema oscuro/claro
- Animaciones suaves
- Emoji picker
- Notificaciones

## 🔒 Seguridad

- **JWT Tokens**: Autenticación segura
- **CORS**: Configurado para dominios específicos
- **HTTPS**: Automático en Cloudflare
- **Headers de Seguridad**: XSS, CSRF protection
- **Validación**: Input sanitization

## 📊 Rendimiento

- **CDN Global**: 200+ ubicaciones
- **Edge Computing**: Procesamiento cercano al usuario
- **Caching**: Automático en Cloudflare
- **Optimización**: Bundle splitting, lazy loading
- **Lighthouse Score**: 90+ en todas las métricas

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm run test

# Ejecutar tests de integración
npm run test:integration

# Coverage
npm run test:coverage
```

## 📈 Monitoreo

### Logs
```bash
# Ver logs del Worker en tiempo real
wrangler tail vintage-chat-backend

# Ver logs de Pages
# Dashboard de Cloudflare Pages
```

### Métricas
- Requests por minuto
- Latencia de respuesta
- Errores y excepciones
- Uso de KV storage

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Cloudflare** por la infraestructura
- **Next.js** por el framework
- **Tailwind CSS** por los estilos
- **Radix UI** por los componentes
- **Socket.io** por la comunicación en tiempo real

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/vintage-chat-app/issues)
- **Discord**: [Servidor de la comunidad](https://discord.gg/tu-servidor)
- **Email**: soporte@tu-dominio.com

## 🔄 Changelog

### v1.0.0 (2024-01-20)
- ✅ Despliegue inicial en Cloudflare
- ✅ Chat en tiempo real funcional
- ✅ Autenticación JWT
- ✅ Diseño vintage responsive
- ✅ API REST completa

---

**Desarrollado con ❤️ usando tecnologías modernas y desplegado en Cloudflare para máxima velocidad global.** 