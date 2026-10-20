import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import supportService from "../../../src/services/support.service";

// Modern SVG Refresh Icon
const RefreshIcon = ({ size = 20, color = "#7C3AED" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12a8 8 0 0114.93-3.93M20 12a8 8 0 01-14.93 3.93"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 4v5h-5M4 20v-5h5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function NannyTicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchTicketDetails = useCallback(async (isSilent = false) => {
    if (!id) return;
    try {
      const res = await supportService.getTicketDetails(id);
      const data = res?.data || res;
      if (data && (data._id || data.ticketNumber)) {
        setTicket(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      if (!isSilent) {
        console.warn("Error fetching ticket details in Nanny App:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketDetails();

    // Auto-poll for new messages every 10 seconds while screen is open
    const interval = setInterval(() => {
      fetchTicketDetails(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTicketDetails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const res = await supportService.replyTicket(id, replyText.trim());
      if (res?.success || res?.data || res?._id) {
        setReplyText("");
        await fetchTicketDetails(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 150);
      } else {
        Alert.alert("Error", res?.message || "Failed to send message");
      }
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = () => {
    Alert.alert(
      "Close Ticket",
      "Are you sure you want to mark this issue as resolved and close the ticket?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Close",
          style: "destructive",
          onPress: async () => {
            try {
              setClosing(true);
              await supportService.closeTicket(id);
              Alert.alert("Success", "Ticket has been closed.");
              fetchTicketDetails();
            } catch (err) {
              Alert.alert("Error", err?.message || "Failed to close ticket");
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={styles.backIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Ticket #{ticket?.ticketNumber || "..."}
          </Text>
        </View>

        {/* Refresh Icon Button in Header */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#A87EE0" />
          ) : (
            <RefreshIcon size={20} color="#7C3AED" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A87EE0" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : !ticket ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Ticket not found.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Ticket Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.subjectText}>{ticket.subject}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{ticket.status}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.categoryText}>Category: {ticket.category}</Text>
              <Text style={styles.priorityText}>Priority: {ticket.priority}</Text>
            </View>

            {ticket.status !== "Closed" && (
              <TouchableOpacity
                style={styles.closeTicketButton}
                onPress={handleCloseTicket}
                disabled={closing}
              >
                {closing ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Text style={styles.closeTicketText}>✓ Mark as Resolved & Close</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Conversation Messages with Pull to Refresh */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#A87EE0"]}
                tintColor="#A87EE0"
              />
            }
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((msg) => {
              const isAdmin = msg.senderRole === "admin";
              const isSystem = msg.senderRole === "system";

              if (isSystem) {
                return (
                  <View key={msg._id} style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{msg.message}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageRow,
                    isAdmin ? styles.adminMessageRow : styles.userMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isAdmin ? styles.adminBubble : styles.userBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.senderName,
                        isAdmin ? styles.adminSenderName : styles.userSenderName,
                      ]}
                    >
                      {isAdmin ? "HeyShishu Support" : "You (Nanny)"}
                    </Text>

                    <Text
                      style={[
                        styles.messageText,
                        isAdmin ? styles.adminMessageText : styles.userMessageText,
                      ]}
                    >
                      {msg.message}
                    </Text>

                    <Text
                      style={[
                        styles.messageTime,
                        isAdmin ? styles.adminMessageTime : styles.userMessageTime,
                      ]}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Reply Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a message..."
              placeholderTextColor="#94A3B8"
              multiline={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!replyText.trim() || sending) && { opacity: 0.5 },
              ]}
              disabled={!replyText.trim() || sending}
              onPress={handleSendReply}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E8D5",
    backgroundColor: "#FFF6E6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  backIcon: {
    width: 14,
    height: 14,
    tintColor: colors.description,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.description,
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
  },
  errorText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#EF4444",
  },
  summaryCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE7D4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  subjectText: {
    fontFamily: fonts.rubikBold,
    fontSize: 15,
    color: "#1E293B",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: fonts.rubikBold,
    fontSize: 11,
    color: "#7C3AED",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  categoryText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#64748B",
  },
  priorityText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#64748B",
  },
  closeTicketButton: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
  },
  closeTicketText: {
    fontFamily: fonts.rubikBold,
    fontSize: 12,
    color: "#059669",
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  systemMessageContainer: {
    alignSelf: "center",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 8,
  },
  systemMessageText: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: "#475569",
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  adminMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: "#A87EE0",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontFamily: fonts.rubikBold,
    fontSize: 11,
    marginBottom: 4,
  },
  userSenderName: {
    color: "#7C3AED",
  },
  adminSenderName: {
    color: "#FFFFFF",
  },
  messageText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#1E293B",
  },
  adminMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userMessageTime: {
    color: "#94A3B8",
  },
  adminMessageTime: {
    color: "rgba(255,255,255,0.8)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#A87EE0",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
});
