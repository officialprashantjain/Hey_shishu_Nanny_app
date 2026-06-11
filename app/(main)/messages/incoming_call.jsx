import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Animated 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../components/CustomImage';
import { useRouter } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

const { width } = Dimensions.get('window');

export default function IncomingCallScreen() {
  const router = useRouter();

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, {
          toValue: 1.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse2, {
          toValue: 1.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const autoDeclineTimer = useRef(null);

  useEffect(() => {
    autoDeclineTimer.current = setTimeout(() => {
      router.push('/(main)/messages/no_response');
    }, 10 * 1000);

    return () => clearTimeout(autoDeclineTimer.current);
  }, []);

  const handleHangup = () => {
    clearTimeout(autoDeclineTimer.current);
    router.push('/(main)/messages/chat');
  };

  const handleAccept = () => {
    clearTimeout(autoDeclineTimer.current);
    router.push('/(main)/messages/active_call');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callerContainer}>
        <View style={styles.avatarPulsingBase}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse2 }], opacity: 0.15 }]} />
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse1 }], opacity: 0.3 }]} />
          
          <View style={styles.avatarMainPlate}>
            <Image 
              source={require('../../../assets/icons/nanny-image.svg')} 
              style={styles.callerAvatar}
              contentFit="cover"
            />
          </View>
        </View>

        <Text style={styles.callerName}>Parent</Text>
        <Text style={styles.callingStatus}>is video calling you...</Text>
      </View>

      <View style={styles.controlsDock}>
        <View style={styles.controlsRow}>
          
          <View style={styles.controlItemColumn}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleHangup}>
              <Image 
                source={require('../../../assets/icons/call-declined.svg')} 
                style={styles.declineIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>Decline</Text>
          </View>

          <View style={styles.controlItemColumn}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Image 
                source={require('../../../assets/icons/call-recieve.svg')} 
                style={styles.acceptIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
            <Text style={styles.btnLabel}>Accept</Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6E6',
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  callerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  avatarPulsingBase: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF73A7',
  },
  avatarMainPlate: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#D7DFE9',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.white,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  callerAvatar: {
    width: 122,
    height: 122,
  },
  callerName: {
    fontFamily: fonts.chocoShake,
    fontSize: 28,
    color: '#346960',
    textAlign: 'center',
  },
  callingStatus: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  controlsDock: {
    paddingHorizontal: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlItemColumn: {
    alignItems: 'center',
    gap: 8,
  },
  declineBtn: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineIcon: {
    width: 72,
    height: 72,
  },
  acceptBtn: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptIcon: {
    width: 72,
    height: 72,
  },
  btnLabel: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  }
});
