import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Under `npm run dev` proxas API-anrop till .NET-backenden på port 3000.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
