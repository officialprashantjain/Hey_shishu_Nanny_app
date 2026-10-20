import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import api from "../../../src/services/api";

const FALLBACK_SECTIONS = [
  {
    heading: "Introduction",
    description:
      "HeyShishu is committed to protecting the privacy and security of our nannies' personal information. This Privacy Policy outlines how we collect, use, disclose, and protect the information you provide when using our mobile application.",
  },
  {
    heading: "Information We Collect",
    description:
      "We collect personal information when you register for an account, complete your profile, or interact with our platform. This information may include your name, email address, phone number, location, and professional details.",
  },
  {
    heading: "Data Usage",
    description:
      "We use the information we collect to provide and improve our services, communicate with you, and personalize your experience on HeyShishu. We may also use your information for research and analytical purposes to enhance our platform.",
  },
  {
    heading: "Location & Identity Verification",
    description:
      "To provide reliable booking services and ensure family safety, we may process background verification information and location data while you are actively on shift.",
  },
  {
    heading: "Sharing Your Information",
    description:
      "Relevant profile and verification credentials may be shared with matching families for booking confirmation. We do not sell your personal data to third parties.",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("Privacy Policy");
  const [sections, setSections] = useState(FALLBACK_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolicy = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/privacy/nanny");
      const policyData = res?.data?.policy || res?.policy || res?.data?.data?.policy;

      if (policyData) {
        if (policyData.title) setTitle(policyData.title);
        if (Array.isArray(policyData.sections) && policyData.sections.length > 0) {
          const sorted = [...policyData.sections].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          setSections(sorted);
        }
      }
    } catch (err) {
      console.warn("[Privacy] Error fetching nanny privacy policy from API, using fallback:", err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch whenever user navigates / focuses this screen
  useFocusEffect(
    useCallback(() => {
      fetchPolicy();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(main)/profile")}
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

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary || "#346960"} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPolicy(true)}
              tintColor={colors.primary || "#346960"}
            />
          }
        >
          <View style={styles.innerContent}>
            <Text style={styles.mainTitle}>{title}</Text>

            {sections.map((section, index) => (
              <View key={section._id || index} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.heading}</Text>
                <Text style={styles.paragraph}>{section.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
