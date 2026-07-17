import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { CustomButton } from "../../../src/components/common/CustomButton";
import { CustomInput } from "../../../src/components/common/CustomInput";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { sendOtp } from "../../../src/services/authServices";
import { selectAuthLoading } from "../../../src/redux/slices/authSlice";

export default function LoginOTPScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= 10) {
      setPhone(numericValue);
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;

    const result = await dispatch(sendOtp(phone));
    if (result.success) {
      router.push({
        pathname: "/(auth)/login/otp",
        params: { phoneNumber: phone }
      });
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
          <Text style={styles.title}>Login with OTP</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive verification code.
          </Text>
          <Text style={styles.sublabel}>Mobile number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Image
                source={require("../../../assets/icons/india.svg")}
                style={styles.flagIcon}
                contentFit="contain"
              />
              <Text style={styles.countryText}>+91</Text>
            </View>
            <View style={styles.inputWrapper}>
              <CustomInput
                placeholder="123 456 7890"
                keyboardType="numeric"
                value={phone}
                onChangeText={handlePhoneChange}
                inputStyle={{ borderColor: colors.description }}
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            title={isLoading ? "" : "Send OTP"}
            onPress={handleSendOtp}
            disabled={phone.length !== 10 || isLoading}
            style={{
              borderRadius: 30,
            }}
            icon={isLoading ? <ActivityIndicator color={colors.white} /> : null}
          />

          <TouchableOpacity
            style={styles.emailLoginButton}
            onPress={() => router.push("/(auth)/login/id_password")}
          >
            <Text style={styles.emailLoginText}>Login with Id Password</Text>
          </TouchableOpacity>

          {/* <View style={styles.signUpLink}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View> */}
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
  sublabel: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  countryCode: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    gap: 8,
  },
  flagIcon: {
    width: 24,
    height: 18,
  },
  countryText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: "500",
  },
  inputWrapper: {
    flex: 1,
  },
  footer: {
    marginBottom: 60,
  },
  emailLoginButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 30,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  emailLoginText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
  },
  signUpLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  linkText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "bold",
  },
});
