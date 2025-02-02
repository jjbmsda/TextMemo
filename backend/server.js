const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000; // Render에서 포트 자동 감지

app.use(cors());
app.use(express.json());

// ✅ Google Cloud Vision API 설정 (환경 변수 사용)
const client = new vision.ImageAnnotatorClient();

// ✅ 프론트엔드 정적 파일 제공 (웹페이지 서비스)
app.use(express.static("web-build"));

// ✅ 업로드된 파일 저장 폴더 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ 이미지 업로드 설정 (multer)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 📌 1️⃣ 이미지 업로드 엔드포인트
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);
  res.json({ filePath });
});

// 📌 2️⃣ OCR 처리 (Google Vision API 사용)
app.post("/api/extract-text", async (req, res) => {
  const { filePath } = req.body;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "Valid file path is required" });
  }

  try {
    // Google Cloud Vision API를 이용하여 OCR 실행
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return res.status(500).json({ error: "OCR failed. No text extracted." });
    }

    res.json({ text: detections[0].description });
  } catch (error) {
    console.error("OCR Processing Error:", error);
    res
      .status(500)
      .json({ error: "Failed to process OCR", details: error.message });
  }
});

// ✅ 프론트엔드 SPA 지원 (React Router 사용 가능)
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web-build", "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
