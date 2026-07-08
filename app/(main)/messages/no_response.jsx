import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { width, height } = Dimensions.get("window");

export default function NoResponseScreen() {
  const router = useRouter();

  const handleOpenTicket = () => {
    router.push("/(main)/messages/chat");
  };

  const handleRequestAgain = () => {
    router.push("/(main)/messages/request-session");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.statusBarArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(main)/messages/chat")}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Response</Text>
        </View>
      </SafeAreaView>

      <View style={styles.centerIllustrationContainer}>
        <Image
          source={require("../../../assets/icons/404-error.svg")}
          style={styles.illustration}
          contentFit="contain"
        />
      </View>

      <View style={styles.copywritingContainer}>
        <Text style={styles.errorTitle}>Oopps! No Response</Text>
        <Text style={styles.errorSubtitle}>
          Parent didn't respond please try requesting again or open a support ticket
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.ticketBtn} onPress={handleOpenTicket}>
            <Text style={styles.ticketBtnText}>Open a Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestBtn}
            onPress={handleRequestAgain}
          >
            <Text style={styles.requestBtnText}>Request Again</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.homeIndicatorSpace} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
    justifyContent: "space-between",
  },
  statusBarArea: {
    backgroundColor: "#FFF6E6",
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
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.description,
    flex: 1,
    fontWeight: "bold",
  },
  centerIllustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  illustration: {
    width: "100%",
    height: 220,
  },
  copywritingContainer: {
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 8,
    marginBottom: 100,
  },
  errorTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: "#346960",
    textAlign: "center",
  },
  errorSubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.9,
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFF6E6",
    marginBottom: 40,
    borderTopWidth: 0,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  ticketBtn: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.description,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
    opacity: 0.5,
  },
  requestBtn: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: colors.secondary,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  requestBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  homeIndicatorSpace: {
    height: 10,
  },
});
