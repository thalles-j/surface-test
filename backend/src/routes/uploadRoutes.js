import { Router } from "express";
import multer from "multer";
import path from "path";

const router = Router();

// Save files into backend/uploads with original extension preserved
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// POST /api/upload  (field name: photos) -> returns array of { url, descricao }
router.post("/", upload.array("photos"), (req, res) => {
  try {
    const files = (req.files || []).map((f) => ({ url: `/uploads/${f.filename}`, descricao: f.originalname }));
    return res.status(201).json(files);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Erro ao enviar arquivos" });
  }
});

export default router;
