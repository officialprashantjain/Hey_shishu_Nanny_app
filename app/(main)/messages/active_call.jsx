import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { setAudioModeAsync } from "expo-audio";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { width, height } = Dimensions.get("window");

export default function ActiveCallScreen() {
  const router = useRouter();

  const [callDuration, setCallDuration] = useState(0);

  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [speakerActive, setSpeakerActive] = useState(true);
  const [facing, setFacing] = useState("front");

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
    })();
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: !speakerActive,
        });
      } catch (e) {
        console.log("Audio mode error:", e);
      }
    })();
  }, [speakerActive]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (v) => (v < 10 ? "0" + v : v);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleHangup = () => {
    clearInterval(timerRef.current);
    router.push("/(main)/messages/rating");
  };

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  const toggleMic = () => {
    setMicActive((prev) => !prev);
  };

  const toggleSpeaker = () => {
    setSpeakerActive((prev) => !prev);
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {cameraActive && cameraPermission?.granted ? (
        <CameraView
          style={styles.fullscreenVideoFeed}
          facing={facing}
          enableTorch={false}
          mute={!micActive}
        />
      ) : (
        <View style={[styles.fullscreenVideoFeed, styles.cameraOffPlaceholder]}>
          <View style={styles.cameraOffContent}>
            <Image
              source={require("../../../assets/icons/nanny-image.svg")}
              style={styles.cameraOffAvatar}
              contentFit="cover"
            />
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        </View>
      )}

      {cameraActive && cameraPermission?.granted && (
        <View style={styles.localPipOverlay}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing === "front" ? "back" : "front"}
          />
          <Text style={styles.pipLabel}>You</Text>
        </View>
      )}

      <View style={styles.topBannerRow}>
        <View style={styles.durationBadge}>
          <View style={styles.redDotLive} />
          <Text style={styles.durationTitle}>{formatTime(callDuration)}</Text>
        </View>
      </View>

      <View style={styles.bottomDockContainer}>
        <View style={styles.controlDock}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.btnCircle, !cameraActive && styles.btnInactive]}
              onPress={toggleCamera}
            >
              <Image
                source={require("../../../assets/icons/video-call-message.svg")}
                style={styles.controlIcon}
                tintColor={cameraActive ? "#FFFFFF" : "#FFFFFF"}
                contentFit="contain"
              />
              {!cameraActive && <View style={styles.slashOverlay} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnCircle, !micActive && styles.btnInactive]}
              onPress={toggleMic}
            >
              <Image
                source={require("../../../assets/icons/audio.svg")}
                style={styles.controlIcon}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
              {!micActive && <View style={styles.slashOverlay} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnCircle, !speakerActive && styles.btnInactive]}
              onPress={toggleSpeaker}
            >
              <Image
                source={require("../../../assets/icons/support.svg")}
                style={styles.controlIcon}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
              {!speakerActive && <View style={styles.slashOverlay} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCircle} onPress={flipCamera}>
              <Image
                source={require("../../../assets/icons/settings.svg")}
                style={styles.controlIcon}
                tintColor="#FFFFFF"
                contentFit="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
              <Image
                source={require("../../../assets/icons/call-declined.svg")}
                style={styles.hangupIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.labelsRow}>
            <Text
              style={[
                styles.controlLabel,
                !cameraActive && styles.labelInactive,
              ]}
            >
              {cameraActive ? "Camera" : "Cam Off"}
            </Text>
            <Text
              style={[styles.controlLabel, !micActive && styles.labelInactive]}
            >
              {micActive ? "Mic" : "Muted"}
            </Text>
            <Text
              style={[
                styles.controlLabel,
                !speakerActive && styles.labelInactive,
              ]}
            >
              {speakerActive ? "Speaker" : "Earpiece"}
            </Text>
            <Text style={styles.controlLabel}>Flip</Text>
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
  fullscreenVideoFeed: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  cameraOffPlaceholder: {
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffContent: {
    alignItems: "center",
    gap: 16,
  },
  cameraOffAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cameraOffText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
  },
  localPipOverlay: {
    position: "absolute",
    top: 100,
    right: 24,
    width: 100,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  pipLabel: {
    position: "absolute",
    bottom: 4,
    left: 8,
    fontFamily: fonts.rubik,
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  topBannerRow: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 48,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 30,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  redDotLive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  durationTitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomDockContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 24,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 30,
  },
  controlDock: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: "100%",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  controlIcon: {
    width: 22,
    height: 22,
  },
  slashOverlay: {
    position: "absolute",
    width: 2,
    height: 30,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    opacity: 0.8,
  },
  hangupBtn: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  hangupIcon: {
    width: 56,
    height: 56,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  controlLabel: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: "#CBD5E1",
    textAlign: "center",
    width: 50,
  },
  labelInactive: {
    color: "#FCA5A5",
  },
});
