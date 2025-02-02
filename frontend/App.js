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

// ✅ Render 배포된 백엔드 URL 설정 (환경 변수 지원)
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://textmemo.onrender.com";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 1️⃣ 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText(""); // 새로운 이미지 선택 시 기존 OCR 결과 초기화
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
      // ✅ FormData 생성
      const formData = new FormData();

      if (Platform.OS === "web") {
        // 🔹 웹 환경: fetch()를 통해 blob 변환 후 추가
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("image", blob, "photo.jpg");
      } else {
        // 🔹 모바일 환경: 직접 FormData에 추가
        formData.append("image", {
          uri: imageUri,
          type: "image/jpeg",
          name: "photo.jpg",
        });
      }

      console.log("📤 Uploading Image...");

      // ✅ 1단계: 이미지 업로드 요청
      const uploadResponse = await axios.post(
        `${BACKEND_URL}/api/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("✅ Upload Success:", uploadResponse.data);

      const filePath = uploadResponse.data.filePath;

      if (!filePath) {
        throw new Error("파일 경로를 가져오는 데 실패했습니다.");
      }

      console.log("📄 File Path:", filePath);

      // ✅ 2단계: OCR 요청
      const response = await axios.post(
        `${BACKEND_URL}/api/extract-text`,
        { filePath },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.text) {
        Alert.alert("OCR 실패", "텍스트를 인식할 수 없습니다.");
        setExtractedText("No text detected.");
      } else {
        setExtractedText(response.data.text);
      }
    } catch (error) {
      console.error("❌ OCR 요청 중 오류 발생:", error);
      Alert.alert("OCR 실패", "OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 이미지 선택 버튼 */}
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>이미지 선택</Text>
      </TouchableOpacity>

      {/* 선택한 이미지 미리보기 */}
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      {/* OCR 실행 버튼 */}
      <TouchableOpacity onPress={uploadImage} style={styles.button}>
        <Text style={styles.buttonText}>
          {loading ? "처리 중..." : "텍스트 추출"}
        </Text>
      </TouchableOpacity>

      {/* 로딩 인디케이터 */}
      {loading && <ActivityIndicator size="large" color="#fff" />}

      {/* OCR 결과 출력 */}
      <TextInput
        style={styles.textInput}
        multiline
        value={extractedText}
        onChangeText={setExtractedText}
        placeholder="추출된 텍스트가 여기에 표시됩니다."
        placeholderTextColor="#999"
      />
    </ScrollView>
  );
}

// ✅ 스타일 정의
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#000",
  },
  button: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#fff",
    color: "#fff",
    padding: 10,
    width: "90%",
    minHeight: 150,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#1c1c1e",
  },
});
