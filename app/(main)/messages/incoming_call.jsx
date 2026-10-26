import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  Alert,
  Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../src/components/common/CustomImage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import callService from '../../../src/services/callService';

const { width } = Dimensions.get('window');

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const callId = params.callId;
  const callerName = params.callerName || 'Parent';
  const callerPhoto = params.callerPhoto || null;
  const callType = params.callType === 'audio' ? 'audio' : 'video';
  const channelName = params.channelName;

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);

  const stopRinging = () => {
    try {
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } catch (e) {}
  };

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

    // Start vibration pattern: delay 0ms, vibrate 1000ms, wait 1000ms...
    Vibration.vibrate([0, 1000, 1000, 1000], true);

    // Play ringing audio sound
    let isMounted = true;
    const playRingTone = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        let soundObj = null;
        try {
          const res = await Audio.Sound.createAsync(
            require('../../../assets/sounds/ringtone.mp3'),
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundObj = res.sound;
        } catch (localErr) {
          // Fallback if local asset is not bundled yet
          const res = await Audio.Sound.createAsync(
            { uri: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3' },
            { shouldPlay: true, isLooping: true, volume: 1.0 }
          );
          soundObj = res.sound;
        }

        if (isMounted && soundObj) {
          soundRef.current = soundObj;
        } else if (soundObj) {
          await soundObj.unloadAsync();
        }
      } catch (audioErr) {
        console.warn('⚠️ [IncomingCall] Ringtone audio playback warning:', audioErr.message);
      }
    };

    playRingTone();

    return () => {
      isMounted = false;
      stopRinging();
    };
  }, []);

  useEffect(() => {
    console.log(`\n🔔 [INCOMING CALL SCREEN] Ringing incoming ${callType.toUpperCase()} call from "${callerName}" (Call ID: ${callId || 'test'})`);
  }, [callId, callerName, callType]);

  const autoDeclineTimer = useRef(null);

  useEffect(() => {
    // 35-second auto decline if unattended
    autoDeclineTimer.current = setTimeout(async () => {
      console.log(`⏱️ [Incoming Call Auto-Timeout] 35s expired without answer for call: ${callId}`);
      stopRinging();
      if (callId) {
        try {
          await callService.declineCall(callId);
        } catch (e) {}
      }
      router.replace('/(main)/messages/no_response');
    }, 35 * 1000);

    return () => {
      clearTimeout(autoDeclineTimer.current);
    };
  }, [callId]);

  const handleHangup = async () => {
    console.log(`❌ [Incoming Call Declined] User declined call from ${callerName}`);
    stopRinging();
    clearTimeout(autoDeclineTimer.current);
    if (callId) {
      try {
        await callService.declineCall(callId);
      } catch (e) {
        console.warn('[Decline Call API] error:', e.message);
      }
    }
    router.replace('/(main)/messages/chat');
  };

  const handleAccept = async () => {
    console.log(`✅ [Incoming Call Accepted] User accepted call from ${callerName}. Fetching Agora token...`);
    stopRinging();
    clearTimeout(autoDeclineTimer.current);
    try {
      let acceptRes = null;
      if (callId) {
        acceptRes = await callService.acceptCall(callId);
      }
      const acceptData = acceptRes?.data?.token ? acceptRes.data : (acceptRes?.token ? acceptRes : acceptRes?.data || {});
      console.log(`🔑 [Agora Token Received] Channel: ${acceptData?.channelName} | Token length: ${acceptData?.token?.length}`);

      router.replace({
        pathname: '/(main)/messages/active_call',
        params: {
          callId,
          callType,
          mode: 'incoming',
          channelName: acceptData?.channelName || channelName,
          token: acceptData?.token,
          uid: acceptData?.uid,
          agoraAppId: acceptData?.agoraAppId,
          remoteName: callerName,
          remotePhoto: callerPhoto,
        },
      });
    } catch (err) {
      console.error('[Accept Call error]:', err);
      Alert.alert('Call Error', err?.response?.data?.message || err.message || 'Failed to accept call.');
      router.replace('/(main)/messages/chat');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callerContainer}>
        <View style={styles.avatarPulsingBase}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse2 }], opacity: 0.15 }]} />
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse1 }], opacity: 0.3 }]} />
          
          <View style={styles.avatarMainPlate}>
            <Image 
              source={callerPhoto ? { uri: callerPhoto } : require('../../../assets/icons/nanny-image.svg')} 
              style={styles.callerAvatar}
              contentFit="cover"
            />
          </View>
        </View>

        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callingStatus}>
          is {callType} calling you...
        </Text>
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
