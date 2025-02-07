import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
alert("현재 OS:", Platform.OS);

// ✅ Render 배포된 백엔드 URL 설정
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://textmemo.onrender.com";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 1️⃣ 이미지 선택
  const pickImage = async () => {
    alert("📂 이미지 선택 버튼 클릭됨!");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.IMAGES, // ✅ 최신 Expo 방식
      allowsEditing: true,
      quality: 1,
    });

    alert("📂 이미지 선택 완료! 결과:", result);

    if (!result.canceled) {
      alert("✅ 이미지 선택 성공! 이미지 URI:", result.assets[0].uri);
      setImageUri(result.assets[0].uri);
      setExtractedText(""); // 기존 OCR 결과 초기화
    } else {
      alert("⚠️ 이미지 선택이 취소됨.");
    }
  };

  // 📌 2️⃣ 이미지 업로드 및 OCR 처리
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        // ✅ 웹 환경에서 Blob 변환 후 FormData에 추가
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("image", blob, "photo.jpg");
      } else {
        // ✅ 모바일 환경 (iOS/Android)
        formData.append("image", {
          uri: imageUri,
          type: "image/jpeg",
          name: "photo.jpg",
        });
      }

      // 📌 FormData 내용 확인
      for (let pair of formData.entries()) {
        console.log("📂 FormData Content:", pair[0], pair[1]);
      }

      // ✅ axios로 업로드 요청
      const uploadResponse = await axios.post(
        `${BACKEND_URL}/api/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (data, headers) => {
            return data;
          },
        }
      );

      console.log("✅ Upload Success:", uploadResponse.data);
      const filePath = uploadResponse.data.filePath;

      // ✅ OCR 요청
      const responseOCR = await axios.post(
        `${BACKEND_URL}/api/extract-text`,
        { filePath },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!responseOCR.data.text) {
        Alert.alert("OCR 실패", "텍스트를 인식할 수 없습니다.");
        setExtractedText("No text detected.");
      } else {
        setExtractedText(responseOCR.data.text);
      }
    } catch (error) {
      console.error("❌ Upload Error:", error);
      Alert.alert("OCR 실패", "파일 업로드 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
}
