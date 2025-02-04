const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Google Vision API 클라이언트 설정
console.log(
  "✅ GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ✅ CORS 및 JSON 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ multer 설정 (파일을 디스크 대신 메모리에 저장하여 버퍼에서 직접 OCR 처리)
const upload = multer({
  storage: multer.memoryStorage(), // ✅ 메모리에 저장
});

// 📌 1️⃣ **이미지 업로드 및 OCR 처리 API**
app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    console.error("❌ No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("📂 Uploaded File:", req.file.originalname);

  try {
    // ✅ Google Cloud Vision API로 OCR 실행
    console.log("🔍 Processing OCR...");
    const [result] = await client.textDetection(req.file.buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.error("❌ OCR failed: No text detected");
      return res.status(500).json({ error: "OCR failed. No text extracted." });
    }

    console.log("✅ OCR completed successfully!");
    res.json({ text: detections[0].description });
  } catch (error) {
    console.error("❌ OCR Processing Error:", error);
    res
      .status(500)
      .json({ error: "Failed to process OCR", details: error.message });
  }
});

// ✅ 정적 파일 제공 (웹 프론트엔드 연결)
app.use(express.static("web-build"));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web-build", "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
