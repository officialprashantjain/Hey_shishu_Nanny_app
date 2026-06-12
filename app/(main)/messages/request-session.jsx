import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { width, height } = Dimensions.get("window");

export default function RequestSessionScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSendNow = () => {
    setModalVisible(false);
    router.push("/(main)/messages/request-sent");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request a Session</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require("../../../assets/icons/nanny-image.svg")}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <View style={styles.profileTextInfo}>
            <Text style={styles.tutorName}>Parent</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.illustrationCard}>
          <Image
            source={require("../../../assets/icons/illustration.svg")}
            style={styles.illustration}
            contentFit="fill"
          />
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Start a Session</Text>
          <Text style={styles.introSubtitle}>
            Parent is online now. You can send a request to start the session.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.startBtnText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Send a Request?</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Image
                  source={require("../../../assets/icons/cross.svg")}
                  style={styles.closeIcon}
                  tintColor="#64748B"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Image
                source={require("../../../assets/icons/illustration.svg")}
                style={styles.modalAvatar}
                contentFit="contain"
              />
              <Text style={styles.modalBodyText}>
                Send session request to parent?
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>No, Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSendBtn}
                  onPress={handleSendNow}
                >
                  <Text style={styles.modalSendBtnText}>Send Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    color: colors.description,
    flex: 1,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 160,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D7DFE9",
    overflow: "hidden",
  },
  avatar: {
    width: 52,
    height: 52,
  },
  profileTextInfo: {
    flex: 1,
    gap: 4,
  },
  tutorName: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  onlineText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#15803D",
    fontWeight: "500",
  },
  illustrationCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
    marginTop: 40,
  },
  illustration: {
    width: "100%",
    height: 200,
  },
  introCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  introTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: "#346960",
    textAlign: "center",
  },
  introSubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 60,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#346960",
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: "#475569",
    fontWeight: "bold",
  },
  startBtn: {
    flex: 1,
    backgroundColor: "#A87EE0",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.16)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  startBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(25, 15, 39, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentCard: {
    backgroundColor: colors.white,
    width: "100%",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 20,
    color: "#346960",
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  modalBody: {
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  modalAvatar: {
    width: 240,
    height: 220,
  },
  modalBodyText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  modalFooter: {},
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#346960",
  },
  modalCancelBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: "#475569",
    fontWeight: "bold",
  },
  modalSendBtn: {
    flex: 1,
    backgroundColor: "#A87EE0",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalSendBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.white,
    fontWeight: "bold",
  },
});
