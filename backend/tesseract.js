const Tesseract = require("tesseract.js");
const fs = require("fs"); // 파일 시스템 접근
const path = require("path"); // 경로 처리

const performOCR = async (imagePath) => {
  try {
    console.log(`Processing OCR for: ${imagePath}`);

    // 파일이 존재하는지 확인
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    // Tesseract worker 생성
    const worker = await Tesseract.createWorker("kor");

    // OCR 실행
    const { data } = await worker.recognize(imagePath);
    await worker.terminate(); // OCR 종료

    console.log("OCR Result:", data.text);
    return data.text; // 추출된 텍스트 반환
  } catch (error) {
    console.error("OCR Error:", error);
    return Promise.reject(error);
  }
};

module.exports = { performOCR };
