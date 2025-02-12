# TextMemoApp

TextMemo is an OCR (Optical Character Recognition) based application that extracts text from images.
Users can either select an image from the gallery or capture a photo using the camera to extract text.
This application is built with React Native (Expo) + Express.js and utilizes Google Cloud Vision API for OCR processing.

🛠 Tech Stack
Category Technology
Frontend React Native (Expo), JavaScript
Backend Express.js, Node.js
Data Storage File System (Local Uploads)
OCR Service Google Cloud Vision API
Deployment Render (Backend & Frontend)

📷 Key Features
✅ Extract text from images - Uses Google Vision API
✅ Select images from the gallery - Supports file uploads
✅ Capture and process text instantly - Real-time camera capture
✅ Preview extracted text in-app - View OCR results immediately
✅ Works on both Web & Mobile - Built with Expo for cross-platform support

🚀 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/your-repo/TextMemo.git
cd TextMemo

2️⃣ Run the Frontend
cd frontend
npm install
npx expo start

For web mode:
npx expo start --web

3️⃣ Run the Backend
cd backend
npm install
node server.js

⚙️ Environment Variables (.env)
To use Google Cloud Vision API, create a .env file and set the API key path.

env
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your-service-account.json

For Render deployment, make sure to set up environment variables correctly.

📂 Project Structure
TextMemo
│── frontend/ # React Native (Expo) Frontend
│ ├── App.js # Main Application Code
│ ├── package.json # Frontend Dependencies
│ ├── assets/ # Images and Static Files
│ ├── components/ # UI Components
│ ├── styles/ # Stylesheets
│ ├── web-build/ # Web Build Output (Moved to Backend for Deployment)
│
│── backend/ # Express.js Backend
│ ├── server.js # Main Backend Server
│ ├── package.json # Backend Dependencies
│ ├── uploads/ # Uploaded Images Storage
│ ├── web-build/ # Web Build Output (Served by Backend)
│
└── README.md # Project Documentation

📌 API Endpoints
POST /api/upload-base64
Content-Type: application/json
{
"image": "base64EncodedString"
}

📌 Response Example
{
"filePath": "/uploads/upload_1739081646799.jpg"
}

🔹 Perform OCR
POST /api/extract-text
Content-Type: application/json
{
"filePath": "/uploads/upload_1739081646799.jpg"
}

📌 Response Example
{
"text": "Extracted text content"
}

🎯 Deployment Guide
📍 Build Frontend & Move to Backend
cd frontend
npx expo export
rm -rf ../backend/web-build
mv dist ../backend/web-build

📍 Deploy on Render
Deploy Backend
Deploy the backend folder on Render
Set up environment variables (GOOGLE_APPLICATION_CREDENTIALS)
Include the web-build folder in the backend

Deploy Frontend
Build the web version using Expo (npx expo export --web)
Move web-build to backend
Serve static files from the backend

💡 Troubleshooting
❌ PayloadTooLargeError: request entity too large
Solution: Increase upload size limit in server.js:

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

❌ No file uploaded. Error
Solution:
1️⃣ Ensure Content-Type is set to application/json
2️⃣ Use base64 encoding for image uploads

❌ expo build:web Error
Solution:
Expo CLI has changed. Use the new command:

npx expo export --web

🎉 Contributing
Want to contribute? Follow these steps:

Fork the repo
Create a new branch (git checkout -b feature-new)
Commit your changes (git commit -m "Added new feature")
Push to GitHub (git push origin feature-new)
Create a Pull Request

📜 License
This project is licensed under the MIT License.
Feel free to use and improve it! 😊

🚀 If you found this project useful, please give it a Star (⭐)!
📧 Contact: jjbmsda@gmail.com
