const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 환경변수 확인
console.log(
  "✅ GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

// ✅ CORS 설정 및 JSON 파싱 활성화
app.use(cors());
app.use(express.json());

// ✅ Google Cloud Vision API 설정
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Render 환경변수 사용
});

// ✅ 프론트엔드 정적 파일 제공 (웹페이지 서비스)
const webBuildPath = path.join(__dirname, "web-build");
if (fs.existsSync(webBuildPath)) {
  app.use(express.static(webBuildPath));
}

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

// 📌 1️⃣ **이미지 업로드 API (multer)**
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    console.error("❌ No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);
  console.log("✅ File uploaded:", filePath);
  res.json({ filePath });
});

// 📌 2️⃣ **OCR 처리 API (Google Vision API)**
app.post("/api/extract-text", async (req, res) => {
  let { filePath } = req.body;

  if (!filePath) {
    console.error("❌ No file path provided");
    return res.status(400).json({ error: "Valid file path is required" });
  }

  filePath = path.resolve(filePath); // 절대 경로 변환
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

    // ✅ OCR 성공 후 업로드된 파일 삭제
    fs.unlinkSync(filePath);
    console.log("✅ OCR completed, file deleted:", filePath);

    res.json({ text: detections[0].description });
  } catch (error) {
    console.error("❌ OCR Processing Error:", error);
    res
      .status(500)
      .json({ error: "Failed to process OCR", details: error.message });
  }
});

// ✅ SPA 지원 (React Router 처리)
app.get("*", (req, res) => {
  if (fs.existsSync(path.join(webBuildPath, "index.html"))) {
    res.sendFile(path.join(webBuildPath, "index.html"));
  } else {
    res.status(404).send("❌ 404 Not Found: Web build not found.");
  }
});

// ✅ 404 핸들링
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// ✅ 글로벌 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res
    .status(500)
    .json({ error: "Internal Server Error", details: err.message });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
