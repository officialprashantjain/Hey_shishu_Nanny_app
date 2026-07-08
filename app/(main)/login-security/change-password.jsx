import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.mainTitle}>Change Password</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputBox}>
              <Image
                source={require("../../../assets/icons/lock.svg")}
                style={styles.inputIcon}
                tintColor="#666666"
              />
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                placeholder="••••••••"
                placeholderTextColor="#666666"
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Image
                  source={require("../../../assets/icons/eyeopen.svg")}
                  style={styles.eyeIcon}
                  tintColor="#666666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputBox}>
              <Image
                source={require("../../../assets/icons/lock.svg")}
                style={styles.inputIcon}
                tintColor="#666666"
              />
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="••••••••"
                placeholderTextColor="#666666"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Image
                  source={require("../../../assets/icons/eyeopen.svg")}
                  style={styles.eyeIcon}
                  tintColor="#666666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputBox}>
              <View style={styles.inputLeft}>
                <Image
                  source={require("../../../assets/icons/lock.svg")}
                  style={styles.inputIcon}
                  tintColor="#666666"
                />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#666666"
                />
              </View>
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Image
                  source={require("../../../assets/icons/eyeopen.svg")}
                  style={styles.eyeIcon}
                  tintColor="#666666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Change Password</Text>
        </TouchableOpacity>
      </View>
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
  mainTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
    lineHeight: 26,
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    width: "100%",
    gap: 6,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#0F172A",
    lineHeight: 20,
  },
  inputBox: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE7D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#344054",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  eyeIcon: {
    width: 20,
    height: 20,
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
});
