import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Platform, Animated, BackHandler } from 'react-native';
import { CustomImage as Image } from '../../../src/components/common/CustomImage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { fonts } from '../../../constants/font';
import { Ionicons } from '@expo/vector-icons';
import callSessionManager, { useCallSession } from '../../../src/services/callSessionManager';

const { width, height } = Dimensions.get('window');
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const { RtcSurfaceView, VideoSourceType } = isExpoGo
  ? require('../../../src/utils/agora-mock') : require('react-native-agora');

export default function ActiveCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { callId, uuid, channelName, token, agoraAppId } = params;
  const callType = params.callType === 'audio' ? 'audio' : 'video';
  const mode = params.mode || 'outgoing';
  const remoteName = params.remoteName || 'Parent';
  const remotePhoto = params.remotePhoto || null;
  const numericUid = Number(params.uid);

  const session = useCallSession();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hadActiveCall = useRef(false);

  const isJoined = session?.isJoined ?? false;
  const remoteUid = session?.remoteUid ?? null;
  const callConnected = session?.callConnected ?? false;
  const callDuration = session?.callDuration ?? 0;
  const isMuted = session?.isMuted ?? false;
  const isCameraOff = session?.isCameraOff ?? false;
  const isSpeakerOn = session?.isSpeakerOn ?? (callType === 'video');
  const callStatusMessage = session?.callStatusMessage ?? (mode === 'outgoing' ? 'Ringing…' : 'Connecting…');

  const handleMinimize = () => {
    callSessionManager.minimizeCall();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)');
    }
  };

  const handleHangup = async () => {
    const duration = session?.callDuration || 0;
    const targetName = session?.remoteName || remoteName;
    await callSessionManager.endCall(mode === 'outgoing' ? 'caller_hangup' : 'receiver_hangup');
    router.replace({ pathname: '/(main)/messages/rating', params: { duration, remoteName: targetName } });
  };

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    if (callId) {
      callSessionManager.startOrAttachCall({
        callId,
        uuid,
        channelName,
        token,
        agoraAppId,
        uid: numericUid,
        callType,
        mode,
        remoteName,
        remotePhoto,
        startedAt: params.startedAt,
      });
    }

    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      handleMinimize();
      return true;
    });

    return () => {
      back.remove();
      callSessionManager.detachScreen();
    };
  }, [callId]);

  useEffect(() => {
    if (session?.callId) {
      hadActiveCall.current = true;
    } else if (hadActiveCall.current) {
      const last = callSessionManager.getLastSummary();
      router.replace({
        pathname: '/(main)/messages/rating',
        params: {
          duration: last?.duration || 0,
          remoteName: last?.remoteName || remoteName,
        },
      });
    }
  }, [session?.callId]);

  const toggleMute = () => callSessionManager.toggleMute();
  const toggleCamera = () => callSessionManager.toggleCamera();
  const toggleSpeaker = () => callSessionManager.toggleSpeaker();
  const flipCamera = () => callSessionManager.flipCamera();
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── VIDEO CALL VIEW ── */}
      {callType === "video" ? (
        <View style={styles.videoCanvasContainer}>
          {remoteUid ? (
            <RtcSurfaceView
              style={styles.remoteVideoFeed}
              canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
            />
          ) : (
            <View style={styles.waitingCover}>
              <Animated.View style={[styles.avatarPulseRing, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.avatarCircle}>
                <Image
                  source={remotePhoto ? { uri: remotePhoto } : require("../../../assets/icons/nanny-image.svg")}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              </View>
              <Text style={styles.remoteNameText}>{session?.remoteName || remoteName}</Text>
              <Text style={styles.statusSubText}>{callStatusMessage}</Text>
            </View>
          )}

          {/* Local User PiP Overlay */}
          {isJoined && (
            <View style={styles.localPipOverlay}>
              {!isCameraOff ? (
                <RtcSurfaceView
                  style={styles.localVideoFeed}
                  canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
                />
              ) : (
                <View style={styles.cameraOffCover}>
                  <Text style={styles.cameraOffText}>Cam Off</Text>
                </View>
              )}
              <Text style={styles.pipLabel}>You</Text>
            </View>
          )}
        </View>
      ) : (
        /* ── AUDIO CALL VIEW ── */
        <View style={styles.audioCanvasContainer}>
          <View style={styles.audioCenterPlate}>
            <Animated.View style={[styles.audioPulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.25 }]} />
            <View style={styles.audioAvatarMain}>
              <Image
                source={remotePhoto ? { uri: remotePhoto } : require("../../../assets/icons/nanny-image.svg")}
                style={styles.audioAvatarImg}
                contentFit="cover"
              />
            </View>
          </View>
          <Text style={styles.audioRemoteName}>{session?.remoteName || remoteName}</Text>
          <Text style={styles.audioStatusText}>
            {callConnected ? formatTime(callDuration) : callStatusMessage}
          </Text>
        </View>
      )}

      {/* ── TOP HEADER (MINIMIZE + DURATION PILL) ── */}
      <View style={styles.topBannerRow}>
        <TouchableOpacity
          style={styles.minimizeBtn}
          onPress={handleMinimize}
          activeOpacity={0.75}
          accessibilityLabel="Minimize call"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-down" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.durationBadge}>
          <View style={[styles.statusDot, callConnected ? styles.dotGreen : styles.dotOrange]} />
          <Text style={styles.durationTitle}>
            {callConnected ? formatTime(callDuration) : callStatusMessage}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* ── BOTTOM DOCK CONTROLS ── */}
      <View style={styles.bottomDockContainer}>
        <View style={styles.controlDock}>
          <View style={styles.controlsRow}>
            {/* Camera Toggle (Video Call Only) */}
            {callType === "video" && (
              <TouchableOpacity
                style={[styles.btnCircle, isCameraOff && styles.btnInactive]}
                onPress={toggleCamera}
              >
                <Image
                  source={require("../../../assets/icons/video-call-message.svg")}
                  style={styles.controlIcon}
                  tintColor="#FFFFFF"
                  contentFit="contain"
                />
                {isCameraOff && <View style={styles.slashOverlay} />}
              </TouchableOpacity>
            )}

            {/* Mic Toggle */}
            <TouchableOpacity
              style={[styles.btnCircle, isMuted && styles.btnInactive]}
              onPress={toggleMute}
            >
              <Image
                source={require("../../../assets/icons/audio.svg")}
                style={styles.controlIcon}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
              {isMuted && <View style={styles.slashOverlay} />}
            </TouchableOpacity>

            {/* Speaker Toggle */}
            <TouchableOpacity
              style={[styles.btnCircle, !isSpeakerOn && styles.btnSpeakerOff]}
              onPress={toggleSpeaker}
            >
              <Image
                source={require("../../../assets/icons/support.svg")}
                style={styles.controlIcon}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
            </TouchableOpacity>

            {/* Flip Camera (Video Call Only) */}
            {callType === "video" && (
              <TouchableOpacity style={styles.btnCircle} onPress={flipCamera}>
                <Image
                  source={require("../../../assets/icons/settings.svg")}
                  style={styles.controlIcon}
                  tintColor="#FFFFFF"
                  contentFit="contain"
                />
              </TouchableOpacity>
            )}

            {/* End Call Button */}
            <TouchableOpacity accessibilityLabel="End call" style={styles.hangupBtn} onPress={handleHangup}>
              <Image
                source={require("../../../assets/icons/call-declined.svg")}
                style={styles.hangupIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Labels Row */}
          <View style={styles.labelsRow}>
            {callType === "video" && (
              <Text style={[styles.controlLabel, isCameraOff && styles.labelInactive]}>
                {isCameraOff ? "Cam Off" : "Camera"}
              </Text>
            )}
            <Text style={[styles.controlLabel, isMuted && styles.labelInactive]}>
              {isMuted ? "Muted" : "Mic"}
            </Text>
            <Text style={styles.controlLabel}>
              {isSpeakerOn ? "Speaker" : "Earpiece"}
            </Text>
            {callType === "video" && <Text style={styles.controlLabel}>Flip</Text>}
            <Text style={[styles.controlLabel, { color: "#EF4444" }]}>End</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  videoCanvasContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteVideoFeed: {
    flex: 1,
  },
  waitingCover: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarPulseRing: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 115, 167, 0.25)",
  },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    marginBottom: 20,
    backgroundColor: "#1E293B",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  remoteNameText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  statusSubText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 15,
    color: "#94A3B8",
  },
  localPipOverlay: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 110,
    height: 155,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#1E293B",
    elevation: 8,
    zIndex: 20,
  },
  localVideoFeed: {
    flex: 1,
  },
  cameraOffCover: {
    flex: 1,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  pipLabel: {
    position: "absolute",
    bottom: 4,
    left: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 5,
    borderRadius: 4,
  },

  /* Audio Mode Styles */
  audioCanvasContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#141E33",
  },
  audioCenterPlate: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 28,
  },
  audioPulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#38BDF8",
  },
  audioAvatarMain: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#1E293B",
  },
  audioAvatarImg: {
    width: "100%",
    height: "100%",
  },
  audioRemoteName: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  audioStatusText: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "600",
  },

  /* Top Bar */
  topBannerRow: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 38,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 30,
  },
  minimizeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerSpacer: {
    width: 42,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: "#22C55E",
  },
  dotOrange: {
    backgroundColor: "#F59E0B",
  },
  durationTitle: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* Controls */
  bottomDockContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 36 : 24,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 30,
  },
  controlDock: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    width: "100%",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 8,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  btnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  btnInactive: {
    backgroundColor: "#334155",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  btnSpeakerOff: {
    opacity: 0.6,
  },
  controlIcon: {
    width: 22,
    height: 22,
  },
  slashOverlay: {
    position: "absolute",
    width: "70%",
    height: 2,
    backgroundColor: "#EF4444",
    transform: [{ rotate: "45deg" }],
  },
  hangupBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  hangupIcon: {
    width: 26,
    height: 26,
  },
  controlLabel: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    width: 56,
  },
  labelInactive: {
    color: "#EF4444",
  },
});
