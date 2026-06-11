import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function LoginSecurityScreen() {
  const router = useRouter();

  const options = [
    {
      id: "1",
      title: "Change Password",
      route: "/(main)/login-security/change-password",
    },
    {
      id: "2",
      title: "2-Step Verification",
      route: "/(main)/login-security/two-step",
    },
  ];

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
        <Text style={styles.headerTitle}>Login & Security</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.mainTitle}>Login & Security</Text>
        <View style={styles.menuContainer}>
          {options.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.menuItem,
              index === options.length - 1 && styles.noBorder,
            ]}
            onPress={() => router.push(option.route)}
          >
            <View style={styles.menuLeft}>
              <View style={styles.iconBox}>
                <Image
                  source={
                    option.id === "1"
                      ? require("../../../assets/icons/lock.svg")
                      : require("../../../assets/icons/verification.svg")
                  }
                  style={styles.menuIcon}
                  tintColor="#666666"
                />
              </View>
              <Text style={styles.menuText}>{option.title}</Text>
            </View>
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={[
                styles.chevronIcon,
                { transform: [{ rotate: "180deg" }] }
              ]}
              tintColor="#334155"
            />
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
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
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "white",
    shadowColor: "#344054",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 20,
    gap: 16,
    borderRadius: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  noBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    width: 20,
    height: 20,
  },
  menuText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#666666",
  },
  chevronIcon: {
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
