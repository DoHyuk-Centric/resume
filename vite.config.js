import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// resume.html 을 진입점으로 사용합니다.
export default defineConfig({
  base: "./", // 빌드 결과물을 file:// 로도 열 수 있게 상대경로 사용 (PDF 추출용)
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    open: "/resume.html", // npm run dev 시 자동으로 이력서 열기
  },
  build: {
    rollupOptions: {
      input: "resume.html",
    },
  },
});
