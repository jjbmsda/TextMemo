const Tesseract = require("tesseract.js");

exports.extractText = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const { buffer } = req.file;
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    Tesseract.recognize(base64Image, "eng", {
      logger: (info) => console.log(info),
    }).then(({ data: { text } }) => {
      res.status(200).json({ text });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process the image" });
  }
};
