import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

export default function ProfileScreen() {
  const router = useRouter();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [profilePicUri, setProfilePicUri] = useState(null);

  const menuOptions = [
    {
      label: "Support",
      icon: require("../../../assets/icons/support.svg"),
      route: "/(main)/support",
    },
    {
      label: "Personal Information",
      icon: require("../../../assets/icons/personal-information.svg"),
      route: "/(main)/personal-info",
    },
    {
      label: "Earnings History",
      icon: require("../../../assets/icons/booking-history.svg"),
      route: "/(main)/earnings",
    },
    {
      label: "Terms & Conditions",
      icon: require("../../../assets/icons/terms-condition.svg"),
      route: "/(main)/terms",
    },
    {
      label: "Privacy Policy",
      icon: require("../../../assets/icons/lock.svg"),
      route: "/(main)/privacy",
    },
    {
      label: "Login & Security",
      icon: require("../../../assets/icons/lock.svg"),
      route: "/(main)/login-security",
    },
    {
      label: "Delete Account",
      icon: require("../../../assets/icons/delete-account.svg"),
      route: "/(main)/delete-account",
      isDanger: true,
    },
    {
      label: "Logout",
      icon: require("../../../assets/icons/logout.svg"),
      route: "/(auth)/login",
    },
  ];

  const handlePickImage = async () => {
    setIsPhotoModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    setIsPhotoModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicUri(result.assets[0].uri);
    }
  };


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#19A3F0", "#06B6D4"]}
        locations={[0, 0.72]}
        style={styles.header}
      />

      <SafeAreaView edges={["top"]} style={styles.headerContentWrapper}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/icons/backbutton-white.svg")}
              style={styles.backIcon}
              contentFit="contain"
              tintColor={colors.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.userCard}>
          <View style={styles.avatarRow}>
            <Image
              source={profilePicUri ? { uri: profilePicUri } : require("../../../assets/icons/nanny-image.svg")}
              style={styles.profilePic}
            />

            <TouchableOpacity style={styles.changePhotoButton} onPress={() => setIsPhotoModalVisible(true)}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>Jessica Miller</Text>
            <Text style={styles.userPhone}>+91 9876543210</Text>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Image
                  key={i}
                  source={require("../../../assets/icons/review-star.svg")}
                  style={[styles.starIcon, i > 4 && { opacity: 0.3 }]}
                />
              ))}
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => {
                if (option.label === "Logout") {
                  setIsLogoutModalVisible(true);
                } else {
                  router.push(option.route);
                }
              }}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    option.isDanger && { backgroundColor: "#FFEBEB" },
                  ]}
                >
                  <Image
                    source={option.icon}
                    style={styles.optionIcon}
                    contentFit="contain"
                  />
                </View>

                <Text
                  style={[
                    styles.optionLabel,
                    option.isDanger && { color: colors.error },
                  ]}
                >
                  {option.label}
                </Text>
              </View>

              <Image
                source={require("../../../assets/icons/right-arrow.svg")}
                style={styles.arrowIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require("../../../assets/icons/logout.svg")}
              style={styles.modalIcon}
              contentFit="contain"
            />
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to log out from this account?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  router.push("/(onboarding)/splash-screen");
                }}
              >
                <Text style={styles.logoutBtnText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PHOTO OPTIONS MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={isPhotoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalContent}>
            <Text style={styles.photoModalTitle}>Profile Photo</Text>
            
            <TouchableOpacity style={styles.photoOptionBtn} onPress={handleTakePhoto}>
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickImage}>
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCancelBtn} onPress={() => setIsPhotoModalVisible(false)}>
              <Text style={styles.photoCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  headerContentWrapper: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.white,
    flex: 1,
    textAlign: "center",
    marginRight: 40,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changePhotoText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.primary,
  },
  userInfo: {
    marginTop: 15,
    alignItems: "center",
  },
  userName: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
  },
  userPhone: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 2,
  },
  ratingText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  optionsContainer: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionIcon: {
    width: 20,
    height: 20,
  },
  optionLabel: {
    fontFamily: fonts.rubikMedium,
    fontSize: 16,
    color: colors.description,
  },
  arrowIcon: {
    width: 14,
    height: 14,
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 30,
    width: "85%",
    alignItems: "center",
  },
  modalIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: fonts.rubikBold,
    color: colors.primary,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.rubik,
    color: colors.description,
    textAlign: "center",
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.description,
    fontFamily: fonts.rubikBold,
  },
  logoutBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  logoutBtnText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
  },
  photoModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    width: "85%",
    overflow: "hidden",
  },
  photoModalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.description,
    textAlign: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  photoOptionBtn: {
    paddingVertical: 20,
    alignItems: "center",
  },
  photoOptionText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  photoCancelBtn: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 18,
    alignItems: "center",
  },
  photoCancelBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
  },
});
