import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { CustomImage as Image } from "../common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import chatService from "../../services/chatService";
import socketService from "../../services/socketService";

const { width } = Dimensions.get("window");

const formatRelativeTime = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function ChatList({ showBackButton = false, backRoute }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      await socketService.connect();
      const list = await chatService.getConversations();

      // Deduplicate so each recipient appears only once in the list
      const seen = new Set();
      const uniqueList = (list || []).filter((conv) => {
        const recipientId = conv.recipient?.id || conv.recipient?._id;
        if (!recipientId) return true;
        const key = String(recipientId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const mapped = uniqueList.map((conv) => ({
        _id: conv._id,
        id: String(conv._id),
        recipient: conv.recipient,
        name: conv.recipient?.name || "Parent",
        subject: "Parent",
        message: conv.lastMessage?.text || "No messages yet",
        time: formatRelativeTime(conv.lastMessage?.sentAt || conv.updatedAt),
        unreadCount: conv.unreadCount || 0,
        bookingId: conv.bookingId || null,
        isOnline: false,
      }));
      setConversations(mapped);
    } catch (err) {
      console.warn("[Nanny ChatList] Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  useEffect(() => {
    const handleConvUpdated = () => {
      loadConversations();
    };

    socketService.on("conversation_updated", handleConvUpdated);
    return () => {
      socketService.off("conversation_updated", handleConvUpdated);
    };
  }, []);

  const filteredChats = conversations.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (chat) => {
    router.push({
      pathname: "/(main)/messages/chat",
      params: {
        conversationId: chat._id,
        receiverId: chat.recipient?.id,
        receiverRole: "parent",
        bookingId: chat.bookingId || "",
        name: chat.name,
        photo: chat.recipient?.photo || "",
        subject: "Parent",
      },
    });
  };


  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => backRoute ? router.push(backRoute) : router.back()}
              style={styles.backButton}
            >
              <Image
                source={require("../../../assets/icons/left-arrow.svg")}
                style={styles.backIcon}
                tintColor={colors.description}
                contentFit="contain"
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 }
        ]}
      >
        <View style={styles.searchContainer}>
          <Image
            source={require("../../../assets/icons/search.svg")}
            style={styles.searchIcon}
            tintColor="#71717A"
            contentFit="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.listContainer}>
          {filteredChats.map((chat, index) => (
            <View key={chat.id}>
              <TouchableOpacity
                style={styles.chatRow}
                onPress={() => handleChatPress(chat)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar]}>
                    <Image
                      source={chat.recipient?.photo ? { uri: chat.recipient.photo } : require("../../../assets/icons/nanny-image.svg")}
                      style={styles.avatarIcon}
                      contentFit="cover"
                    />
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: chat.isOnline ? "#22C55E" : "#E2E8F0",
                      },
                    ]}
                  />
                </View>

                <View style={styles.chatDetails}>
                  <View style={styles.nameTagRow}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <View style={styles.subjectBadge}>
                      <Text style={styles.subjectTagText}>
                        {chat.subject}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={[styles.lastMessage, chat.unreadCount > 0 && { fontWeight: "700", color: "#18181B" }]} numberOfLines={1}>
                      {chat.message}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.timeText}>{chat.time}</Text>
                      {chat.unreadCount > 0 && (
                        <View style={{ backgroundColor: "#22C55E", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>{chat.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              {index < filteredChats.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
          {filteredChats.length === 0 && (
            <Text style={styles.noResults}>No conversations found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  headerSafeArea: {
    backgroundColor: "#FFF6E6",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    fontWeight: "bold",
    color: colors.description,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  searchContainer: {
    backgroundColor: colors.white,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#0F172A",
  },
  listContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: "relative",
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.white,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  chatDetails: {
    flex: 1,
    gap: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatName: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  subjectTagText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  lastMessage: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
    maxWidth: width * 0.45,
  },
  timeText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  separator: {
    height: 1,
    backgroundColor: colors.description,
  },
  noResults: {
    textAlign: "center",
    fontFamily: fonts.rubik,
    color: "#64748B",
    paddingVertical: 20,
  },
});
