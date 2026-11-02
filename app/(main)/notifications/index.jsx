import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../../src/services/notificationService";
import socketService from "../../../src/services/socketService";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getIconForType(type) {
  switch (type) {
    case "booking_request":
      return { name: "calendar", bg: "#FFF7ED", color: "#F97316" };
    case "booking_confirmed":
      return { name: "checkmark-circle", bg: "#ECFDF5", color: "#10B981" };
    case "booking_cancelled":
    case "booking_timeout":
      return { name: "close-circle", bg: "#FEF2F2", color: "#EF4444" };
    case "booking_otp":
      return { name: "key", bg: "#EFF6FF", color: "#3B82F6" };
    case "booking_completed":
      return { name: "checkmark-done-circle", bg: "#D1FAE5", color: "#059669" };
    case "booking_review":
      return { name: "star", bg: "#FEF3C7", color: "#F59E0B" };
    default:
      return { name: "notifications", bg: "#F3E8FF", color: "#8B5CF6" };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Unread"); // "Unread" | "All"
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getNotifications({
        tab: activeTab === "Unread" ? "unread" : "all",
      });
      const list = res?.data?.notifications || res?.notifications || [];
      setNotifications(list);
    } catch (err) {
      console.warn("[Notifications] Error loading notifications:", err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    loadNotifications();
  }, [loadNotifications]);

  // Real-time live socket listener while on Notifications screen
  useEffect(() => {
    const handleLiveNotif = (notif) => {
      if (!notif) return;
      setNotifications((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)]);
    };
    socketService.on("booking_notification", handleLiveNotif);
    return () => {
      socketService.off("booking_notification", handleLiveNotif);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      if (activeTab === "Unread") {
        setNotifications([]);
      }
    } catch (err) {
      console.warn("[Notifications] Failed markAllAsRead:", err.message);
    }
  };

  const handleItemPress = async (notif) => {
    if (!notif) return;

    if (!notif.isRead) {
      try {
        await markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.warn("[Notifications] markAsRead error:", err.message);
      }
    }

    const { type, data } = notif;
    if (data?.screen === "requests" || type === "booking_request" || type === "booking_timeout" || type === "booking_cancelled") {
      router.push("/(main)/(tabs)/requests");
    } else if (data?.screen === "upcoming" || type === "booking_confirmed") {
      router.push("/(main)/(tabs)/upcoming");
    } else if (data?.screen === "service" || type === "booking_started") {
      router.push("/(main)/(tabs)/service");
    } else if (data?.screen === "earnings" || type === "booking_completed") {
      router.push("/(main)/earnings");
    } else if (data?.screen === "ratings" || type === "booking_review") {
      router.push("/(main)/ratings");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER NAVIGATION ── */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.description} />
          <Text style={styles.navTitle}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* ── MAIN TITLE & MARK AS READ ── */}
      <View style={styles.titleRow}>
        <Text style={styles.mainTitle}>Notifications</Text>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── TABS (Unread / All) ── */}
      <View style={styles.tabContainer}>
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "Unread" && styles.tabButtonActive]}
            onPress={() => setActiveTab("Unread")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "Unread" && styles.tabButtonTextActive,
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "All" && styles.tabButtonActive]}
            onPress={() => setActiveTab("All")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "All" && styles.tabButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── NOTIFICATIONS LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={colors.description}
              style={{ opacity: 0.3 }}
            />
            <Text style={styles.emptyText}>No notifications here.</Text>
          </View>
        ) : (
          notifications.map((notif, index) => {
            const iconConfig = getIconForType(notif.type);
            return (
              <View key={notif._id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.notificationItem,
                    !notif.isRead && styles.unreadItemBg,
                  ]}
                  onPress={() => handleItemPress(notif)}
                >
                  {/* Icon Block */}
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                      <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
                    </View>
                  </View>

                  {/* Text Content */}
                  <View style={styles.textContent}>
                    <Text style={[styles.titleText, !notif.isRead && styles.unreadTitle]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.bodyText} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <Text style={styles.timeText}>{formatTimeAgo(notif.createdAt)}</Text>
                  </View>

                  {/* Unread dot */}
                  {!notif.isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>

                {index < notifications.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  navTitle: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 12,
  },
  mainTitle: {
    fontFamily: fonts.medium,
    fontSize: 24,
    color: colors.text,
    fontWeight: "700",
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markReadText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 15,
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#111827",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.description,
    marginTop: 12,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  unreadItemBg: {
    backgroundColor: "rgba(168, 126, 224, 0.05)",
  },
  iconContainer: {
    marginRight: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
  },
  titleText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
    fontWeight: "500",
  },
  unreadTitle: {
    color: "#111827",
    fontWeight: "700",
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  timeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});
