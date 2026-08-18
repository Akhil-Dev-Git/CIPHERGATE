import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Filter,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function DetectionLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filterType, setFilterType] = useState("all");

  // Fetch detection logs
  const {
    data: logs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["detection-logs", filterType],
    queryFn: async () => {
      let url = "/api/detection-logs?limit=100";
      if (filterType !== "all") {
        url += `&detection_type=${filterType}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "security_check", label: "Security" },
    { key: "entry", label: "Entry" },
    { key: "exit", label: "Exit" },
    { key: "attendance", label: "Attendance" },
  ];

  const getStatusColor = (log) => {
    if (!log.profile_id) return "#FFAA00"; // Unknown person
    if (log.person_type === "criminal") return "#FF4444"; // Criminal
    return "#44FF44"; // Normal/Staff
  };

  const getStatusIcon = (log) => {
    if (!log.profile_id) return <User size={16} color="#FFAA00" />;
    if (log.person_type === "criminal")
      return <AlertTriangle size={16} color="#FF4444" />;
    return <CheckCircle size={16} color="#44FF44" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {});

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
          Detection Logs
        </Text>
        <View style={{ marginLeft: "auto" }}>
          <Filter size={24} color="#007AFF" />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        style={{ maxHeight: 60 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        showsHorizontalScrollIndicator={false}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => setFilterType(option.key)}
            style={{
              backgroundColor:
                filterType === option.key ? "#007AFF" : "rgba(255,255,255,0.1)",
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 10,
            }}
          >
            <Text
              style={{
                color: filterType === option.key ? "#fff" : "#ccc",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#fff"
          />
        }
      >
        {isLoading ? (
          <Text style={{ color: "#ccc", textAlign: "center", padding: 20 }}>
            Loading logs...
          </Text>
        ) : logs.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Clock size={48} color="#666" />
            <Text style={{ color: "#666", fontSize: 16, marginTop: 10 }}>
              No detection logs found
            </Text>
            <Text
              style={{
                color: "#666",
                fontSize: 14,
                textAlign: "center",
                marginTop: 5,
              }}
            >
              Capture some faces to see detection history
            </Text>
          </View>
        ) : (
          Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <View key={date} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                {date}
              </Text>

              {dateLogs.map((log) => {
                const { time } = formatDate(log.created_at);
                const statusColor = getStatusColor(log);

                return (
                  <View
                    key={log.id}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      padding: 15,
                      marginBottom: 10,
                      borderLeftWidth: 4,
                      borderLeftColor: statusColor,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          {getStatusIcon(log)}
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              fontWeight: "600",
                              marginLeft: 8,
                            }}
                          >
                            {log.profile_name || "Unknown Person"}
                          </Text>
                        </View>

                        {/* Show matching percentage if available */}
                        {log.detected_features?.all_matches &&
                          log.detected_features.all_matches.length > 0 && (
                            <Text
                              style={{
                                color:
                                  log.detected_features.all_matches[0]
                                    .match_percentage >= 70
                                    ? "#44FF44"
                                    : log.detected_features.all_matches[0]
                                          .match_percentage >= 50
                                      ? "#FFAA00"
                                      : "#FF4444",
                                fontSize: 14,
                                fontWeight: "600",
                                marginBottom: 4,
                              }}
                            >
                              Match:{" "}
                              {
                                log.detected_features.all_matches[0]
                                  .match_percentage
                              }
                              %
                            </Text>
                          )}

                        {log.person_type && (
                          <Text
                            style={{
                              color: statusColor,
                              fontSize: 12,
                              fontWeight: "600",
                              marginBottom: 4,
                            }}
                          >
                            {log.person_type.toUpperCase()}
                          </Text>
                        )}

                        <Text style={{ color: "#ccc", fontSize: 12 }}>
                          {log.detection_type.replace("_", " ").toUpperCase()}
                        </Text>

                        {log.location && (
                          <Text style={{ color: "#ccc", fontSize: 12 }}>
                            📍 {log.location}
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#ccc", fontSize: 12 }}>
                          {time}
                        </Text>
                        {log.confidence_score && (
                          <Text
                            style={{
                              color:
                                log.confidence_score > 0.7
                                  ? "#44FF44"
                                  : "#FFAA00",
                              fontSize: 12,
                              fontWeight: "600",
                              marginTop: 2,
                            }}
                          >
                            {(log.confidence_score * 100).toFixed(1)}%
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Additional detected features */}
                    {log.detected_features &&
                      typeof log.detected_features === "object" && (
                        <View
                          style={{
                            backgroundColor: "rgba(0,0,0,0.3)",
                            borderRadius: 6,
                            padding: 8,
                            marginTop: 8,
                          }}
                        >
                          <Text style={{ color: "#ccc", fontSize: 11 }}>
                            Features:{" "}
                            {log.detected_features.face_angle || "N/A"} face,
                            {log.detected_features.skin_tone
                              ? ` ${log.detected_features.skin_tone}`
                              : ""}
                          </Text>
                        </View>
                      )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
