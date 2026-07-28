import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Tilda 지원용 이력서와 포트폴리오만 독립적으로 실행합니다.
export default defineConfig({
  base: "/legacy-resume/togi/",
  plugins: [tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        resume: "resume.html",
        portfolio: "portfolio.html",
      },
    },
  },
});
