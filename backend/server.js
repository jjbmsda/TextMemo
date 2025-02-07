const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 환경 변수 로드 (Google Cloud Vision API)
console.log(
  "✅ GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ✅ CORS 설정
app.use(cors());

// ✅ 업로드된 파일 저장 폴더 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ multer 설정 (파일을 메모리에 저장)
const upload = multer({
  storage: multer.memoryStorage(), // ✅ 파일을 메모리에 저장
  limits: { fileSize: 10 * 1024 * 1024 }, // 최대 10MB
});

// 📌 1️⃣ **이미지 업로드 API (multer)**
app.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("🔹 파일 업로드 요청 도착!");
  console.log("📂 요청 헤더:", req.headers);
  console.log("📂 요청 바디:", req.body);
  console.log("📂 업로드된 파일 정보:", req.file);

  if (!req.file) {
    console.error("❌ No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({ fileBuffer: req.file.buffer.toString("base64") }); // ✅ 메모리 저장 방식이므로 base64 반환
});

// ✅ JSON 및 URL-encoded 요청을 처리하는 미들웨어 (multer 뒤에 배치)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📌 2️⃣ **OCR 처리 API**
app.post("/api/extract-text", async (req, res) => {
  let { fileBuffer } = req.body;

  if (!fileBuffer) {
    console.error("❌ No file buffer provided");
    return res.status(400).json({ error: "Valid file buffer is required" });
  }

  try {
    console.log("🔎 OCR 실행 중...");
    const imageBuffer = Buffer.from(fileBuffer, "base64"); // ✅ Base64 → Buffer 변환
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.error("❌ OCR failed: No text detected");
      return res.status(500).json({ error: "OCR failed. No text extracted." });
    }

    console.log("✅ OCR 완료!");

    res.json({ text: detections[0].description });
  } catch (error) {
    console.error("❌ OCR Processing Error:", error);
    res
      .status(500)
      .json({ error: "Failed to process OCR", details: error.message });
  }
});

// ✅ React 프론트엔드 정적 파일 제공 (SPA 지원)
const webBuildPath = path.join(__dirname, "web-build");
if (fs.existsSync(webBuildPath)) {
  app.use(express.static(webBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(webBuildPath, "index.html"));
  });
} else {
  console.error("❌ web-build 폴더가 존재하지 않습니다.");
}

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
