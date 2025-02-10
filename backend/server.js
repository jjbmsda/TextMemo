const express = require("express");
const cors = require("cors");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Google Cloud Vision API 설정
console.log(
  "✅ GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
console.log("📂 현재 백엔드 URL:", process.env.EXPO_PUBLIC_BACKEND_URL);

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ✅ CORS 설정 및 JSON 파싱 활성화
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());

// ✅ 업로드된 파일 저장 폴더 설정
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ 정적 파일 제공: 업로드된 파일을 접근 가능하도록 설정
app.use("/uploads", express.static(uploadDir));

// 📌 1️⃣ **이미지 업로드 API**
app.post("/api/upload", async (req, res) => {
  console.log("🔹 파일 업로드 요청 도착!");

  try {
    const fileName = `upload_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream); // 바이너리 데이터를 파일로 저장

    writeStream.on("finish", () => {
      console.log("✅ 파일 저장 완료:", filePath);
      res.json({ filePath });
    });

    writeStream.on("error", (err) => {
      console.error("❌ 파일 저장 오류:", err);
      res.status(500).json({ error: "File save error" });
    });
  } catch (error) {
    console.error("❌ 업로드 오류:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/api/upload-base64", async (req, res) => {
  console.log("🔹 Base64 파일 업로드 요청 도착!");

  try {
    const { image } = req.body;
    if (!image) {
      console.error("❌ No image data received.");
      return res.status(400).json({ error: "No image data received" });
    }

    // ✅ Base64 데이터를 실제 이미지 파일로 변환
    const fileName = `upload_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(image, "base64"));

    console.log("✅ 파일 저장 완료:", filePath);
    res.json({ filePath });
  } catch (error) {
    console.error("❌ Base64 업로드 오류:", error);
    res.status(500).json({ error: "Base64 Upload failed" });
  }
});

// 📌 2️⃣ **OCR 처리 API (메모리에서 직접 파일 로드)**
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
    console.log("🔎 OCR 실행 중:", filePath);

    // ✅ 파일을 메모리로 읽어서 Google Vision API로 전송
    const imageBuffer = fs.readFileSync(filePath);
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.error("❌ OCR failed: No text detected");
      return res.status(500).json({ error: "OCR failed. No text extracted." });
    }

    fs.unlinkSync(filePath); // ✅ OCR 완료 후 파일 삭제
    console.log("✅ OCR 완료, 파일 삭제됨:", filePath);

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
