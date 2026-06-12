import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, Modal, KeyboardAvoidingView, TextInput,
  Animated
} from 'react-native';
import { Audio } from 'expo-av';
import { CustomImage as Image } from '../../../../components/CustomImage';
import { CustomButton } from '../../../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { useRouter } from 'expo-router';

// ── Dummy Active Context ───────────────────────────────────────────────────
const ACTIVE_JOB = {
  id: 'JOB-A12X',
  childName: 'Aarav Mehta',
  childAge: '2.5 Years Old',
  childPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/40.jpg',
  parentName: 'Sneha Sharma',
  parentPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/12.jpg',
  address: 'B-405, Omaxe Heights, Sector 86, Faridabad',
  distance: '3.5 km',
  startTime: '10:00 AM',
  totalHours: '4 Hours',
  childNotes: 'Aarav might take a short nap in the afternoon. Peanut allergy.',
  date: 'Today, 12 May 2025',
  time: '10:00 AM – 2:00 PM',
};

export default function ServiceScreen() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(true); // Default to simulating ON state
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef([]);

  // ── Timer & Wave States ───────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [elapsed, setElapsed] = useState(0);     // Total elapsed
  
  // 15 separate animated values for the audio waves
  const waves = useRef(Array.from({ length: 15 }).map(() => new Animated.Value(4))).current;

  // ── Timers & Animations ──────────────────────────────────────────────────
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 120; // Loop back to 2 minutes
        return prev - 1;
      });
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    let waveInterval;
    if (isRecording) {
      waveInterval = setInterval(() => {
        waves.forEach((wave) => {
          Animated.timing(wave, {
            toValue: Math.random() * 20 + 8, // Random height 8-28
            duration: 200,
            useNativeDriver: false,
          }).start();
        });
      }, 200);
    } else {
      waves.forEach((wave) => {
        Animated.timing(wave, {
          toValue: 4, // Drop to baseline
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => clearInterval(waveInterval);
  }, [isRecording]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Permissions ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'This service strictly requires audio monitoring for safety. Please enable microphone access in settings.',
          [{ text: 'OK' }]
        );
        setMicPermissionGranted(false);
      } else {
        setMicPermissionGranted(true);
      }
    })();
  }, []);

  const toggleRecording = () => {
    if (!micPermissionGranted) {
      Alert.alert('Permission Denied', 'Microphone access is not granted.');
      return;
    }
    setIsRecording(!isRecording);
    // Real implementation would use Audio.Recording here.
  };

  // ── OTP Handlers ──────────────────────────────────────────────────────────
  const handleOtpChange = (text, index) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);
    if (numeric && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleCompleteService = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      Alert.alert('Incomplete OTP', 'Please enter the 4-digit completion code provided by the parent.');
      return;
    }
    setShowOtpModal(false);
    setOtp(['', '', '', '']);
    // On success, show custom success modal instead of system alert
    setShowSuccessModal(true);
  };

  // ── Helper to render sound waves visually ─────────────────────────────────
  const renderSoundWaves = () => {
    return waves.map((waveHeight, i) => (
      <Animated.View
        key={i}
        style={[
          styles.waveBar,
          {
            height: waveHeight,
            opacity: isRecording ? 1 : 0.4,
          }
        ]}
      />
    ));
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* ── TOP CARD: Child Info ────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileSection}>
              <Image source={ACTIVE_JOB.childPhoto} style={styles.avatar} contentFit="cover" />
              <View>
                <Text style={styles.name}>{ACTIVE_JOB.childName}</Text>
                <Text style={styles.age}>{ACTIVE_JOB.childAge}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({
              pathname: '/(main)/booking-details',
              params: {
                id: ACTIVE_JOB.id,
                parentName: ACTIVE_JOB.parentName,
                parentPhoto: ACTIVE_JOB.parentPhoto,
                address: ACTIVE_JOB.address,
                distance: ACTIVE_JOB.distance,
                childName: ACTIVE_JOB.childName,
                childAge: ACTIVE_JOB.childAge,
                childPhoto: ACTIVE_JOB.childPhoto,
                childNotes: ACTIVE_JOB.childNotes,
                date: ACTIVE_JOB.date,
                time: ACTIVE_JOB.time,
              }
            })}>
              <Text style={styles.detailsText}>Details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <View style={styles.onlineDot} />
              <Text style={styles.pillText}>Start: {ACTIVE_JOB.startTime}</Text>
            </View>
            <View style={styles.pillSecondary}>
              <Text style={styles.pillTextSecondary}>Total: {ACTIVE_JOB.totalHours}</Text>
            </View>
          </View>
        </View>

        {/* ── CENTRAL TIMER RING ──────────────────────────────────────────── */}
        <View style={styles.timerRingContainer}>
          <View style={styles.outerRing}>
            <View style={styles.innerCircle}>
              <Text style={styles.timeLabel}>Time Remaining</Text>
              <Text style={styles.bigTime}>{formatTime(timeLeft)}</Text>
              <Text style={styles.elapsedText}>Elapsed: {formatElapsedTime(elapsed)}</Text>
            </View>
          </View>
        </View>

        {/* ── VOICE RECORDING WIDGET ──────────────────────────────────────── */}
        <View style={styles.recordingArea}>
          <Text style={styles.recordingStatusLabel}>
            Voice Recording is <Text style={{ color: isRecording ? '#4CAF50' : colors.description }}>
              {isRecording ? 'ON' : 'OFF'}
            </Text>
          </Text>

          <View style={styles.audioControlBox}>
            <View style={[styles.micIconBox, !isRecording && styles.micIconBoxOff]}>
              <Ionicons name={isRecording ? "mic" : "mic-off"} size={28} color={isRecording ? colors.error : colors.white} />
            </View>
            
            <View style={styles.wavesContainer}>
              {renderSoundWaves()}
            </View>

            {/* <TouchableOpacity 
              style={[styles.stopBtn, !isRecording && { backgroundColor: colors.primary }]} 
              onPress={toggleRecording}
            >
              <Text style={styles.stopBtnText}>{isRecording ? 'Stop' : 'Start'}</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* ── SOS EMERGENCY BUTTON ─────────────────────────────────────────── */}
        <TouchableOpacity style={styles.sosButton} onPress={() => setShowSosModal(true)}>
          <Ionicons name="shield-checkmark" size={24} color={colors.white} />
          <Text style={styles.sosButtonText}>SOS Emergency</Text>
        </TouchableOpacity>

        {/* ── NOTE FROM PARENT ───────────────────────────────────────────── */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Note from Parent</Text>
          <Text style={styles.noteText}>{ACTIVE_JOB.parentNote}</Text>
        </View>

        {/* ── SERVICE COMPLETED TRIGGER ──────────────────────────────────── */}
        <CustomButton
          title="Service Completed"
          onPress={() => setShowOtpModal(true)}
          style={{
            marginTop: 20,
            marginBottom: 40,
            borderRadius: 30,
            backgroundColor: colors.primary // using primary color distinct from purple
          }}
        />

      </ScrollView>

      {/* ── OTP SERVICE COMPLETION MODAL ───────────────────────────────── */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowOtpModal(false); setOtp(['', '', '', '']); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />

            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconBox, { backgroundColor: '#FBE4A1' }]}>
                <Ionicons name="checkmark-done" size={28} color={colors.primary} />
              </View>
            </View>

            <Text style={styles.modalTitle}>Complete the Session</Text>
            <Text style={styles.modalSub}>
              Ask the parent for the final 4-digit completion code to securely close this session.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(r) => (otpRefs.current[idx] = r)}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(t) => handleOtpChange(t, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                />
              ))}
            </View>

            <CustomButton
              title="Verify & End Service"
              onPress={handleCompleteService}
              disabled={otp.some((digit) => !digit)}
              style={{
                borderRadius: 30,
                marginBottom: 14,
                backgroundColor: colors.primary
              }}
            />

            <TouchableOpacity style={styles.cancelLink} onPress={() => { setShowOtpModal(false); setOtp(['', '', '', '']); }}>
              <Text style={styles.cancelText}>Resume Service</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── SUCCESS MODAL ──────────────────────────────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalSheetCenter}>
            <View style={[styles.modalIconBoxCenter, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitleCenter}>Service Completed!</Text>
            <Text style={styles.modalSubCenter}>
              You have successfully completed this session. Returning to the Job Board.
            </Text>

            <CustomButton
              title="Back to Job Board"
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(main)/(tabs)/requests');
              }}
              style={{ borderRadius: 30, width: '100%', backgroundColor: colors.primary }}
            />
          </View>
        </View>
      </Modal>

      {/* ── SOS EMERGENCY MODAL ──────────────────────────────────────────────── */}
      <Modal
        visible={showSosModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSosModal(false)}
      >
        <View style={styles.sosModalOverlay}>
          <View style={styles.sosModalSheet}>
            <View style={styles.sosDragIndicator} />
            <Text style={styles.sosModalTitle}>Emergency SOS</Text>
            <Text style={styles.sosModalSub}>
              Select who you need to contact urgently. Local authorities will be dispatched if you call emergency services.
            </Text>

            <TouchableOpacity 
              style={[styles.sosActionBtn, { backgroundColor: '#E53935' }]} 
              onPress={() => { setShowSosModal(false); /* Linking.openURL('tel:112') */ }}
            >
              <Ionicons name="warning-outline" size={24} color={colors.white} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.sosActionTitleLight}>Call Emergency</Text>
                <Text style={styles.sosActionSubLight}>Police / Ambulance (112)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sosActionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#EAEAEA' }]} 
              onPress={() => { setShowSosModal(false); router.push('/(main)/messages/incoming_call'); }}
            >
              <Ionicons name="call-outline" size={24} color={colors.primary} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.sosActionTitleDark}>Call Parent</Text>
                <Text style={styles.sosActionSubDark}>{ACTIVE_JOB.parentName}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sosActionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#EAEAEA', marginBottom: 24 }]} 
              onPress={() => { setShowSosModal(false); router.push('/(main)/messages/incoming_call'); }}
            >
              <Ionicons name="headset-outline" size={24} color={colors.primary} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.sosActionTitleDark}>HeyShishu Support</Text>
                <Text style={styles.sosActionSubDark}>24/7 Safety Team</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sosCancelLink} onPress={() => setShowSosModal(false)}>
              <Text style={styles.sosCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100, // Safe space for tab bar
  },
  
  // Child Details Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 32,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 12,
  },
  name: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.primary,
  },
  age: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
    marginTop: 2,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginRight: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  pillText: {
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    color: colors.primary,
  },
  pillSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  pillTextSecondary: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
  },

  // Central Timer Ring
  timerRingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  outerRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 14,
    borderColor: colors.secondary, // Theme purple indicating active progression
    borderRightColor: '#EAEAEA', // creates a stylized arc look without heavy animation libs
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    alignItems: 'center',
  },
  timeLabel: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 8,
  },
  bigTime: {
    fontFamily: fonts.rubikBold,
    fontSize: 48,
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 2,
  },
  elapsedText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    opacity: 0.8,
  },

  // Voice Recording Area
  recordingArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingStatusLabel: {
    fontFamily: fonts.rubikBold,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 16,
  },
  audioControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  micIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8, elevation: 4,
  },
  micIconBoxOff: {
    backgroundColor: colors.description,
    shadowOpacity: 0,
  },
  wavesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    paddingHorizontal: 16,
    height: 30,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.error,
    borderRadius: 2,
  },
  stopBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  stopBtnText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
  },

  // SOS Emergency Button
  sosButton: {
    flexDirection: 'row',
    backgroundColor: '#E53935', // Distinct red for SOS standard across all themes
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sosButtonText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
    fontSize: 18,
  },

  // Note from Parent
  noteCard: {
    backgroundColor: '#FAFAF9',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  noteTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    lineHeight: 20,
  },

  // ── OTP MODAL STYLES ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  dragIndicator: {
    width: 40, height: 4,
    backgroundColor: '#DDDDE0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 16 },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 22, color: colors.primary,
    textAlign: 'center', marginBottom: 8,
  },
  modalSub: {
    fontFamily: fonts.rubik,
    fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: fonts.rubik,
    color: colors.primary,
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  cancelLink: { alignItems: 'center', padding: 8 },
  cancelText: { fontFamily: fonts.rubik, fontSize: 15, color: colors.description },

  // Center Modal styles for Success Modal
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheetCenter: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBoxCenter: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleCenter: {
    fontFamily: fonts.rubikBold,
    fontSize: 20, color: colors.primary,
    textAlign: 'center', marginBottom: 12,
  },
  modalSubCenter: {
    fontFamily: fonts.rubik,
    fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24,
  },

  // SOS Modal Styles
  sosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sosModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  sosDragIndicator: {
    width: 40, height: 4,
    backgroundColor: '#DDDDE0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sosModalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 22, color: '#E53935',
    textAlign: 'center', marginBottom: 8,
  },
  sosModalSub: {
    fontFamily: fonts.rubik,
    fontSize: 14, color: colors.description,
    textAlign: 'center', lineHeight: 20,
    marginBottom: 24,
  },
  sosActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  sosActionTitleLight: {
    fontFamily: fonts.rubikBold,
    fontSize: 16, color: colors.white,
  },
  sosActionSubLight: {
    fontFamily: fonts.rubik,
    fontSize: 13, color: colors.white, opacity: 0.9,
  },
  sosActionTitleDark: {
    fontFamily: fonts.rubikBold,
    fontSize: 16, color: colors.primary,
  },
  sosActionSubDark: {
    fontFamily: fonts.rubik,
    fontSize: 13, color: colors.description,
  },
  sosCancelLink: {
    alignItems: 'center', padding: 8, marginTop: 8
  },
  sosCancelText: {
    fontFamily: fonts.rubikBold, fontSize: 16, color: colors.description,
  },
});
