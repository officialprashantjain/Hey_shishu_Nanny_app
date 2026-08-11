import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import {
  selectProfile,
  selectProfileSaving,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
} from "../../../src/redux/slices/profileSlice";
import { updateMyProfile } from "../../../src/services/nannyService";
import { selectUser } from "../../../src/redux/slices/authSlice";

// ── Backend enum values ────────────────────────────────────────────────────────
const AGE_OPTIONS = [
  { label: "Infant (0-12 mos)", value: "infant" },
  { label: "Toddler (1-3 yrs)", value: "toddler" },
  { label: "School Age (5+)", value: "school_age" },
  { label: "Teenager", value: "teenager" },
];
const SKILL_OPTIONS = [
  { label: "First Aid", value: "first_aid" },
  { label: "Cooking", value: "cooking" },
  { label: "Teaching", value: "teaching" },
  { label: "Special Needs", value: "special_needs" },
  { label: "Newborn Care", value: "newborn_care" },
  { label: "Other", value: "other" },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);
  const user = useSelector(selectUser);     // { fullName, email, phoneNumber }
  const isSaving = useSelector(selectProfileSaving);

  // ── Editable fields (from NannyProfile) ──────────────────────────────────────
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isAvailableForWork, setIsAvailableForWork] = useState(false);

  // ── Populate form from Redux when profile loads ───────────────────────────────
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setExperience(String(profile.experience ?? ""));
      setSelectedAges(profile.ageGroupSpecialty || []);
      setSelectedSkills(profile.skills || []);
      setIsAvailableForWork(profile.isAvailableForWork || false);
    }
  }, [profile]);

  const toggleChip = (value, list, setList) => {
    setList(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  };

  const renderChipGroup = (options, selectedList, setList) => (
    <View style={styles.chipContainer}>
      {options.map((opt) => {
        const isSelected = selectedList.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggleChip(opt.value, selectedList, setList)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Save → PATCH /nanny/profile ───────────────────────────────────────────────
  const handleSave = async () => {
    dispatch(updateProfileStart());
    try {
      const payload = {
        bio,
        experience: Number(experience) || 0,
        hourlyRate: 0,
        monthlyRate: 0,
        ageGroupSpecialty: selectedAges,
        skills: selectedSkills,
        isAvailableForWork,
      };
      const response = await updateMyProfile(payload);
      dispatch(updateProfileSuccess(response.data?.profile ?? payload));
      Alert.alert("Saved ✅", "Your profile has been updated successfully.");
      router.replace("/(main)/profile");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Could not save changes. Please try again.";
      dispatch(updateProfileFailure(msg));
      Alert.alert("Error", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.white }}>
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
          <Text style={styles.headerTitle}>Edit Profile Details</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Basic Details (Read-only from auth) ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <Text style={styles.readOnlyNote}>ℹ️ These details cannot be edited</Text>

          <ReadOnlyField label="Full Name" value={user?.fullName || "—"} />
          <ReadOnlyField label="Email Address" value={user?.email || "—"} />
          <ReadOnlyField label="Phone Number" value={profile?.traineeApplicationId?.phoneNumber || "—"} />
        </View>

        {/* ── 2. About Me ─────────────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About Me</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Tell parents about yourself..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              keyboardType="numeric"
              placeholder="e.g. 4"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>



        {/* ── 4. Stats (Read-only) ─────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <StatBox label="Avg Rating" value={profile?.averageRating?.toFixed(1) ?? "0.0"} emoji="⭐" />
            <StatBox label="Total Reviews" value={String(profile?.totalReviews ?? 0)} emoji="💬" />
            <StatBox label="Verification" value={profile?.verificationStatus ?? "pending"} emoji="🔖" />
          </View>
        </View>

        {/* ── 5. Availability Toggle ───────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <TouchableOpacity
            style={[styles.availToggle, isAvailableForWork && styles.availToggleActive]}
            onPress={() => setIsAvailableForWork(!isAvailableForWork)}
          >
            <Text style={[styles.availToggleText, isAvailableForWork && styles.availToggleTextActive]}>
              {isAvailableForWork ? "✅  Available for Work" : "❌  Not Available"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 6. Age Group Specialty ───────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Age Group Specialty</Text>
          <View style={styles.inputGroup}>
            {renderChipGroup(AGE_OPTIONS, selectedAges, setSelectedAges)}
          </View>
        </View>

        {/* ── 7. Skills ────────────────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Caregiver Skills</Text>
          <View style={styles.inputGroup}>
            {renderChipGroup(SKILL_OPTIONS, selectedSkills, setSelectedSkills)}
          </View>
        </View>
      </ScrollView>

      {/* ── Footer Save Button ───────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────
function ReadOnlyField({ label, value }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readOnlyInput}>
        <Text style={styles.readOnlyText}>{value}</Text>
      </View>
    </View>
  );
}

function StatBox({ label, value, emoji }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 5, marginRight: 10, justifyContent: "center" },
  backIcon: { width: 14, height: 14, tintColor: colors.description },
  headerTitle: { fontFamily: fonts.rubikBold, fontSize: 20, color: colors.description, flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontFamily: fonts.chocoShake, fontSize: 22, color: colors.primary, marginBottom: 6 },
  readOnlyNote: { fontFamily: fonts.rubik, fontSize: 12, color: "#9CA3AF", marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  rowInputs: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontFamily: fonts.rubikBold, fontSize: 13, color: colors.description, marginBottom: 8 },
  input: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
  },
  textArea: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    minHeight: 120,
  },
  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  readOnlyText: { fontFamily: fonts.rubik, fontSize: 15, color: "#9CA3AF" },
  // Stats
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 8 },
  statBox: { alignItems: "center", flex: 1 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontFamily: fonts.rubikBold, fontSize: 18, color: colors.primary },
  statLabel: { fontFamily: fonts.rubik, fontSize: 12, color: colors.description, marginTop: 2 },
  // Availability
  availToggle: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  availToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "15",
  },
  availToggleText: { fontFamily: fonts.rubikBold, fontSize: 15, color: "#9CA3AF" },
  availToggleTextActive: { color: colors.primary },
  // Chips
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: colors.primary + "15", borderColor: colors.primary },
  chipText: { fontFamily: fonts.rubik, fontSize: 13, color: colors.description },
  chipTextSelected: { fontFamily: fonts.rubikBold, color: colors.primary },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: fonts.rubikBold, fontSize: 16, color: colors.white },
});
