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

// ✅ 업로드된 파일 저장 폴더 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ multer 설정 (파일을 디스크에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 업로드 디렉토리 지정
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일명 설정
  },
});
const upload = multer({ storage });

// 📌 1️⃣ **이미지 업로드 API (multer)**
app.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("📂 Uploaded File Data:", req.file);

  if (!req.file) {
    console.error("❌ No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  // ✅ 업로드된 파일 경로 반환
  res.json({ filePath: req.file.path });
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

// ✅ 정적 파일 제공 (웹 프론트엔드 연결)
app.use(express.static("web-build"));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web-build", "index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
