import Constants from 'expo-constants';
import { prepareCallMedia } from './callMedia';
import { requestCallPermissions } from './callPermissions';
import { startNativeOutgoingCall } from '../services/nativeCallService';
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
    if (Constants.executionEnvironment === 'storeClient') {
      Alert.alert('Native build required', 'Audio and video calls require an Android or iOS development or release build.');
      return;
    }
    if (!receiverId) {
      console.warn('[callLauncher] Cannot initiate call: missing receiverId.');
      Alert.alert('Notice', 'No parent contact is linked to this booking yet.');
      return;
    }

    console.log(`\n🚀 [OUTGOING CALL] Nanny calling "${receiverName}" (${callType.toUpperCase()}) | Recipient ID: ${receiverId}`);

    await prepareCallMedia();
    await requestCallPermissions(callType);
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

    const targetUserId = receiverId || sessionData.receiver?.id || '';
    const targetName = sessionData.receiver?.name || receiverName;
    const targetPhoto = sessionData.receiver?.photo || receiverPhoto || '';
    const targetBookingId = bookingId || sessionData.bookingId || '';
    const targetRole = sessionData.receiver?.role || 'parent';

    await startNativeOutgoingCall({
      ...sessionData,
      callId: sessionData.callId,
      mode: 'outgoing',
      callType,
      remoteName: targetName,
      remotePhoto: targetPhoto,
      remoteUserId: targetUserId,
      bookingId: targetBookingId,
      receiverRole: targetRole,
    });
    router.push({
      pathname: '/(main)/messages/active_call',
      params: {
        callId: sessionData.callId,
        uuid: sessionData.uuid,
        callType,
        mode: 'outgoing', // OUTGOING CALL — Nanny is the caller!
        channelName: sessionData.channelName,
        token: sessionData.token,
        uid: sessionData.uid,
        agoraAppId: sessionData.agoraAppId,
        remoteName: targetName,
        remotePhoto: targetPhoto,
        remoteUserId: targetUserId,
        receiverId: targetUserId,
        parentId: targetUserId,
        bookingId: targetBookingId,
        receiverRole: targetRole,
      },
    });
  } catch (err) {
    console.error('❌ [initiateOutgoingCall error]:', err.response?.status || err.code || err.message);
    Alert.alert('Call Error', err?.response?.data?.message || err.message || 'Failed to start call. Please try again.');
  }
}

let callModalListener = null;

/**
 * Register a UI modal listener to present custom call options
 */
export function registerCallModalListener(listener) {
  callModalListener = listener;
  return () => {
    if (callModalListener === listener) {
      callModalListener = null;
    }
  };
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
  if (typeof callModalListener === 'function') {
    callModalListener({
      router,
      receiverId,
      receiverName,
      receiverPhoto,
      bookingId,
      phone,
    });
    return;
  }

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
  registerCallModalListener,
};
