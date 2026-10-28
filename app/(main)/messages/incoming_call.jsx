import { prepareCallMedia } from '../../../src/utils/callMedia';
import { NativeModules } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../src/components/common/CustomImage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import callService from '../../../src/services/callService';
import { markCallAnswered, finishNativeCall, subscribeCalls, getPendingCall } from '../../../src/services/nativeCallService';
import { requestCallPermissions } from '../../../src/utils/callPermissions';
import { startRingtone, stopRingtone } from '../../../src/utils/callRingtone';
const { width } = Dimensions.get('window');

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { callId, uuid, channelName } = params;
  const callerName = params.callerName || 'Parent';
  const callerPhoto = params.callerPhoto || null;
  const callType = params.callType === 'audio' ? 'audio' : 'video';
  const pulse1 = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);
  const done = useRef(false);
  const [processing, setProcessing] = useState(false);

  const leave = async () => {
    stopRingtone();
    if (done.current) return;
    done.current = true;
    await finishNativeCall(callId, uuid);
    router.replace('/(main)/messages');
  };
  const handleHangup = async () => {
    stopRingtone();
    if (busy.current || done.current) return;
    busy.current = true;
    setProcessing(true);
    const declined = callService.declineCall(callId).catch((error) => console.warn('[Call] Decline:', error.response?.status || error.code));
    await leave();
    await declined;
  };
  const handleAccept = async () => {
    stopRingtone();
    if (busy.current || done.current) return;
    busy.current = true;
    setProcessing(true);
    try {
      await prepareCallMedia();
      await requestCallPermissions(callType);
      if (done.current) return;
      const response = await callService.acceptCall(callId);
      const data = response.data;
      if (!data?.token || !data.channelName || !data.agoraAppId) throw new Error('Missing call credentials.');
      const callerId = data.caller?.id || params.callerId || '';
      const active = {
        callId,
        uuid: data.uuid || uuid,
        callType,
        mode: 'incoming',
        channelName: data.channelName,
        token: data.token,
        uid: data.uid,
        agoraAppId: data.agoraAppId,
        startedAt: data.startedAt,
        remoteName: data.caller?.name || callerName,
        remotePhoto: data.caller?.photo || callerPhoto || '',
        remoteUserId: callerId,
        receiverId: callerId,
        parentId: callerId,
        bookingId: data.bookingId || params.bookingId || '',
        receiverRole: data.caller?.role || 'parent',
      };
      done.current = true;
      await markCallAnswered(active);
      router.replace({ pathname: '/(main)/messages/active_call', params: active });
    } catch (error) {
      Alert.alert('Could not answer call', error.response?.data?.message || error.message);
      try { await callService.endCall(callId, 'error'); } catch (_) {}
      done.current = false;
      await leave();
    }
  };

  useEffect(() => {
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(true);
    startRingtone();
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse1, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
      Animated.timing(pulse1, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]));
    animation.start();
    const unsubscribe = subscribeCalls((event) => {
      if (event.data?.callId !== callId) return;
      if (event.action === 'answer') handleAccept();
      if (event.action === 'ended') { stopRingtone(); done.current = true; router.replace('/(main)/messages'); }
    });
    const check = async () => {
      try {
        const response = await callService.getCallStatus(callId);
        if (!['ringing', 'accepted'].includes(response.data.status)) await leave();
      } catch (error) { if ([403, 404].includes(error.response?.status)) await leave(); }
    };
    check();
    const interval = setInterval(check, 2500);
    getPendingCall().then((saved) => {
      if (params.autoAnswer === 'true' || (saved?.data?.callId === callId && saved.action === 'answer')) handleAccept();
    });
    return () => { stopRingtone(); done.current = true; animation.stop(); unsubscribe(); clearInterval(interval); };
  }, [callId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.callerContainer}>
        <View style={styles.avatarPulsingBase}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse1 }], opacity: 0.3 }]} />
          <View style={styles.avatarMainPlate}>
            <Image source={callerPhoto ? { uri: callerPhoto } : require('../../../assets/icons/nanny-image.svg')} style={styles.callerAvatar} contentFit="cover" />
          </View>
        </View>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callingStatus}>{processing ? 'Connecting…' : `Incoming ${callType} call`}</Text>
      </View>
      <View style={styles.controlsDock}><View style={styles.controlsRow}>
        <View style={styles.controlItemColumn}>
          <TouchableOpacity accessibilityLabel="Decline call" disabled={processing} style={styles.declineBtn} onPress={handleHangup}>
            <Image source={require('../../../assets/icons/call-declined.svg')} style={styles.declineIcon} contentFit="contain" />
          </TouchableOpacity><Text style={styles.btnLabel}>Decline</Text>
        </View>
        <View style={styles.controlItemColumn}>
          <TouchableOpacity accessibilityLabel="Answer call" disabled={processing} style={styles.acceptBtn} onPress={handleAccept}>
            <Image source={require('../../../assets/icons/call-recieve.svg')} style={styles.acceptIcon} contentFit="contain" />
          </TouchableOpacity><Text style={styles.btnLabel}>Answer</Text>
        </View>
      </View></View>
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
