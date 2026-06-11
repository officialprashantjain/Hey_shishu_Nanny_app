import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function CongratsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../../assets/icons/congrats.svg")}
          style={styles.illustration}
          contentFit="contain"
        />

        <Text style={styles.title}>2-Step Verification Added!</Text>
        <Text style={styles.subtitle}>
          Your account is now more secure. You'll be asked for a code when
          logging in.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => router.push("/(main)/profile")}
        >
          <Text style={styles.saveBtnText}>Go to Profile</Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
    paddingHorizontal: 20,
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
