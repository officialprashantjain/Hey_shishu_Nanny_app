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

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(main)/profile')}
          style={styles.backButton}
        >
          <Image
            source={require("../../../assets/icons/left-arrow.svg")}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContent}>
          <Text style={styles.mainTitle}>Privacy Policy</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={styles.paragraph}>
              HeyShishu is committed to protecting the privacy and security of
              our nannies' personal information. This Privacy Policy outlines how
              we collect, use, disclose, and protect the information you provide
              when using our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect personal information when you register for an account,
              complete your profile, or interact with our platform. This
              information may include your name, email address, phone number,
              location, and professional details.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Usage</Text>
            <Text style={styles.paragraph}>
              We use the information we collect to provide and improve our
              services, communicate with you, and personalize your experience on
              HeyShishu. We may also use your information for research and
              analytical purposes to enhance our platform.
            </Text>
          </View>
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
  innerContent: {
    width: "100%",
    gap: 24,
  },
  mainTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
    lineHeight: 26,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.description,
    lineHeight: 20,
    fontWeight: "bold",
  },
  paragraph: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
    lineHeight: 20,
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
