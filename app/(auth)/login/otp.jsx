import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { CustomButton } from "../../../src/components/common/CustomButton";
import { verifyOtp, sendOtp } from "../../../src/services/authServices";
import { selectAuthLoading, selectAuthError } from "../../../src/redux/slices/authSlice";
import { createMyProfile } from "../../../src/services/nannyService";

export default function LoginOTPScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const { type, phoneNumber } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(39);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    // Only allow numbers
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

  const handleSubmit = async () => {
    const otpCode = otp.join("");
    if (!phoneNumber || otpCode.length !== 4) return;

    const result = await dispatch(verifyOtp(phoneNumber, otpCode));
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
                  Alert.alert('Error', 'Failed to create profile. Please try again.');
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
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !phoneNumber) return;

    const result = await dispatch(sendOtp(phoneNumber));
    if (result.success) {
      setResendTimer(39);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Alert.alert('Error', result.message);
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

        {authError ? (
          <Text style={styles.errorText}>{authError}</Text>
        ) : null}

        <View style={styles.footer}>
          <CustomButton
            title={isLoading ? "" : "Submit"}
            onPress={handleSubmit}
            disabled={otp.some((digit) => !digit) || isLoading}
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
            {resendTimer > 0 && <Text style={styles.resendText}> in {resendTimer} second</Text>}
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
    gap: 10,
    width: "100%",
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontFamily: fonts.rubik,
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
