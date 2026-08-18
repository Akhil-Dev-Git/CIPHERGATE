import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  User,
  AlertTriangle,
  Camera,
  Upload,
  Database,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import useUpload from "@/utils/useUpload";

export default function ManageProfilesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [upload, { loading: uploadLoading }] = useUpload();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    person_type: "normal",
    profile_image_url: "",
  });
  const [selectedImages, setSelectedImages] = useState({
    front: null,
    left: null,
    right: null,
  });

  // Fetch face profiles
  const {
    data: profiles = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["face-profiles"],
    queryFn: async () => {
      const response = await fetch("/api/face-profiles");
      if (!response.ok) throw new Error("Failed to fetch profiles");
      return response.json();
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await fetch("/api/face-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error("Failed to create profile");
      return response.json();
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ["face-profiles"] });
      // Upload face images for different angles
      uploadFaceImages(newProfile.id);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create profile");
    },
  });

  // Add face images mutation
  const addFaceImageMutation = useMutation({
    mutationFn: async ({ profile_id, angle, image_url, features }) => {
      const response = await fetch("/api/face-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id, angle, image_url, features }),
      });
      if (!response.ok) throw new Error("Failed to add face image");
      return response.json();
    },
  });

  const pickImage = useCallback(async (angle) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => ({
        ...prev,
        [angle]: result.assets[0],
      }));
    }
  }, []);

  const uploadFaceImages = async (profileId) => {
    for (const [angle, imageAsset] of Object.entries(selectedImages)) {
      if (imageAsset) {
        try {
          const { url, error } = await upload({ reactNativeAsset: imageAsset });
          if (!error && url) {
            // Analyze the image with GPT Vision first
            const imageBase64 = `data:image/jpeg;base64,${imageAsset.base64}`;
            const analysisResponse = await fetch("/integrations/gpt-vision/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Analyze this ${angle} face image and extract detailed features: skin tone, facial hair, eye color, scars, distinctive marks, etc. Return as JSON.`,
                      },
                      {
                        type: "image_url",
                        image_url: { url: imageBase64 },
                      },
                    ],
                  },
                ],
              }),
            });

            let features = {};
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              try {
                features = JSON.parse(analysisData.choices[0].message.content);
              } catch {
                features = {
                  analysis: analysisData.choices[0].message.content,
                };
              }
            }

            await addFaceImageMutation.mutateAsync({
              profile_id: profileId,
              angle,
              image_url: url,
              features,
            });
          }
        } catch (error) {
          console.error(`Failed to upload ${angle} image:`, error);
        }
      }
    }

    // Reset form
    setFormData({ name: "", person_type: "normal", profile_image_url: "" });
    setSelectedImages({ front: null, left: null, right: null });
    setShowAddForm(false);
    Alert.alert("Success", "Profile created successfully!");
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (
      !selectedImages.front &&
      !selectedImages.left &&
      !selectedImages.right
    ) {
      Alert.alert("Error", "At least one face image is required");
      return;
    }

    createProfileMutation.mutate(formData);
  }, [formData, selectedImages, createProfileMutation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 20,
          backgroundColor: "rgba(0,0,0,0.9)",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 15,
          }}
        >
          Manage Profiles
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          style={{ marginLeft: "auto" }}
        >
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Add Profile Form */}
        {showAddForm && (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 15,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
              }}
            >
              Add New Profile
            </Text>

            <TextInput
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
                fontSize: 16,
              }}
              placeholder="Full Name"
              placeholderTextColor="#ccc"
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
            />

            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: "#fff", fontSize: 16, marginBottom: 10 }}>
                Person Type:
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {["normal", "staff", "criminal"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, person_type: type }))
                    }
                    style={{
                      backgroundColor:
                        formData.person_type === type
                          ? "#007AFF"
                          : "rgba(255,255,255,0.1)",
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: formData.person_type === type ? "#fff" : "#ccc",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 10 }}>
              Face Images:
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              {["front", "left", "right"].map((angle) => (
                <TouchableOpacity
                  key={angle}
                  onPress={() => pickImage(angle)}
                  style={{
                    width: 90,
                    height: 120,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: selectedImages[angle] ? 2 : 0,
                    borderColor: "#007AFF",
                  }}
                >
                  {selectedImages[angle] ? (
                    <Image
                      source={{ uri: selectedImages[angle].uri }}
                      style={{ width: "100%", height: "100%", borderRadius: 8 }}
                    />
                  ) : (
                    <>
                      <Camera size={24} color="#ccc" />
                      <Text
                        style={{ color: "#ccc", fontSize: 12, marginTop: 5 }}
                      >
                        {angle.toUpperCase()}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowAddForm(false)}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={createProfileMutation.isLoading || uploadLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#007AFF",
                  padding: 15,
                  borderRadius: 10,
                  alignItems: "center",
                  opacity:
                    createProfileMutation.isLoading || uploadLoading ? 0.6 : 1,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  {createProfileMutation.isLoading || uploadLoading
                    ? "Creating..."
                    : "Create Profile"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profiles List */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            Existing Profiles ({profiles.length})
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/import-dataset")}
            style={{
              backgroundColor: "#007AFF",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Database size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              Import Dataset
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Text style={{ color: "#ccc", textAlign: "center", padding: 20 }}>
            Loading profiles...
          </Text>
        ) : profiles.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <User size={48} color="#666" />
            <Text style={{ color: "#666", fontSize: 16, marginTop: 10 }}>
              No profiles added yet
            </Text>
            <Text
              style={{
                color: "#666",
                fontSize: 14,
                textAlign: "center",
                marginTop: 5,
              }}
            >
              Add your first profile to start face detection
            </Text>
          </View>
        ) : (
          profiles.map((profile) => (
            <View
              key={profile.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: 15,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor:
                    profile.person_type === "criminal" ? "#FF4444" : "#007AFF",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 15,
                }}
              >
                {profile.person_type === "criminal" ? (
                  <AlertTriangle size={24} color="#fff" />
                ) : (
                  <User size={24} color="#fff" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  {profile.name}
                </Text>
                <Text
                  style={{
                    color:
                      profile.person_type === "criminal"
                        ? "#FF4444"
                        : "#007AFF",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {profile.person_type.toUpperCase()}
                </Text>
                <Text style={{ color: "#ccc", fontSize: 12 }}>
                  Added {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
