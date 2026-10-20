import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import supportService from "../../../src/services/support.service";

const { height } = Dimensions.get("window");

const NANNY_SUBJECT_OPTIONS = [
  "Payment not received",
  "Shift / Schedule dispute",
  "Attendance & Check-in issue",
  "Parent / Child concern",
  "App technical issue",
  "Other",
];

const PRIORITY_OPTIONS = [
  "Urgent",
  "High",
  "Medium",
  "Low",
];

export default function SupportTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New ticket modal states
  const [isRaiseTicketVisible, setIsRaiseTicketVisible] = useState(false);
  const [subject, setSubject] = useState("Payment not received");
  const [priority, setPriority] = useState("Medium");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dropdown selector modal states
  const [dropdownType, setDropdownType] = useState(null); // 'subject' | 'priority'

  const fetchTickets = useCallback(async () => {
    try {
      const res = await supportService.getMyTickets();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setTickets(list);
    } catch (err) {
      console.warn("Failed to fetch tickets in Nanny App:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleCreateTicket = async () => {
    if (!details.trim()) {
      Alert.alert("Missing Details", "Please describe your issue.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await supportService.createTicket({
        subject,
        category: subject,
        priority,
        description: details.trim(),
      });

      if (res?.success || res?.data || res?.ticketNumber || res?._id) {
        Alert.alert("Success", "Support ticket raised successfully!");
        setDetails("");
        setIsRaiseTicketVisible(false);
        fetchTickets();
      } else {
        Alert.alert("Error", res?.message || "Failed to create ticket");
      }
    } catch (err) {
      console.error("Create ticket error in Nanny App:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getPriorityStyle = (p) => {
    switch (p) {
      case "Urgent":
        return { border: "#EF4444", text: "#EF4444" };
      case "High":
        return { border: "#F97316", text: "#F97316" };
      case "Medium":
        return { border: "#EAB308", text: "#CA8A04" };
      default:
        return { border: "#94A3B8", text: "#64748B" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(main)/profile")}
          style={styles.backButton}
        >
          <Image
            source={require("../../../assets/icons/left-arrow.svg")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Tickets</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support Tickets</Text>
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={() => setIsRaiseTicketVisible(true)}
          >
            <Image
              source={require("../../../assets/icons/add-new.svg")}
              style={styles.btnPlusIcon}
              tintColor={colors.white}
            />
            <Text style={styles.newTicketText}>New Ticket</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#A87EE0" />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptyDesc}>
              Have a question or problem? Tap "+ New Ticket" above to contact support.
            </Text>
          </View>
        ) : (
          tickets.map((ticket) => {
            const priorityColors = getPriorityStyle(ticket.priority);
            return (
              <TouchableOpacity
                key={ticket._id}
                style={styles.ticketCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(main)/support/detail",
                    params: { id: ticket._id },
                  })
                }
              >
                <View style={styles.ticketCardHeader}>
                  <Text style={styles.ticketId}>#{ticket.ticketNumber}</Text>
                  <Text style={styles.ticketTime}>
                    {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                  </Text>
                </View>

                <View style={styles.ticketCardBody}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={styles.ticketDescription} numberOfLines={2}>
                    {ticket.lastMessageSnippet || ticket.description}
                  </Text>
                </View>

                <View style={styles.ticketCardFooter}>
                  <View
                    style={[
                      styles.urgentBadge,
                      { borderColor: priorityColors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgentText,
                        { color: priorityColors.text },
                      ]}
                    >
                      {ticket.priority}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── RAISE TICKET MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={isRaiseTicketVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRaiseTicketVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlayBackdrop}
        >
          <TouchableOpacity
            style={styles.backdropPressable}
            activeOpacity={1}
            onPress={() => setIsRaiseTicketVisible(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetIndicator} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bottomSheetScroll}
            >
              <Text style={styles.modalTitle}>Raise a Support Ticket</Text>

              {/* Subject selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDropdownType("subject")}
                >
                  <Text style={styles.dropdownButtonText}>{subject}</Text>
                  <Image
                    source={require("../../../assets/icons/left-arrow.svg")}
                    style={[
                      styles.dropdownIconSmall,
                      { transform: [{ rotate: "-90deg" }] },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Priority selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDropdownType("priority")}
                >
                  <Text style={styles.dropdownButtonText}>{priority}</Text>
                  <Image
                    source={require("../../../assets/icons/left-arrow.svg")}
                    style={[
                      styles.dropdownIconSmall,
                      { transform: [{ rotate: "-90deg" }] },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Details textarea */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Details</Text>
                <TextInput
                  style={styles.textArea}
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Describe your issue..."
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsRaiseTicketVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.raiseBtn, submitting && { opacity: 0.6 }]}
                  disabled={submitting}
                  onPress={handleCreateTicket}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.raiseBtnText}>Raise Ticket</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DROPDOWN PICKER MODAL ─────────────────────────────────────────── */}
      <Modal
        visible={dropdownType !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownType(null)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setDropdownType(null)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>
              Select {dropdownType === "subject" ? "Subject" : "Priority"}
            </Text>
            {(dropdownType === "subject" ? NANNY_SUBJECT_OPTIONS : PRIORITY_OPTIONS).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    if (dropdownType === "subject") setSubject(item);
                    else setPriority(item);
                    setDropdownType(null);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      (dropdownType === "subject" ? subject : priority) === item &&
                        styles.pickerItemActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
    justifyContent: "center",
  },
  backIcon: {
    width: 14,
    height: 14,
    tintColor: colors.description,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.description,
    flex: 1,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: "#346960",
  },
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#A87EE0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "white",
  },
  btnPlusIcon: {
    width: 14,
    height: 14,
  },
  newTicketText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: "#346960",
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  ticketCard: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE7D4",
    shadowColor: "#344054",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketId: {
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    color: "#346960",
  },
  ticketTime: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: "#64748B",
  },
  ticketCardBody: {
    marginBottom: 12,
  },
  ticketSubject: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 4,
  },
  ticketDescription: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  ticketCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentText: {
    fontFamily: fonts.rubikBold,
    fontSize: 11,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: "#334155",
    fontWeight: "600",
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: "100%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 15,
    minHeight: height * 0.55,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: colors.description,
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    fontWeight: "700",
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  dropdownButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  dropdownIconSmall: {
    width: 10,
    height: 10,
    opacity: 0.5,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 16,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    height: 100,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.description,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginRight: 10,
  },
  cancelBtnText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: "700",
    opacity: 0.5,
  },
  raiseBtn: {
    flex: 1,
    backgroundColor: "#A87EE0",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  raiseBtnText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.white,
    fontWeight: "700",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
  },
  pickerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 15,
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerItemText: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: "#475569",
  },
  pickerItemActive: {
    color: "#A87EE0",
    fontFamily: fonts.rubikBold,
  },
});
