const express = require("express");
const multer = require("multer");
const { extractText } = require("../controllers/textControllers");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/extract-text", upload.single("image"), extractText);

module.exports = router;
