import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import aiHandler from "./api/ai.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;
  // Node Sync: 2026-05-08 19:59

  app.use(express.json({ limit: '10mb' }));

  // API Route for Gemini AI - Using the same handler as Vercel
  app.post("/api/ai", async (req, res) => {
    try {
      // تحويل طلب Express إلى طلب Standard Request ليتناسب مع Edge Handler
      const standardReq = {
        method: req.method,
        json: async () => req.body,
        headers: new Headers(req.headers as any)
      };
      
      const response = await aiHandler(standardReq as any, null);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
