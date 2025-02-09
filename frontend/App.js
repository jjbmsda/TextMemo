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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

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

  // 📌 2️⃣ **업로드 시 `upload-base64`만 호출하도록 강제 설정**
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      let base64Image;

      // ✅ 이미지 URI를 Base64로 변환
      console.log("📂 이미지 URI 확인:", imageUri);

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        base64Image = reader.result.split(",")[1]; // Base64 데이터만 추출

        console.log(
          "📂 [업로드] `upload-base64` 호출 예정:",
          `${BACKEND_URL}/api/upload-base64`
        );
        console.log(
          "📂 Base64 이미지 데이터 (일부):",
          base64Image.slice(0, 50) + "..."
        );

        // ✅ Base64 데이터 업로드 (`upload`가 아니라 `upload-base64`로 강제 호출)
        const response = await fetch(`${BACKEND_URL}/api/upload-base64`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Upload Success:", result);

        // ✅ OCR 요청
        console.log("📂 [OCR 요청] 파일 경로:", result.filePath);
        const responseOCR = await fetch(`${BACKEND_URL}/api/extract-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: result.filePath }),
        });

        const ocrResult = await responseOCR.json();
        if (!ocrResult.text) {
          Alert.alert("OCR 실패", "텍스트를 인식할 수 없습니다.");
          setExtractedText("No text detected.");
        } else {
          setExtractedText(ocrResult.text);
        }
      };
    } catch (error) {
      console.error("❌ Upload Error:", error);
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
