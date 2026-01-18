import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Load env theo mode (nếu bạn có .env, .env.production, ...)
  const env = loadEnv(mode, process.cwd(), "");

  const isProd = mode === "production";

  return {
    // GitHub Pages chạy theo repo name: /mimihoalua/
    base: isProd ? "/mimihoalua/" : "/",

    // Vite mặc định dùng "public" và sẽ copy ra root của dist khi build
    // => public/homeshophoaluaopen.html -> dist/homeshophoaluaopen.html
    publicDir: "public",

    server: {
      // host true để truy cập được bằng IP/LAN (ổn hơn "::" trong nhiều môi trường)
      host: true,
      port: 8080,
      strictPort: true,
    },

    preview: {
      host: true,
      port: 8080,
      strictPort: true,
    },

    plugins: [
      react(),
      !isProd && componentTagger(),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      emptyOutDir: true,
      // Giữ mặc định tốt cho Pages
      // chunkSizeWarningLimit: 1200, // (tuỳ chọn nếu project lớn)
    },

    // Tuỳ chọn: nếu bạn dùng env trong code kiểu import.meta.env.*
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV ?? mode),
    },
  };
});
