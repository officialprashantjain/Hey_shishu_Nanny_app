import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioHeartbeat } from '../../services/audioHeartbeatService';
import { useCallSession } from '../../services/callSessionManager';
import { fonts } from '../../../constants/font';

export default function ActiveRecordingTopBanner() {
  const router = useRouter();
  const heartbeat = useAudioHeartbeat();
  const callSession = useCallSession();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the green mic ring and live REC indicator
  useEffect(() => {
    if (!heartbeat?.isRecording) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    blinkLoop.start();
    return () => {
      pulseLoop.stop();
      blinkLoop.stop();
    };
  }, [heartbeat?.isRecording]);

  // Only render when the physical microphone is actively recording
  if (!heartbeat?.isRecording) return null;

  const handlePress = () => {
    router.push('/(main)/(tabs)/service');
  };

  const formatTime = (secs = 0) =>
    `00:${String(secs).padStart(2, '0')}`;

  const elapsed = heartbeat.secondsElapsed || 0;
  const total = heartbeat.totalDurationSecs || heartbeat.durationSecs || 30;

  // If a phone call is already occupying the top position, stack the recording banner below it
  const isCallBannerShowing = Boolean(callSession?.callId);
  const baseTop = insets.top > 0 ? insets.top + (Platform.OS === 'android' ? 6 : 8) : 12;
  const topOffset = isCallBannerShowing ? baseTop + 68 : baseTop;

  return (
    <View style={[styles.container, { top: topOffset }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.bannerCard}
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityLabel="Active session audio safety recording in progress. Tap to open session."
        accessibilityRole="button"
      >
        {/* Pulsing Green Mic Indicator */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.iconCircle}>
            <Ionicons name="mic" size={16} color="#FFFFFF" />
          </View>
        </View>

        {/* Text Info */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            Session Safety Check-in
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.statusText}>
              Recording {formatTime(elapsed)} / {formatTime(total)}
              {'  •  Tap to view'}
            </Text>
          </View>
        </View>

        {/* Blinking Live REC Badge */}
        <Animated.View style={[styles.recBadge, { opacity: blinkAnim }]}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99998,
    elevation: 99998,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B', // Rich deep emerald
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: '#10B981', // Bright emerald green border
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  titleText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  statusText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 11,
    fontWeight: '500',
    color: '#A7F3D0',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  recText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

