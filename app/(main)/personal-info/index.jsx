import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const AVAILABLE_AGES = ["Baby (0-12 mos)", "Toddler (1-3 yrs)", "Preschooler (3-5 yrs)", "School age (5+ yrs)"];
const AVAILABLE_SKILLS = ["Conflict resolution", "Homework Assistance", "First aid and CPR Training", "Potty Training", "Special Needs"];

export default function PersonalInfoScreen() {
  const router = useRouter();
  
  // Basic Info
  const [fullName, setFullName] = useState("Jessica Miller");
  const [email, setEmail] = useState("jessica@example.com");
  const [phone, setPhone] = useState("9876543210");
  const [dob, setDob] = useState("12 Sep 1992");
  const [gender, setGender] = useState("Female");
  
  // Bio
  const [aboutMe, setAboutMe] = useState("I've been caring for babies for over 4 years and have plenty of experience with little ones. Since I work from home, I'm available throughout the day, making it easy for me to support your family's needs. If you have any questions, feel free to reach out! 😊");

  // Service Details
  const [serviceType, setServiceType] = useState("Babysitting At your home");
  const [hourlyRate, setHourlyRate] = useState("30");
  const [selectedAges, setSelectedAges] = useState(["Baby (0-12 mos)", "Toddler (1-3 yrs)"]);
  
  // Professional Details
  const [location, setLocation] = useState("Mumbai, India");
  const [experience, setExperience] = useState("4+ years");
  const [degree, setDegree] = useState("Teacher degree");
  const [selectedSkills, setSelectedSkills] = useState(["Conflict resolution", "Homework Assistance", "First aid and CPR Training"]);

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const renderChipGroup = (options, selectedList, setList) => (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = selectedList.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggleSelection(option, selectedList, setList)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <Text style={styles.headerTitle}>Edit Profile details</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- 1. Basic Details --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="DD MMM YYYY" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Gender</Text>
              <TextInput style={styles.input} value={gender} onChangeText={setGender} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWithIcon}>
              <Image source={require("../../../assets/icons/mail.svg")} style={styles.inputIcon} tintColor="#9CA3AF" />
              <TextInput
                style={styles.inputIconInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBox}>
                <Image source={require("../../../assets/icons/india.svg")} style={styles.countryFlag} />
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* --- 2. About Me --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={styles.textArea}
              value={aboutMe}
              onChangeText={setAboutMe}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* --- 3. Service Details --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Provided</Text>
            <TextInput style={styles.input} value={serviceType} onChangeText={setServiceType} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>General Rate (₹/hour)</Text>
            <TextInput 
              style={styles.input} 
              value={hourlyRate} 
              onChangeText={setHourlyRate} 
              keyboardType="numeric" 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ages of Babies (Select multiple)</Text>
            {renderChipGroup(AVAILABLE_AGES, selectedAges, setSelectedAges)}
          </View>
        </View>

        {/* --- 4. Professional & Skills --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Professional & Skills</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Experience</Text>
              <TextInput style={styles.input} value={experience} onChangeText={setExperience} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Degree</Text>
              <TextInput style={styles.input} value={degree} onChangeText={setDegree} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caregiver Skills (Select multiple)</Text>
            {renderChipGroup(AVAILABLE_SKILLS, selectedSkills, setSelectedSkills)}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => router.replace("/(main)/profile")}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // space for fixed footer
  },
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
  sectionTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    color: colors.description,
    marginBottom: 8,
  },
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
  inputWithIcon: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  inputIconInput: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    height: '100%',
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  countryCodeBox: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    height: '100%',
  },
  countryFlag: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  countryCodeText: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    height: '100%',
  },
  
  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
  },
  chipTextSelected: {
    fontFamily: fonts.rubikBold,
    color: colors.primary,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.white,
  },
});
