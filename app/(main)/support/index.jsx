import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { height } = Dimensions.get("window");

export default function SupportTicketsScreen() {
  const router = useRouter();
  const [isRaiseTicketVisible, setIsRaiseTicketVisible] = useState(false);
  const [subject, setSubject] = useState("Account problem");
  const [priority, setPriority] = useState("Medium priority");
  const [details, setDetails] = useState("");

  const tickets = [
    {
      id: "9820219",
      title: "Payment not received",
      status: "Urgent",
      desc: "We’re sorry to hear you’re having trouble receiving your payment",
      time: "31m ago",
    },
    {
      id: "9820220",
      title: "I am facing login issue",
      status: "High",
      desc: "We’re sorry to hear you’re having trouble logging in",
      time: "1h ago",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(main)/profile')}
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

        {tickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketCardHeader}>
              <Text style={styles.ticketId}>#{ticket.id}</Text>
              <Text style={styles.ticketTime}>{ticket.time}</Text>
            </View>

            <View style={styles.ticketCardBody}>
              <Text style={styles.ticketSubject}>{ticket.title}</Text>
              <Text style={styles.ticketDescription}>{ticket.desc}</Text>
            </View>

            <View style={styles.ticketCardFooter}>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>{ticket.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <TouchableOpacity style={styles.dropdownButton}>
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority</Text>
                <TouchableOpacity style={styles.dropdownButton}>
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
                  style={styles.raiseBtn}
                  onPress={() => setIsRaiseTicketVisible(false)}
                >
                  <Text style={styles.raiseBtnText}>Raise Ticket</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 120,
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
    color: colors.primary,
  },
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
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
    fontFamily: fonts.rubik,
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  ticketCard: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
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
    marginBottom: 4,
  },
  ticketId: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.primary,
  },
  ticketTime: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  ticketCardBody: {
    marginBottom: 16,
  },
  ticketSubject: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 4,
  },
  ticketDescription: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  ticketCardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  urgentBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: "#92400E",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 60,
  },
  saveBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetScroll: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 24,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  dropdownIconSmall: {
    width: 12,
    height: 12,
    tintColor: colors.description,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.description,
    fontFamily: fonts.rubikBold,
  },
  raiseBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  raiseBtnText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
  },
});
