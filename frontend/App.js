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

// ✅ Render 배포된 백엔드 URL 설정
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://textmemo.onrender.com";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 1️⃣ 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.IMAGES,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText("");
    }
  };

  // 📌 2️⃣ 이미지 업로드 및 OCR 처리
  const uploadImage = async () => {
    console.log("🔹 uploadImage 함수 실행됨!"); // ✅ 확인용 로그

    if (!imageUri) {
      Alert.alert("Error", "이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      console.log("📂 FormData 생성 시작"); // ✅ 확인용 로그

      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("image", blob, "photo.jpg");
      } else {
        formData.append("image", {
          uri: imageUri,
          type: "image/jpeg",
          name: "photo.jpg",
        });
      }

      console.log("📂 FormData 확인:", formData); // ✅ 이 로그가 안 찍히는지 확인
      console.log("🔹 백엔드 API 요청 시작...");

      const uploadResponse = await axios.post(
        `${BACKEND_URL}/api/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("✅ Upload Success:", uploadResponse.data);
    } catch (error) {
      console.error("❌ Upload Error:", error);
    } finally {
      setLoading(false);
    }
  };
}
