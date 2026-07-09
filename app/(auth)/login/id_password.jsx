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
import { Ionicons } from "@expo/vector-icons";
import { loginNanny } from "../../../src/services/authServices";
import { selectAuthLoading, selectAuthError } from "../../../src/redux/slices/authSlice";

export default function LoginIdPasswordScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!id.trim() || !password.trim()) return;
    const result = await dispatch(loginNanny(id.trim(), password.trim()));
    if (result.success) {
      if (!result.isProfileComplete) {
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

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.title}>Login with ID & Password</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to log in.
          </Text>
          
          <Text style={styles.sublabel}>User ID</Text>
          <CustomInput
            placeholder="Enter your user ID"
            value={id}
            onChangeText={setId}
            inputStyle={{ borderColor: colors.description }}
          />

          <Text style={[styles.sublabel, { marginTop: 20 }]}>Password</Text>
          <CustomInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            inputStyle={{ borderColor: colors.description }}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.description}
                />
              </TouchableOpacity>
            }
          />
        </View>

        {authError ? (
          <Text style={styles.errorText}>{authError}</Text>
        ) : null}

        <View style={styles.footer}>
          <CustomButton
            title={isLoading ? "" : "Login"}
            onPress={handleLogin}
            disabled={!id || !password || isLoading}
            style={{ borderRadius: 30 }}
            icon={isLoading ? <ActivityIndicator color={colors.white} /> : null}
          />

          <TouchableOpacity
            style={styles.otpLoginButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.otpLoginText}>Login with Mobile Number & OTP</Text>
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
  sublabel: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
    marginBottom: 8,
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
  otpLoginButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 30,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  otpLoginText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
  },
});
