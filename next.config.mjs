/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para Cloudflare Pages
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_SOCKET_URL: "https://vintage-chat-app.onrender.com",
    NEXT_PUBLIC_API_URL: "https://vintage-chat-app.onrender.com",
  },
  // Excluir rutas de API ya que están en el Worker
  distDir: "out",
  // Forzar cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
