import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("Jessica Miller");
  const [email, setEmail] = useState("jessica@example.com");
  const [phone, setPhone] = useState("9876543210");
  const [location, setLocation] = useState("Mumbai, India");
  const [experience, setExperience] = useState("5 years");

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
        <Text style={styles.headerTitle}>Personal Information</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWithIcon}>
            <Image
              source={require("../../../assets/icons/mail.svg")}
              style={styles.inputIcon}
              tintColor="#9CA3AF"
            />
            <TextInput
              style={styles.inputIconInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeBox}>
              <Image
                source={require("../../../assets/icons/india.svg")}
                style={styles.countryFlag}
              />
              <Text style={styles.countryCodeText}>+91</Text>
              <Image
                source={require("../../../assets/icons/left-arrow.svg")}
                style={[
                  styles.dropdownIconSmall,
                  { transform: [{ rotate: "-90deg" }] },
                ]}
              />
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.title}>Professional Details</Text>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your location"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Enter your experience"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => router.push("/(main)/profile")}
        >
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
    padding: 20,
    paddingBottom: 120,
  },
  inputGroup: {
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 25,
    color: colors.primary,
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  inputWithIcon: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  inputIconInput: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  countryFlag: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  countryCodeText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    marginRight: 8,
  },
  dropdownIconSmall: {
    width: 12,
    height: 12,
    tintColor: colors.description,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
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
