import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  User,
  Settings,
  History,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function FaceDetectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [facing, setFacing] = useState("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [lastDetection, setLastDetection] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch recent detection logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["detection-logs"],
    queryFn: async () => {
      const response = await fetch("/api/detection-logs?limit=5");
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Face detection mutation
  const detectFaceMutation = useMutation({
    mutationFn: async ({ imageBase64, location }) => {
      setIsAnalyzing(true);
      const response = await fetch("/api/face-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          detection_type: "security_check",
          location: location || "Mobile Camera",
        }),
      });
      if (!response.ok) throw new Error("Detection failed");
      return response.json();
    },
    onSuccess: (data) => {
      setLastDetection(data);
      setIsAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ["detection-logs"] });

      // Show alert based on detection result
      if (data.matched_profile) {
        const profile = data.matched_profile;
        const alertType =
          profile.person_type === "criminal"
            ? "CRIMINAL DETECTED"
            : "PERSON IDENTIFIED";
        const alertColor =
          profile.person_type === "criminal" ? "#FF0000" : "#00AA00";

        Alert.alert(
          alertType,
          `Name: ${profile.name}\nType: ${profile.person_type.toUpperCase()}\nConfidence: ${(data.confidence_score * 100).toFixed(1)}%`,
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "UNKNOWN PERSON",
          "Face detected but no match found in database.",
          [{ text: "OK" }],
        );
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      Alert.alert("Error", "Face detection failed. Please try again.");
      console.error("Detection error:", error);
    },
  });

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (photo.base64) {
        const imageBase64 = `data:image/jpeg;base64,${photo.base64}`;
        detectFaceMutation.mutate({ imageBase64 });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture photo");
      console.error("Camera error:", error);
    }
  }, [detectFaceMutation]);

  const pickImageFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      detectFaceMutation.mutate({ imageBase64, location: "Gallery Upload" });
    }
  }, [detectFaceMutation]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
          paddingTop: insets.top,
          padding: 20,
        }}
      >
        <StatusBar style="light" />
        <Camera size={80} color="#fff" style={{ marginBottom: 20 }} />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          Camera permission required for face detection
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: "#007AFF",
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 20,
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
            Face Detection System
          </Text>
          <TouchableOpacity onPress={toggleCameraFacing}>
            <RotateCcw size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera View */}
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
          {/* Overlay with detection area */}
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                width: 250,
                height: 300,
                borderWidth: 2,
                borderColor: isAnalyzing ? "#FFD60A" : "#007AFF",
                borderRadius: 20,
                backgroundColor: "transparent",
              }}
            >
              <Text
                style={{
                  position: "absolute",
                  top: -30,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {isAnalyzing ? "Analyzing..." : "Position face here"}
              </Text>
            </View>
          </View>

          {/* Last Detection Result */}
          {lastDetection && (
            <View
              style={{
                position: "absolute",
                top: 100,
                left: 20,
                right: 20,
                backgroundColor: "rgba(0,0,0,0.8)",
                borderRadius: 10,
                padding: 15,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                {lastDetection.matched_profile ? (
                  lastDetection.matched_profile.person_type === "criminal" ? (
                    <AlertTriangle size={20} color="#FF4444" />
                  ) : (
                    <CheckCircle size={20} color="#44FF44" />
                  )
                ) : (
                  <User size={20} color="#FFAA00" />
                )}
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginLeft: 10,
                  }}
                >
                  {lastDetection.matched_profile
                    ? lastDetection.matched_profile.name
                    : "Unknown Person"}
                </Text>
              </View>

              {/* Matching Percentage - Prominently displayed */}
              <View
                style={{
                  backgroundColor:
                    lastDetection.match_percentage >= 70
                      ? "rgba(0, 255, 0, 0.2)"
                      : lastDetection.match_percentage >= 50
                        ? "rgba(255, 255, 0, 0.2)"
                        : "rgba(255, 0, 0, 0.2)",
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      lastDetection.match_percentage >= 70
                        ? "#44FF44"
                        : lastDetection.match_percentage >= 50
                          ? "#FFAA00"
                          : "#FF4444",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  Match: {lastDetection.match_percentage || 0}%
                </Text>
              </View>

              {lastDetection.matched_profile && (
                <Text
                  style={{
                    color:
                      lastDetection.matched_profile.person_type === "criminal"
                        ? "#FF4444"
                        : "#44FF44",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 5,
                  }}
                >
                  Type:{" "}
                  {lastDetection.matched_profile.person_type.toUpperCase()}
                </Text>
              )}

              {/* Show all potential matches */}
              {lastDetection.all_matches &&
                lastDetection.all_matches.length > 1 && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={{ color: "#ccc", fontSize: 12, marginBottom: 4 }}
                    >
                      Other potential matches:
                    </Text>
                    {lastDetection.all_matches
                      .slice(1, 3)
                      .map((match, index) => (
                        <Text
                          key={index}
                          style={{ color: "#888", fontSize: 11 }}
                        >
                          • {match.profile.name} ({match.match_percentage}%)
                        </Text>
                      ))}
                  </View>
                )}

              {/* Face angle detection */}
              {lastDetection.detected_features?.face_angle && (
                <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                  Detected angle: {lastDetection.detected_features.face_angle}
                </Text>
              )}
            </View>
          )}
        </CameraView>
      </View>

      {/* Bottom Controls */}
      <View
        style={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
          paddingTop: 20,
          backgroundColor: "rgba(0,0,0,0.9)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/manage-profiles")}
            style={{
              backgroundColor: "#333",
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={isAnalyzing}
          >
            <Settings size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={capturePhoto}
            style={{
              backgroundColor: isAnalyzing ? "#FFD60A" : "#007AFF",
              width: 80,
              height: 80,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "#fff",
            }}
            disabled={isAnalyzing}
          >
            <Camera size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/detection-logs")}
            style={{
              backgroundColor: "#333",
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
            disabled={isAnalyzing}
          >
            <History size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: "#ccc",
            fontSize: 12,
            textAlign: "center",
            marginTop: 15,
          }}
        >
          {isAnalyzing ? "Processing..." : "Tap to capture and analyze face"}
        </Text>
      </View>

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <ScrollView
          horizontal
          style={{
            position: "absolute",
            bottom: 150,
            left: 0,
            right: 0,
            maxHeight: 80,
          }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          showsHorizontalScrollIndicator={false}
        >
          {recentLogs.map((log, index) => (
            <View
              key={log.id}
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: 10,
                marginRight: 10,
                minWidth: 120,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                {log.profile_name || "Unknown"}
              </Text>
              <Text style={{ color: "#ccc", fontSize: 10 }}>
                {new Date(log.created_at).toLocaleTimeString()}
              </Text>
              {log.person_type && (
                <Text
                  style={{
                    color:
                      log.person_type === "criminal" ? "#FF4444" : "#44FF44",
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  {log.person_type.toUpperCase()}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
