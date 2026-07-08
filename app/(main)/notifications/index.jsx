import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const INITIAL_NOTIFICATIONS = [
  {
    id: "1",
    type: "avatar",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&auto=format&fit=crop",
    textParts: [
      { text: "Robert Fox", bold: true },
      { text: " is has booked you for the  child care", bold: false },
    ],
    time: "6h ago",
    isRead: false,
  },
  {
    id: "2",
    type: "icon",
    iconName: "calendar-outline",
    iconBg: "#F3E8FF", // Light purple background
    iconColor: "#A855F7", // Purple icon
    textParts: [
      { text: "Your booking request with ", bold: false },
      { text: "Robert Fox", bold: true },
      { text: " starts in 30 minutes. Get ready!", bold: false },
    ],
    time: "Monday 12:18am",
    isRead: false,
  },
  {
    id: "3",
    type: "icon",
    iconName: "close-outline",
    iconBg: "#FEE2E2", // Light red background
    iconColor: "#EF4444", // Red icon
    textParts: [
      { text: "Your session with ", bold: false },
      { text: "Robert Fox", bold: true },
      { text: " on 01 Jul, 12:00-1:00 has been cancelled", bold: false },
    ],
    time: "1w ago",
    isRead: false,
  },
  {
    id: "4",
    type: "icon",
    iconName: "checkmark-done-outline",
    iconBg: "#D1FAE5", // Light green background
    iconColor: "#10B981", // Green icon
    textParts: [
      { text: "You have successfully complete the child care session with ", bold: false },
      { text: "Robert Fox ", bold: true },
      { text: " ", bold: false },
    ],
    time: "19d ago",
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Unread"); // "Unread" | "All"
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "Unread") return !notif.isRead;
    return true; // "All" tab
  });

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
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={18} color={colors.description} style={{ opacity: 0.6 }} />
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
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
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.description} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>No notifications here.</Text>
          </View>
        ) : (
          filteredNotifications.map((notif, index) => (
            <View key={notif.id}>
              <View style={styles.notificationItem}>
                
                {/* Image/Icon Block */}
                <View style={styles.iconContainer}>
                  {notif.type === "avatar" ? (
                    <Image source={{ uri: notif.image }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.iconCircle, { backgroundColor: notif.iconBg }]}>
                      <Ionicons name={notif.iconName} size={20} color={notif.iconColor} />
                    </View>
                  )}
                </View>

                {/* Text Content */}
                <View style={styles.textContent}>
                  <Text style={styles.notifText}>
                    {notif.textParts.map((part, i) => (
                      <Text
                        key={i}
                        style={[
                          part.bold ? styles.textBold : styles.textRegular,
                        ]}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                  <Text style={styles.timeText}>{notif.time}</Text>
                </View>

                {/* Unread dot hint (optional, but good UX if user is in 'All' tab) */}
                {!notif.isRead && activeTab === "All" && (
                  <View style={styles.unreadDot} />
                )}
              </View>

              {/* Divider lines between items */}
              {index < filteredNotifications.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Themed background
  },
  navHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
    marginTop: 16,
    marginBottom: 20,
  },
  mainTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 26,
    color: colors.primary,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  markReadText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    opacity: 0.7,
    marginLeft: 6,
  },
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 16,
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    opacity: 0.8,
  },
  tabButtonTextActive: {
    fontFamily: fonts.rubikBold,
    color: colors.white,
    opacity: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
  },
  notifText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    lineHeight: 20,
    marginBottom: 6,
  },
  textRegular: {
    fontFamily: fonts.rubik,
  },
  textBold: {
    fontFamily: fonts.rubikBold,
  },
  timeText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    opacity: 0.6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.rubik,
    color: colors.description,
    opacity: 0.5,
    marginTop: 10,
    fontSize: 15,
  }
});
