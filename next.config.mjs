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
    // Excluir rutas de API ya que están en el Worker
    distDir: "out",
    // Forzar cache busting
    generateBuildId: async () => {
        return `build-${Date.now()}`;
    },
};

export default nextConfig;
