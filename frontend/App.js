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

// ✅ Render 배포된 백엔드 URL 설정
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://textmemo.onrender.com";

function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  // 📌 1️⃣ 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.IMAGES, // ✅ 최신 Expo 방식
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText(""); // 기존 OCR 결과 초기화
    }
  };

  // 📌 2️⃣ Fetch API를 이용한 이미지 업로드 및 OCR 처리
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        // ✅ 웹 환경에서 Blob 변환 필요
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

      console.log("📂 Sending FormData (Fetch API):", formData);

      // ✅ Fetch API를 사용한 이미지 업로드 요청
      const uploadResponse = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log("✅ Upload Success:", uploadData);

      const filePath = uploadData.filePath;

      // ✅ Fetch API를 사용한 OCR 요청
      const ocrResponse = await fetch(`${BACKEND_URL}/api/extract-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!ocrResponse.ok) {
        throw new Error(`OCR failed: ${ocrResponse.status}`);
      }

      const ocrData = await ocrResponse.json();

      if (!ocrData.text) {
        Alert.alert("OCR 실패", "텍스트를 인식할 수 없습니다.");
        setExtractedText("No text detected.");
      } else {
        setExtractedText(ocrData.text);
      }
    } catch (error) {
      console.error("❌ Upload Error (Fetch API):", error);
      Alert.alert("OCR 실패", "파일 업로드 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>이미지 선택</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <TouchableOpacity onPress={uploadImage} style={styles.button}>
        <Text style={styles.buttonText}>
          {loading ? "처리 중..." : "텍스트 추출"}
        </Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#fff" />}
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

export default App;
