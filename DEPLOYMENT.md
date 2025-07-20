# Guía de Despliegue en Cloudflare

Este proyecto está configurado para desplegarse en Cloudflare Pages (frontend) y Cloudflare Workers (backend).

## Prerrequisitos

1. **Cuenta de Cloudflare**: Regístrate en [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Instala la herramienta de línea de comandos de Cloudflare
   ```bash
   npm install -g wrangler
   ```
3. **Autenticación**: Inicia sesión en Wrangler
   ```bash
   wrangler login
   ```

## Paso 1: Configurar Cloudflare KV

1. Crea un namespace de KV para almacenar los datos del chat:
   ```bash
   wrangler kv:namespace create "CHAT_DATA"
   ```

2. Copia los IDs generados y actualiza el archivo `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "CHAT_DATA"
   id = "tu-kv-namespace-id"
   preview_id = "tu-preview-kv-namespace-id"
   ```

## Paso 2: Configurar Variables de Entorno

1. Actualiza el archivo `wrangler.toml` con tu JWT_SECRET:
   ```toml
   [vars]
   JWT_SECRET = "tu-secret-key-super-seguro"
   ```

2. Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_API_URL=https://tu-worker.tu-subdomain.workers.dev
   ```

## Paso 3: Desplegar el Worker (Backend)

1. Despliega el Worker:
   ```bash
   npm run deploy:worker
   ```

2. Anota la URL del Worker que se genera (algo como `https://tu-worker.tu-subdomain.workers.dev`)

## Paso 4: Actualizar la URL del Worker

1. Actualiza el archivo `hooks/useChat.ts` con la URL real de tu Worker:
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tu-worker.tu-subdomain.workers.dev'
   ```

2. Actualiza el archivo `_redirects` con la URL real:
   ```
   /api/*  https://tu-worker.tu-subdomain.workers.dev/api/:splat  200
   ```

## Paso 5: Desplegar en Cloudflare Pages (Frontend)

### Opción A: Usando Wrangler CLI
```bash
npm run deploy:pages
```

### Opción B: Usando la interfaz web de Cloudflare

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecciona "Pages"
3. Haz clic en "Create a project"
4. Conecta tu repositorio de GitHub/GitLab
5. Configura el build:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Root directory**: `/` (dejar vacío)

## Paso 6: Configurar Variables de Entorno en Pages

En la configuración de tu proyecto en Cloudflare Pages, agrega la variable de entorno:
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://tu-worker.tu-subdomain.workers.dev`

## Paso 7: Verificar el Despliegue

1. **Frontend**: Tu aplicación estará disponible en `https://tu-proyecto.pages.dev`
2. **Backend**: Tu API estará disponible en `https://tu-worker.tu-subdomain.workers.dev`

## Solución de Problemas

### Error: "KV namespace not found"
- Verifica que los IDs en `wrangler.toml` sean correctos
- Asegúrate de que el namespace esté creado en la misma cuenta

### Error: "CORS issues"
- Verifica que las URLs en `_redirects` sean correctas
- Asegúrate de que el Worker esté configurado con los headers CORS correctos

### Error: "Build failed"
- Verifica que todas las dependencias estén instaladas
- Revisa los logs de build en Cloudflare Pages

## Estructura del Proyecto Desplegado

```
Frontend (Cloudflare Pages):
├── / (página principal)
├── /login
├── /register
└── /chat

Backend (Cloudflare Workers):
├── /api/auth/login
├── /api/auth/register
├── /api/auth/validate
├── /api/chat/messages
├── /api/chat/users
└── /api/chat/stream
```

## Monitoreo y Logs

- **Worker logs**: Usa `wrangler tail` para ver logs en tiempo real
- **Pages logs**: Disponibles en el dashboard de Cloudflare Pages
- **Analytics**: Activa Cloudflare Analytics para métricas de rendimiento

## Escalabilidad

- **Workers**: Se escalan automáticamente según la demanda
- **KV**: Soporta millones de operaciones por segundo
- **Pages**: CDN global con más de 200 ubicaciones

## Costos

- **Workers**: Primeros 100,000 requests/día gratuitos
- **KV**: Primeros 100,000 operaciones/día gratuitas
- **Pages**: 500 builds/mes gratuitos, 100GB bandwidth/mes

## Seguridad

- **JWT**: Usa un secret fuerte y único
- **CORS**: Configurado para permitir solo tu dominio
- **Headers**: Configurados para seguridad adicional
- **HTTPS**: Automático en todos los dominios de Cloudflare 