import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function TwoStepScreen() {
  const router = useRouter();

  const [isEnabled, setIsEnabled] = useState(true);
  const [phone, setPhone] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          <Text style={styles.headerTitle}>2-Step Verification</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topSection}>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>2-Step Verification</Text>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  isEnabled ? styles.toggleOn : styles.toggleOff,
                ]}
                onPress={() => setIsEnabled(!isEnabled)}
              >
                <View style={styles.toggleThumb} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Additional layer of security for your account
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryPicker}>
                  <View style={styles.countryInfo}>
                    <Image
                      source={require("../../../assets/icons/india.svg")}
                      style={styles.flag}
                    />
                    <Text style={styles.countryCode}>(+91)</Text>
                  </View>
                </View>
                <View style={styles.numberInputBox}>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="555-0113"
                    placeholderTextColor="#666666"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              phone.length !== 10 && styles.saveBtnDisabled,
            ]}
            onPress={() => router.push("/(main)/login-security/verify-code")}
            disabled={phone.length !== 10}
          >
            <Text style={styles.saveBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  topSection: {
    marginBottom: 32,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
    lineHeight: 26,
  },
  toggleBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 100,
    width: 44,
    borderWidth: 1,
    borderColor: "white",
  },
  toggleOn: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
    paddingLeft: 14,
  },
  toggleOff: {
    backgroundColor: "#CBD5E1",
    alignItems: "flex-start",
    paddingRight: 14,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: "white",
    borderRadius: 9999,
  },
  subtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
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
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countryPicker: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#EEE7D4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#344054",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flag: {
    width: 24,
    height: 24,
  },
  countryCode: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  numberInputBox: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#EEE7D4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#344054",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  numberInput: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
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
  saveBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  saveBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
});
