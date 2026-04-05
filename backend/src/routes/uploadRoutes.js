import { Router } from "express";
import multer from "multer";
import path from "path";

const router = Router();

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Save files into backend/uploads with original extension preserved
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo nao permitido: ${file.mimetype}. Apenas imagens (JPEG, PNG, WebP, GIF).`), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 10 } });

// POST /api/upload  (field name: photos) -> returns array of { url, descricao }
router.post("/", (req, res, next) => {
  upload.array("photos")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "Arquivo excede o limite de 5MB." });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: "Maximo de 10 arquivos por upload." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    try {
      const files = (req.files || []).map((f) => ({ url: `/uploads/${f.filename}`, descricao: f.originalname }));
      return res.status(201).json(files);
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: "Erro ao enviar arquivos" });
    }
  });
});

export default router;
