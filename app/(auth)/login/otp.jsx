import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import * as Clipboard from "expo-clipboard";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { CustomButton } from "../../../src/components/common/CustomButton";
import { verifyOtp, sendOtp } from "../../../src/services/authServices";
import { selectAuthLoading, selectAuthError } from "../../../src/redux/slices/authSlice";
import { createMyProfile } from "../../../src/services/nannyService";
import { CustomAlertModal } from "../../../src/components/common/CustomAlertModal";

export default function LoginOTPScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const { type, phoneNumber } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(39);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });
  const inputRef = useRef(null);
  const lastCopiedOtpRef = useRef("");

  const showAlert = (title, message, type = "success") => {
    setAlertModal({ visible: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
  };

  // Check clipboard for copied OTP (e.g. from Truecaller "Copy OTP" or notification)
  const checkClipboardForOtp = async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;
      const text = await Clipboard.getStringAsync();
      if (!text) return;
      const match = text.match(/\b\d{4}\b/);
      if (match) {
        const foundOtp = match[0];
        if (foundOtp && foundOtp !== lastCopiedOtpRef.current) {
          lastCopiedOtpRef.current = foundOtp;
          setOtp(foundOtp);
        }
      }
    } catch {
      // Ignore clipboard read errors silently
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      checkClipboardForOtp();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Listen to AppState changes (e.g. when user interacts with Truecaller notification and returns)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkClipboardForOtp();
      }
    });

    const interval = setInterval(() => {
      if (otp.length < 4) {
        checkClipboardForOtp();
      }
    }, 1200);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [otp.length]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSubmit = async () => {
    if (!phoneNumber || otp.length !== 4) return;

    const result = await dispatch(verifyOtp(phoneNumber, otp));
    if (result.success) {
      if (result.profileNotFound) {
        Alert.alert(
          'Profile Not Found ⚠️',
          'Your profile is not created yet. Click OK to create it and fill in your details.',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  await createMyProfile({});
                  router.replace('/(main)/personal-info');
                } catch (err) {
                  showAlert('Error', 'Failed to create profile. Please try again.', 'error');
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else if (!result.isProfileComplete) {
        Alert.alert(
          'Profile Incomplete ⚠️',
          'Your profile is not complete yet. Please fill in your details to get started.',
          [
            {
              text: 'Complete Now',
              onPress: () => router.replace('/(main)/personal-info'),
            },
          ],
          { cancelable: false }
        );
      } else {
        router.replace('/(main)/(tabs)/requests');
      }
    } else if (result.message) {
      showAlert('Verification Failed', result.message, 'error');
    }
  };

  const handleChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 4);
    setOtp(numericText);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !phoneNumber) return;

    const result = await dispatch(sendOtp(phoneNumber));
    if (result.success) {
      // Reset the 4 digit OTP boxes automatically
      setOtp("");
      lastCopiedOtpRef.current = "";
      inputRef.current?.focus();
      setResendTimer(39);
      showAlert(
        "Code Sent! ✨",
        "A new 4-digit verification code has been sent to your registered mobile number.",
        "success"
      );
    } else {
      showAlert('Error', result.message || 'Failed to resend code', 'error');
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code sent to {phoneNumber || "your phone number"}
          </Text>

          {/* Master hidden input + 4 visual boxes */}
          <Pressable
            style={styles.otpContainer}
            onPress={() => inputRef.current?.focus()}
          >
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleChange}
              maxLength={4}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              importantForAutofill="yes"
              autoFocus={true}
              selectionColor="transparent"
              cursorColor="transparent"
              style={styles.hiddenInput}
            />
            {[0, 1, 2, 3].map((index) => {
              const digit = otp[index] || "";
              const isFocused = otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpInput,
                    isFocused && styles.otpInputFocused,
                    digit ? styles.otpInputFilled : null,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              );
            })}
          </Pressable>
        </View>

        {authError ? (
          <Text style={styles.errorText}>{authError}</Text>
        ) : null}

        <View style={styles.footer}>
          <CustomButton
            title={isLoading ? "" : "Submit"}
            onPress={handleSubmit}
            disabled={otp.length !== 4 || isLoading}
            style={{
              borderRadius: 30,
            }}
            icon={isLoading ? <ActivityIndicator color={colors.white} /> : null}
          />
          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={resendTimer > 0}
          >
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <Text style={[styles.resendLink, resendTimer > 0 && styles.disabledLink]}>Resend</Text>
            {resendTimer > 0 && <Text style={styles.resendText}> in {resendTimer} seconds</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CustomAlertModal
        visible={alertModal.visible}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "flex-start",
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 28,
    color: colors.primary,
    textAlign: "left",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    textAlign: "left",
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    position: "relative",
    marginVertical: 10,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.01,
    color: "transparent",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  otpInput: {
    width: 52,
    height: 60,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.description,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  otpInputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: "#F5FAF9",
  },
  otpInputFilled: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpDigit: {
    fontSize: 24,
    fontFamily: fonts.rubikBold,
    color: colors.primary,
    fontWeight: "bold",
  },
  resendButton: {
    flexDirection: "row",
    marginTop: 20,
    alignSelf: "center",
  },
  resendText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  resendLink: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "bold",
  },
  disabledLink: {
    color: colors.description,
    opacity: 0.5,
  },
  errorText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#D32F2F",
    marginBottom: 12,
    marginTop: -10,
    textAlign: "center",
  },
  footer: {
    marginBottom: 60,
  },
});
