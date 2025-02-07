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
      alert("이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const file = {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      };

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("image", blob, "photo.jpg");
      } else {
        formData.append("image", file);
      }

      // ✅ FormData 내부 데이터 확인
      for (let pair of formData.entries()) {
        console.log(`📂 FormData Key: ${pair[0]}, Value:`, pair[1]);
      }

      const uploadResponse = await axios.post(
        `${BACKEND_URL}/api/upload`,
        formData,
        { headers: {} }
      );

      console.log("✅ Upload Success:", uploadResponse.data);
    } catch (error) {
      console.error("❌ Upload Failed:", error);
    } finally {
      setLoading(false);
    }
  };
}
