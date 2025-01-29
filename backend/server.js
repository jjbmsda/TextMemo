const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ✅ Google Cloud Vision API 설정
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve(
    "/Users/jangjungbu/Desktop/document/블로그 자료/neon-framing-449005-s9-37e33113cb2f.json"
  ), // 올바른 경로 설정
});

// ✅ 이미지 업로드 설정
const upload = multer({ dest: "uploads/" });

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
