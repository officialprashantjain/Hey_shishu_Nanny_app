import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/CustomImage";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { width } = Dimensions.get("window");

export default function RequestSentScreen() {
  const router = useRouter();

  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setSecondsRemaining(10);
      spinValue.setValue(0);

      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();

      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        animation.stop();
      };
    }, []),
  );

  useEffect(() => {
    if (secondsRemaining === 0) {
      router.replace("/(main)/messages/incoming_call");
    }
  }, [secondsRemaining, router]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const formatDisplayTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    const padMin = mins < 10 ? "0" + mins : mins;
    const padSec = secs < 10 ? "0" + secs : secs;
    return `${padMin}:${padSec}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Processing Request</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require("../../../assets/icons/nanny-image.svg")}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <View style={styles.profileTextInfo}>
            <Text style={styles.tutorName}>Parent</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.greenStatusDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.timerCard}>
          <View style={styles.progressCircleContainer}>
            <Animated.View
              style={[
                styles.outerProgressRing,
                { transform: [{ rotate: spin }] },
              ]}
            />

            <View style={styles.innerTimerDisk}>
              <Text style={styles.timerLabel}>CALLING</Text>
              <Text style={styles.timerValue}>
                {formatDisplayTime(secondsRemaining)}
              </Text>
              <Text style={styles.timerSubLabel}>seconds left</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Request Sent</Text>
          <Text style={styles.infoSubtitle}>
            Parent has been notified of your request and will respond shortly. Please wait for a few moments.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  headerSafeArea: {
    backgroundColor: "#FFF6E6",
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.description,
    flex: 1,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 24,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D7DFE9",
    overflow: "hidden",
  },
  avatar: {
    width: 52,
    height: 52,
  },
  profileTextInfo: {
    flex: 1,
    gap: 4,
  },
  tutorName: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  onlineText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#15803D",
    fontWeight: "500",
  },
  timerCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 24,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressCircleContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  outerProgressRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: "#A87EE0",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  innerTimerDisk: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  timerLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 2,
  },
  timerValue: {
    fontFamily: fonts.chocoShake,
    fontSize: 32,
    color: "#346960",
  },
  timerSubLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#64748B",
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 12,
    width: "100%",
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: "#346960",
  },
  infoSubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
});
