import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContent}>
          <Text style={styles.mainTitle}>Terms & Conditions</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Agreement</Text>
            <Text style={styles.paragraph}>
              By using HeyShishu, you agree to abide by the following terms and
              conditions outlined herein.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope of Services</Text>
            <Text style={styles.paragraph}>
              HeyShishu provides a platform to connect nannies with families.
              This includes but is not limited to profile management, booking,
              and communication tools.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Limitations</Text>
            <Text style={styles.paragraph}>
              Nannies are required to create an account to access HeyShishu
              services. Accurate and complete information must be provided
              during registration. Nannies are responsible for maintaining the
              confidentiality of their account credentials.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payments</Text>
            <Text style={styles.paragraph}>
              HeyShishu may charge service fees. Payment is due to the nanny as
              per the agreed terms with the family.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <Text style={styles.paragraph}>
              Nannies may cancel a booking as per the platform's cancellation
              policy.
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
