const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Google Cloud Vision API 클라이언트 설정
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ✅ CORS 설정 및 JSON 파싱 활성화
app.use(cors());
app.use(express.json());

// ✅ 메모리 저장소를 사용하는 `multer` 설정
const upload = multer({ storage: multer.memoryStorage() });

// 📌 **이미지 업로드 및 OCR 실행 API**
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file uploaded.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📂 Uploaded File Info:", {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // ✅ Google Cloud Vision API OCR 실행
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

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
