import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import SplashImage from '../../../assets/icons/splashImage.svg';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo area */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <SplashImage width={120} height={120} />
        </View>
        <Text style={styles.appName}>Nanny App</Text>
        <Text style={styles.tagline}>Trusted Care, Every Session</Text>
      </View>

      {/* Bottom powered-by */}
      <Text style={styles.powered}>Provider Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    // width: 120,
    // height: 120,
    // borderRadius: 60,
    // backgroundColor: colors.primary,
    // alignItems: 'center',
    // justifyContent: 'center',
    // shadowColor: colors.primary,
    // shadowOffset: { width: 0, height: 8 },
    // shadowOpacity: 0.3,
    // shadowRadius: 16,
    // elevation: 10,
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontFamily: fonts.chocoShake,
    fontSize: 42,
    color: colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    opacity: 0.7,
  },
  powered: {
    position: 'absolute',
    bottom: 50,
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.gray,
  },
});
