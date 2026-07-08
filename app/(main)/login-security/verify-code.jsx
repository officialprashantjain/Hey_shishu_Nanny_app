import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function VerifyCodeScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (!numericText && text !== "") return;

    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    if (numericText && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

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
          <Text style={styles.headerTitle}>Verify Code</Text>
        </View>

        <View style={[styles.content, { flex: 1 }]}>
          <View style={styles.topSection}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              Enter the 4-digit code sent to your phone number
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <Text style={styles.resendLink}>Resend</Text>
            <Text style={styles.resendText}> in 39 second</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              otp.some((digit) => !digit) && styles.saveBtnDisabled,
            ]}
            onPress={() => router.push("/(main)/login-security/congrats")}
            disabled={otp.some((digit) => !digit)}
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
  content: {
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 120,
  },
  topSection: {
    alignItems: "flex-start",
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
    textAlign: "left",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#475569",
    textAlign: "left",
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  otpInput: {
    width: 60,
    height: 70,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontFamily: fonts.rubikBold,
    color: colors.primary,
    fontWeight: "bold",
  },
  resendButton: {
    flexDirection: "row",
    marginTop: 40,
    alignSelf: "center",
  },
  resendText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
  },
  resendLink: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.primary,
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
