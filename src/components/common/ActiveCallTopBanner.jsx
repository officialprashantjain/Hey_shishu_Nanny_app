import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { callSessionManager, useCallSession } from '../../services/callSessionManager';
import { fonts } from '../../../constants/font';

export default function ActiveCallTopBanner() {
  const router = useRouter();
  const segments = useSegments();
  const session = useCallSession();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!session?.callId) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [Boolean(session?.callId)]);

  if (!session?.callId) return null;

  // Don't display top banner while the user is actively viewing the active call screen
  const isOnCallScreen = segments.some((segment) => segment === 'active_call');
  if (isOnCallScreen) return null;

  const handleReturnToCall = () => {
    callSessionManager.maximizeCall(router);
  };

  const handleEndCall = () => {
    callSessionManager.endCall('caller_hangup');
  };

  const formatTime = (seconds = 0) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const topOffset = insets.top > 0 ? insets.top + (Platform.OS === 'android' ? 6 : 8) : 12;

  return (
    <View style={[styles.container, { top: topOffset }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.bannerCard}
        onPress={handleReturnToCall}
        activeOpacity={0.88}
        accessibilityLabel="Active call in progress. Tap to return to call."
        accessibilityRole="button"
      >
        {/* Pulsing Green Call Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.iconCircle}>
            <Ionicons
              name={session.callType === 'video' ? 'videocam' : 'call'}
              size={16}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Remote Name & Live Call Duration */}
        <View style={styles.textContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {session.remoteName || 'Call in Progress'}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, session.callConnected ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.statusText}>
              {session.callConnected ? formatTime(session.callDuration) : session.callStatusMessage}
              {'  •  Tap to return'}
            </Text>
          </View>
        </View>

        {/* Quick Hangup Button */}
        <TouchableOpacity
          style={styles.hangupButton}
          onPress={handleEndCall}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="End call"
          accessibilityRole="button"
        >
          <Ionicons
            name="call"
            size={18}
            color="#FFFFFF"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 99999,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
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
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  nameText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#22C55E',
  },
  dotOrange: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 12,
    fontWeight: '500',
    color: '#86EFAC',
  },
  hangupButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
