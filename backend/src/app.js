import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { erroMiddleware } from "./middlewares/erroMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // CORS primeiro — garante headers em todas as respostas (incluindo erros)
  const allowedFromEnv = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedFromEnv.includes(origin)) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Rate limit global mas pula preflight OPTIONS para nao quebrar CORS
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
  }));

  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  routes(app);
  app.use(erroMiddleware);

  return app;
}

export default createApp();
