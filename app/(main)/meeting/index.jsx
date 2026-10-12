import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../constants/color';

export default function MeetingIndexFallback() {
  const router = useRouter();

  useEffect(() => {
    // If user accesses /meeting without an ID, redirect safely to /meetings
    router.replace('/(main)/meetings');
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
