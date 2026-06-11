import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter, Stack } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { height, width } = Dimensions.get("window");

const screenOptions = {
  presentation: "transparentModal",
  headerShown: false,
  animation: "fade",
};

export default function RatingScreen() {
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");

  const handleSubmit = () => {
    router.replace("/(main)/messages/chat");
  };

  const handleCancel = () => {
    router.replace("/(main)/messages/chat");
  };

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <KeyboardAvoidingView
        style={styles.overlayBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetIndicator} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bottomSheetScroll}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Experience</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              How would you rate your overall experience with the parent?
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Image
                    source={require("../../../assets/icons/review-star.svg")}
                    style={styles.starIcon}
                    tintColor={rating >= star ? "#FF73A7" : "#E5E7EB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Review It</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Great experience!"
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={4}
              value={commentText}
              onChangeText={setCommentText}
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.notNowBtn} onPress={handleCancel}>
                <Text style={styles.notNowText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    width: "100%",
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 15,
    minHeight: height * 0.45,
  },
  bottomSheetIndicator: {
    width: 48,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  bottomSheetScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: "#346960",
  },
  modalSubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    opacity: 0.6,
    marginBottom: 20,
    lineHeight: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
    gap: 15,
  },
  starIcon: {
    width: 30,
    height: 30,
  },
  inputLabel: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: "700",
    color: colors.description,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    padding: 15,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    height: 100,
    marginBottom: 25,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  notNowBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.description,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginRight: 10,
  },
  notNowText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    fontWeight: "bold",
    opacity: 0.5,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginLeft: 10,
  },
  submitBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
});
