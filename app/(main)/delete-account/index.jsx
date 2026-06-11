import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Image
            source={require("../../../assets/icons/left-arrow.svg")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.warningBox}>
          <Image
            source={require("../../../assets/icons/delete-account.svg")}
            style={styles.warningIcon}
            tintColor={colors.error}
          />
          <Text style={styles.warningTitle}>Warning</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data from
            HeyShishu. This action cannot be undone.
          </Text>
        </View>

        <View style={styles.reasons}>
          <Text style={styles.reasonTitle}>Why are you leaving?</Text>
          <Text style={styles.reasonHint}>
            This helps us improve HeyShishu for others.
          </Text>
          {/* Add reason options here if needed */}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require("../../../assets/icons/delete-account.svg")}
              style={styles.modalIcon}
              tintColor={colors.error}
              contentFit="contain"
            />
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to delete your account?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setIsModalVisible(false);
                  router.push("/(auth)/login");
                }}
              >
                <Text style={styles.confirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 20,
    paddingBottom: 120,
  },
  warningBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  warningIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.error,
    marginBottom: 8,
  },
  warningText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    textAlign: "center",
    lineHeight: 20,
  },
  reasons: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
  },
  reasonTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.description,
    marginBottom: 4,
  },
  reasonHint: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    opacity: 0.7,
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: colors.background,
  },
  deleteBtn: {
    backgroundColor: colors.error,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 60,
  },
  deleteBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 30,
    width: "85%",
    alignItems: "center",
  },
  modalIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.rubikBold,
    color: colors.error,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.rubik,
    color: colors.description,
    textAlign: "center",
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
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
  confirmBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  confirmBtnText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
  },
});
