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
    heading: "Service Agreement",
    description:
      "By using HeyShishu, you agree to abide by the following terms and conditions outlined herein.",
  },
  {
    heading: "Scope of Services",
    description:
      "HeyShishu provides a platform to connect nannies with families. This includes but is not limited to profile management, booking, and communication tools.",
  },
  {
    heading: "Service Limitations",
    description:
      "Nannies are required to create an account to access HeyShishu services. Accurate and complete information must be provided during registration. Nannies are responsible for maintaining the confidentiality of their account credentials.",
  },
  {
    heading: "Payments",
    description:
      "HeyShishu may charge service fees. Payment is due to the nanny as per the agreed terms with the family.",
  },
  {
    heading: "Cancellation Policy",
    description:
      "Nannies may cancel a booking as per the platform's cancellation policy.",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("Terms & Conditions");
  const [sections, setSections] = useState(FALLBACK_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTerms = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get("/terms/nanny");
      // Note: api.get unwraps response.data, so payload is in res.data.terms or res.terms
      const termsData = res?.data?.terms || res?.terms || res?.data?.data?.terms;

      if (termsData) {
        if (termsData.title) setTitle(termsData.title);
        if (Array.isArray(termsData.sections) && termsData.sections.length > 0) {
          const sorted = [...termsData.sections].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );
          setSections(sorted);
        }
      }
    } catch (err) {
      console.warn("[Terms] Error fetching nanny terms from API, using fallback:", err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch whenever user navigates / focuses this screen
  useFocusEffect(
    useCallback(() => {
      fetchTerms();
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
              onRefresh={() => fetchTerms(true)}
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
