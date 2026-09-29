import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

// react-native-agora is a native module — it cannot run in Expo Go.
// We detect whether we're in Expo Go and use a mock instead to prevent crashes.
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

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;
const AGORA_TOKEN = process.env.EXPO_PUBLIC_AGORA_TOKEN;
const AGORA_CHANNEL = process.env.EXPO_PUBLIC_AGORA_CHANNEL || "agora_hey_shishu_test";

export default function VideoCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Nanny App UID = 1002
  const UID = 1002;

  const agoraEngineRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    setupVideoSDKEngine();
    return () => {
      cleanup();
    };
  }, []);

  const setupVideoSDKEngine = async () => {
    if (isExpoGo) {
      setMessage("Video calls are not available in Expo Go.\nInstall the app build to use this feature.");
      return;
    }
    try {
      if (Platform.OS === "android") {
        const { PermissionsAndroid } = require("react-native");
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      }

      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;

      console.log("╔══════════════════════════════════════╗");
      console.log("║        AGORA CONNECTION INFO         ║");
      console.log("╠══════════════════════════════════════╣");
      console.log("║ Role     : NANNY (Provider App)      ║");
      console.log(`║ UID      : ${UID}                         ║`);
      console.log(`║ Channel  : ${AGORA_CHANNEL}`);
      console.log(`║ App ID   : ${AGORA_APP_ID?.substring(0, 8)}...`);
      console.log(`║ Token    : ${AGORA_TOKEN ? AGORA_TOKEN.substring(0, 20) + '...' : 'MISSING ❌'}`);
      console.log("╚══════════════════════════════════════╝");

      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log(`✅ [Agora] JOIN SUCCESS → Channel: ${AGORA_CHANNEL} | UID: ${UID}`);
          setIsJoined(true);
          setMessage("Waiting for parent to join...");
        },
        onUserJoined: (_connection, uid) => {
          console.log(`👤 [Agora] USER JOINED → Remote UID: ${uid}`);
          setRemoteUid(uid);
          setMessage("Parent joined! Video call active.");
        },
        onUserOffline: (_connection, uid) => {
          console.log(`👋 [Agora] USER LEFT → Remote UID: ${uid}`);
          setRemoteUid(null);
          setMessage("Parent left the call.");
        },
        onError: (err) => {
          console.error(`❌ [Agora Error Code: ${err}]`);
          setMessage("Error: " + err);
        },
      });

      agoraEngine.initialize({ appId: AGORA_APP_ID });
      agoraEngine.enableVideo();
      console.log("🚀 [Agora] Joining channel...");

      await agoraEngine.joinChannel(AGORA_TOKEN, AGORA_CHANNEL, UID, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
    } catch (e) {
      console.error("[Agora Setup Error]", e);
      Alert.alert("Error", "Failed to start video call: " + e.message);
    }
  };

  const cleanup = async () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
    } catch (e) {}
  };

  const toggleMute = () => {
    agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    agoraEngineRef.current?.muteLocalVideoStream(!isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const endCall = () => {
    cleanup();
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Remote Video (Parent) — Full Screen */}
      <View style={styles.remoteVideoContainer}>
        {remoteUid ? (
          <RtcSurfaceView
            style={styles.remoteVideo}
            canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
          />
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingEmoji}>🎥</Text>
            <Text style={styles.waitingText}>{message}</Text>
          </View>
        )}
      </View>

      {/* Local Video (Nanny) — Small Preview */}
      {isJoined && (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: UID, sourceType: VideoSourceType.VideoSourceCamera }}
          />
          {isCameraOff && (
            <View style={styles.cameraOffOverlay}>
              <Text style={styles.cameraOffText}>📷 Off</Text>
            </View>
          )}
        </View>
      )}

      {/* Status */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{message}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlBtnText}>{isMuted ? "🔇" : "🎙️"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
          <Text style={styles.endCallText}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
          onPress={toggleCamera}
        >
          <Text style={styles.controlBtnText}>{isCameraOff ? "📷" : "📹"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideoContainer: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  waitingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  waitingText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  localVideoContainer: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: "#222",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#4a4e69",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  localVideo: {
    flex: 1,
  },
  cameraOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statusBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  controls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    gap: 30,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  controlBtnText: {
    fontSize: 24,
  },
  endCallBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  endCallText: {
    fontSize: 30,
  },
});
