import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
// import { SignUpHeader } from "../../../components/SignUpHeader";
import { CustomButton } from "../../../src/components/common/CustomButton";

export default function LoginOTPScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
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

        <View style={styles.footer}>
          <CustomButton
            title="Submit"
            onPress={() => {
              if (type === "reset") {
                router.push("/(auth)/login/new_password");
              } else {
                router.replace("/(main)/(tabs)/requests");
              }
            }}
            disabled={otp.some((digit) => !digit)}
            style={{
              borderRadius: 30,
            }}
          />
          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <Text style={styles.resendLink}>Resend</Text>
            <Text style={styles.resendText}> in 39 second</Text>
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
  footer: {
    marginBottom: 60,
  },
});
