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

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://textmemo.onrender.com";

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

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

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      let base64Image;

      if (Platform.OS === "web") {
        // ✅ 웹 환경에서는 Blob -> Base64 변환 후 전송
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          base64Image = reader.result.split(",")[1]; // Base64 데이터만 추출

          // ✅ Base64 이미지 데이터를 JSON으로 전송
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
      } else {
        // ✅ 모바일 환경 (iOS/Android)
        Alert.alert("현재 Base64 변환 방식은 웹에서만 지원됩니다.");
      }
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
