import { Alert, Linking } from 'react-native';
import callService from '../services/callService';

/**
 * Initiate an outgoing voice or video call from Nanny to Parent
 */
export async function initiateOutgoingCall({
  router,
  receiverId,
  receiverName = 'Parent',
  receiverPhoto = null,
  bookingId = null,
  callType = 'audio',
}) {
  try {
    if (!receiverId) {
      console.warn('[callLauncher] Cannot initiate call: missing receiverId.');
      Alert.alert('Notice', 'No parent contact is linked to this booking yet.');
      return;
    }

    console.log(`\n🚀 [OUTGOING CALL] Nanny calling "${receiverName}" (${callType.toUpperCase()}) | Recipient ID: ${receiverId}`);

    const res = await callService.initiateCall({
      receiverId,
      receiverRole: 'parent',
      callType,
      bookingId,
    });

    if (res?.status === 'busy' || res?.data?.isBusy || res?.isBusy) {
      console.warn(`⚠️ [CALL BUSY] ${receiverName} is currently on another call.`);
      Alert.alert('Line Busy', res.message || `${receiverName} is currently on another call.`);
      return;
    }

    const sessionData = res?.data?.callId ? res.data : (res?.callId ? res : null);
    if (!sessionData?.callId) {
      throw new Error(res?.message || 'Failed to initialize call session.');
    }

    console.log(`✅ [CALL SESSION CREATED] ID: ${sessionData.callId} | Channel: ${sessionData.channelName} | Local UID: ${sessionData.uid}`);

    router.push({
      pathname: '/(main)/messages/active_call',
      params: {
        callId: sessionData.callId,
        callType,
        mode: 'outgoing', // OUTGOING CALL — Nanny is the caller!
        channelName: sessionData.channelName,
        token: sessionData.token,
        uid: sessionData.uid,
        agoraAppId: sessionData.agoraAppId,
        remoteName: sessionData.receiver?.name || receiverName,
        remotePhoto: sessionData.receiver?.photo || receiverPhoto || '',
      },
    });
  } catch (err) {
    console.error('❌ [initiateOutgoingCall error]:', err);
    Alert.alert('Call Error', err?.response?.data?.message || err.message || 'Failed to start call. Please try again.');
  }
}

/**
 * Display action dialog prompting Nanny to pick Direct Call (SIM), Voice Call or Video Call
 */
export function promptAndStartCall({
  router,
  receiverId,
  receiverName = 'Parent',
  receiverPhoto = null,
  bookingId = null,
  phone = null,
}) {
  const options = [];

  if (phone) {
    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    options.push({
      text: `Direct Call (${phone}) 📱`,
      onPress: () => {
        Linking.openURL(`tel:${cleanPhone}`).catch(err => {
          console.warn('Could not open phone dialer:', err);
          Alert.alert('Error', 'Could not open phone dialer.');
        });
      },
    });
  }

  options.push({
    text: 'In-App Voice Call 📞',
    onPress: () =>
      initiateOutgoingCall({
        router,
        receiverId,
        receiverName,
        receiverPhoto,
        bookingId,
        callType: 'audio',
      }),
  });

  options.push({
    text: 'In-App Video Call 📹',
    onPress: () =>
      initiateOutgoingCall({
        router,
        receiverId,
        receiverName,
        receiverPhoto,
        bookingId,
        callType: 'video',
      }),
  });

  options.push({
    text: 'Cancel',
    style: 'cancel',
  });

  Alert.alert(
    `Contact ${receiverName}`,
    'Choose how you want to connect:',
    options
  );
}

export default {
  initiateOutgoingCall,
  promptAndStartCall,
};
