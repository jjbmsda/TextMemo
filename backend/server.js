const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Google Vision API 설정
console.log(
  "✅ GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ✅ CORS 설정
app.use(cors());

// ✅ 업로드 폴더 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ Multer 설정 (디스크에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한 (10MB)
});

//  Json 데이터 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📌 **1️⃣ 이미지 업로드 API**
app.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("📂 Uploaded File Data:", req.file);

  if (!req.file) {
    console.error("❌ No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  // ✅ 업로드된 파일 경로 반환
  res.json({ filePath: req.file.path });
});

// 📌 **2️⃣ OCR 처리 API (Google Vision)**
app.post("/api/extract-text", async (req, res) => {
  let { filePath } = req.body;

  if (!filePath) {
    console.error("❌ No file path provided");
    return res.status(400).json({ error: "Valid file path is required" });
  }

  filePath = path.resolve(filePath);
  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    return res.status(400).json({ error: "File does not exist" });
  }

  try {
    console.log("🔎 Processing OCR for:", filePath);
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.error("❌ OCR failed: No text detected");
      return res.status(500).json({ error: "OCR failed. No text extracted." });
    }

    fs.unlinkSync(filePath); // OCR 후 파일 삭제
    console.log("✅ OCR completed, file deleted:", filePath);

    res.json({ text: detections[0].description });
  } catch (error) {
    console.error("❌ OCR Processing Error:", error);
    res
      .status(500)
      .json({ error: "Failed to process OCR", details: error.message });
  }
});

// ✅ React 정적 파일 제공 (웹 프론트엔드)
app.use(express.static("web-build"));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web-build", "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
