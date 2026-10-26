import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import callService from "../../../src/services/callService";

const { width, height } = Dimensions.get("window");

// Detect Expo Go to prevent native module crash
const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.executionEnvironment === "expo";

let createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType;

if (isExpoGo) {
  ({
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    VideoSourceType,
  } = require("../../../src/utils/agora-mock"));
} else {
  ({
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    VideoSourceType,
  } = require("react-native-agora"));
}

export default function ActiveCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Params passed from chat.jsx or incoming_call.jsx
  const callId = params.callId;
  const callType = params.callType === "audio" ? "audio" : "video";
  const mode = params.mode || "outgoing"; // 'outgoing' | 'incoming'
  const remoteName = params.remoteName || "Parent";
  const remotePhoto = params.remotePhoto || null;
  const channelName = params.channelName || process.env.EXPO_PUBLIC_AGORA_CHANNEL || `hs-call-test`;
  const token = params.token || process.env.EXPO_PUBLIC_AGORA_TOKEN || "";
  const agoraAppId = params.agoraAppId || process.env.EXPO_PUBLIC_AGORA_APP_ID;
  const numericUid = Number(params.uid) || 1002;

  const agoraEngineRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [callConnected, setCallConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === "video");
  const [callStatusMessage, setCallStatusMessage] = useState(
    mode === "outgoing" ? "Ringing..." : "Connecting..."
  );

  const durationTimerRef = useRef(null);
  const statusPollingRef = useRef(null);

  // Soundwave pulse animation for audio calls & outgoing ringing
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 1. Initialize Agora Engine and Join Channel
  useEffect(() => {
    setupAgoraEngine();

    return () => {
      cleanupAgora();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    };
  }, []);

  // 2. Duration Timer (starts only when remote user joins)
  useEffect(() => {
    if (callConnected) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callConnected]);

  // 3. Status Polling fallback for Outgoing call until accepted or declined
  useEffect(() => {
    if (mode === "outgoing" && !callConnected && callId) {
      statusPollingRef.current = setInterval(async () => {
        try {
          const res = await callService.getCallStatus(callId);
          const currentStatus = res?.data?.status;

          if (currentStatus === "accepted" && !callConnected) {
            setCallStatusMessage("Connecting audio/video...");
          } else if (currentStatus === "declined") {
            clearInterval(statusPollingRef.current);
            cleanupAgora();
            Alert.alert("Call Declined", `${remoteName} declined your call.`);
            router.replace("/(main)/messages/chat");
          } else if (currentStatus === "missed") {
            clearInterval(statusPollingRef.current);
            cleanupAgora();
            router.replace("/(main)/messages/no_response");
          } else if (currentStatus === "ended") {
            clearInterval(statusPollingRef.current);
            cleanupAgora();
            router.replace("/(main)/messages/chat");
          }
        } catch (err) {
          console.warn("[Call Status Poll] error:", err.message);
        }
      }, 2500);
    }

    return () => {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    };
  }, [mode, callConnected, callId]);

  const setupAgoraEngine = async () => {
    if (isExpoGo) {
      setCallStatusMessage("Expo Go Mock Call (Real Agora in Standalone Build)");
      setIsJoined(true);
      return;
    }

    try {
      if (Platform.OS === "android") {
        const { PermissionsAndroid } = require("react-native");
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (callType === "video") {
          permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
        await PermissionsAndroid.requestMultiple(permissions);
      }

      agoraEngineRef.current = createAgoraRtcEngine();
      const agora = agoraEngineRef.current;

      console.log("╔══════════════════════════════════════════════════════╗");
      console.log("║           📞 [AGORA ENGINE INITIALIZED]             ║");
      console.log("╠══════════════════════════════════════════════════════╣");
      console.log(`║ Mode        : ${mode.toUpperCase()} (${callType.toUpperCase()} CALL)`);
      console.log(`║ Channel     : ${channelName}`);
      console.log(`║ Numeric UID : ${numericUid}`);
      console.log(`║ App ID      : ${agoraAppId ? agoraAppId.substring(0, 10) + '...' : 'MISSING ❌'}`);
      console.log(`║ Token       : ${token ? token.substring(0, 18) + '...' : 'EMPTY ⚠️'}`);
      console.log(`║ Remote User : ${remoteName}`);
      console.log("╚══════════════════════════════════════════════════════╝");

      agora.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log(`✅ [Agora Joined Channel] Success! Channel: ${channelName} | Local UID: ${numericUid}`);
          setIsJoined(true);
          if (mode === "outgoing" && !remoteUid) {
            setCallStatusMessage("Ringing...");
          }
        },
        onUserJoined: (_connection, uid) => {
          console.log(`🎉 [Agora Remote Joined] Remote user entered room! UID: ${uid}`);
          setRemoteUid(uid);
          setCallConnected(true);
          setCallStatusMessage("Call Active");
          if (statusPollingRef.current) clearInterval(statusPollingRef.current);
        },
        onUserOffline: (_connection, uid) => {
          console.log(`👋 [Agora Remote Left] Remote user left room. UID: ${uid}`);
          handleRemoteHangup();
        },
        onError: (err) => {
          console.error(`❌ [Agora RTC Engine Error]: Code ${err}`);
        },
      });

      agora.initialize({ appId: agoraAppId });

      if (callType === "video") {
        console.log("📹 [Agora] Enabling video & camera feed...");
        agora.enableVideo();
        agora.startPreview?.();
      } else {
        console.log("🎙️ [Agora] Enabling audio-only mode...");
        agora.enableAudio();
      }

      // Speakerphone routing
      agora.setEnableSpeakerphone?.(callType === "video");

      console.log(`🚀 [Agora] Joining channel "${channelName}" as Broadcaster with UID: ${numericUid}...`);
      await agora.joinChannel(token, channelName, numericUid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: callType === "video",
        autoSubscribeAudio: true,
        autoSubscribeVideo: callType === "video",
      });
    } catch (e) {
      console.error("❌ [Agora Setup Fatal Error]:", e);
      Alert.alert("Call Error", "Failed to connect call: " + e.message);
    }
  };

  const cleanupAgora = () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
    } catch (e) {
      console.warn("[Agora Cleanup Warning]:", e);
    }
  };

  const handleRemoteHangup = () => {
    cleanupAgora();
    Alert.alert("Call Ended", `${remoteName} ended the call.`, [
      {
        text: "OK",
        onPress: () => {
          router.replace({
            pathname: "/(main)/messages/rating",
            params: { duration: callDuration, remoteName },
          });
        },
      },
    ]);
  };

  const handleHangup = async () => {
    console.log(`📵 [Call Hangup] User pressed End Call button. Total duration: ${callDuration}s`);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (statusPollingRef.current) clearInterval(statusPollingRef.current);

    cleanupAgora();

    if (callId) {
      try {
        await callService.endCall(callId, "caller_hangup");
      } catch (err) {
        console.warn("[End Call API] error:", err.message);
      }
    }

    router.replace({
      pathname: "/(main)/messages/rating",
      params: { duration: callDuration, remoteName },
    });
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    console.log(`🎙️ [Call Control] Toggle Mute: ${nextState ? "MUTED" : "UNMUTED"}`);
    setIsMuted(nextState);
    agoraEngineRef.current?.muteLocalAudioStream(nextState);
  };

  const toggleCamera = () => {
    if (callType !== "video") return;
    const nextState = !isCameraOff;
    console.log(`📷 [Call Control] Toggle Camera: ${nextState ? "CAMERA OFF" : "CAMERA ON"}`);
    setIsCameraOff(nextState);
    agoraEngineRef.current?.muteLocalVideoStream(nextState);
  };

  const toggleSpeaker = () => {
    const nextState = !isSpeakerOn;
    console.log(`🔊 [Call Control] Toggle Speaker: ${nextState ? "SPEAKERPHONE" : "EARPIECE"}`);
    setIsSpeakerOn(nextState);
    agoraEngineRef.current?.setEnableSpeakerphone?.(nextState);
  };

  const flipCamera = () => {
    if (callType !== "video") return;
    console.log("🔄 [Call Control] Switching Camera (front/back)...");
    agoraEngineRef.current?.switchCamera?.();
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (v) => (v < 10 ? "0" + v : v);
    return `${pad(mins)}:${pad(secs)}`;
  };

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
              <Text style={styles.remoteNameText}>{remoteName}</Text>
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
          <Text style={styles.audioRemoteName}>{remoteName}</Text>
          <Text style={styles.audioStatusText}>
            {callConnected ? formatTime(callDuration) : callStatusMessage}
          </Text>
        </View>
      )}

      {/* ── TOP DURATION / STATUS PILL ── */}
      <View style={styles.topBannerRow}>
        <View style={styles.durationBadge}>
          <View style={[styles.statusDot, callConnected ? styles.dotGreen : styles.dotOrange]} />
          <Text style={styles.durationTitle}>
            {callConnected ? formatTime(callDuration) : callStatusMessage}
          </Text>
        </View>
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
            <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
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
    fontFamily: fonts.rubik,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  statusSubText: {
    fontFamily: fonts.rubik,
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
    fontFamily: fonts.rubik,
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  audioStatusText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "600",
  },

  /* Top Bar */
  topBannerRow: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 42,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
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
    fontFamily: fonts.rubik,
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
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  btnCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  btnInactive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  btnSpeakerOff: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  controlIcon: {
    width: 22,
    height: 22,
  },
  slashOverlay: {
    position: "absolute",
    width: 2,
    height: 28,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  hangupBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  hangupIcon: {
    width: 32,
    height: 32,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  controlLabel: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: "#CBD5E1",
    textAlign: "center",
    width: 52,
  },
  labelInactive: {
    color: "#FCA5A5",
  },
});
