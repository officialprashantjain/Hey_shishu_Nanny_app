import { Platform, AppState, NativeModules, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { getSession } from '../utils/storage';
import { stopRingtone } from '../utils/callRingtone';

const isNative = Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
const KEY = 'pendingCall.v1';
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
const listeners = new Set();
let pending = null;
let voipToken;
let unsubscribeRefresh;
let stopService;
let pollTimer;
let pollBusy = false;
let notifee, EventType, AndroidImportance, AndroidCategory, AndroidVisibility, AndroidForegroundServiceType;
let messaging, callKeep, voip;
const endedIds = new Set();
const answeredIds = new Set();
const guarded = (fn) => (...args) => Promise.resolve(fn(...args)).catch((error) => {
  console.warn('[Native call]', error.response?.status || error.code || error.message);
});

if (isNative) {
  if (Platform.OS === 'android') {
    const module = require('@notifee/react-native');
    ({ default: notifee, EventType, AndroidImportance, AndroidCategory, AndroidVisibility, AndroidForegroundServiceType } = module);
  }
  messaging = require('@react-native-firebase/messaging').default;
  if (Platform.OS === 'ios') {
    callKeep = require('react-native-callkeep').default;
    voip = require('react-native-voip-push-notification').default;
  }
}

export async function getPendingCall() {
  if (!pending) {
    const raw = await SecureStore.getItemAsync(KEY, OPTIONS);
    if (raw) pending = JSON.parse(raw);
  }
  return pending;
}
async function savePending(data, action = 'incoming') {
  pending = { data, action };
  await SecureStore.setItemAsync(KEY, JSON.stringify(pending), OPTIONS);
  listeners.forEach((listener) => listener(pending));
}
export function subscribeCalls(listener) { listeners.add(listener); return () => listeners.delete(listener); }

async function channels() {
  if (!notifee) return;
  await notifee.createChannel({ id: 'incoming_calls_v3', name: 'Incoming calls',
    importance: AndroidImportance.HIGH, sound: 'ringtone', vibration: true,
    visibility: AndroidVisibility.PUBLIC });
  await notifee.createChannel({ id: 'ongoing_calls', name: 'Ongoing calls',
    importance: AndroidImportance.LOW, sound: undefined });
}

export async function dismissIncomingNotification(callId) {
  stopRingtone();
  if (notifee) await notifee.cancelNotification(`call-${callId}`);
}

export async function finishNativeCall(callId, uuid, reason = 2) {
  stopRingtone();
  if (!callId) return;
  NativeModules.ShishuCallPermissions?.setCallScreenVisible(false);
  endedIds.add(callId);
  if (endedIds.size > 100) endedIds.delete(endedIds.values().next().value);
  const saved = await getPendingCall();
  if (saved?.data?.callId === callId) {
    pending = null;
    await SecureStore.deleteItemAsync(KEY, OPTIONS);
  }
  if (notifee) {
    await dismissIncomingNotification(callId);
    await notifee.cancelNotification(`active-${callId}`);
    if (!saved || saved.data?.callId === callId) { stopService?.(); await notifee.stopForegroundService(); }
  }
  if (callKeep && uuid) callKeep.reportEndCallWithUUID(uuid, reason);
  if (!saved || saved.data?.callId === callId) { clearInterval(pollTimer); pollTimer = null; }
  listeners.forEach((listener) => listener({ action: 'ended', data: { callId, uuid } }));
}

async function pollCurrentCall() {
  if (pollBusy) return;
  pollBusy = true;
  try {
    const call = await getPendingCall();
    if (!call?.data?.callId) return;
    const res = await api.get(`/calls/${call.data.callId}/status`);
    if (['ended', 'declined', 'missed', 'busy'].includes(res.data.status)) {
      await finishNativeCall(call.data.callId, call.data.uuid, res.data.status === 'missed' ? 3 : 2);
    } else if (call.action === 'incoming' && res.data.status === 'accepted' && !answeredIds.has(call.data.callId)) {
      await finishNativeCall(call.data.callId, call.data.uuid, 4);
    }
  } catch (error) {
    if ([403, 404].includes(error.response?.status)) {
      const call = await getPendingCall();
      if (call) await finishNativeCall(call.data.callId, call.data.uuid);
    }
  } finally { pollBusy = false; }
}
function startPolling() {
  if (!pollTimer) pollTimer = setInterval(pollCurrentCall, 3000);
}

export async function showIncomingCall(data, fromPushKit = false) {
  if (!data?.callId || endedIds.has(data.callId)) return;
  const expires = Number(data.expiresAt) || new Date(data.expiresAt).getTime();
  if (expires && expires <= Date.now()) {
    await finishNativeCall(data.callId, data.uuid, 3);
    return;
  }
  const session = await getSession();
  if (!session?.token) { if (fromPushKit) await finishNativeCall(data.callId, data.uuid); return; }
  const saved = await getPendingCall();
  if (saved?.data?.callId === data.callId) return;
  await savePending(data);
  startPolling();
  if (notifee) {
    await channels();
    await notifee.displayNotification({ id: `call-${data.callId}`, title: data.callerName || 'HeyShishu caller',
      body: `Incoming ${data.callType === 'video' ? 'video' : 'audio'} call`, data,
      android: { channelId: 'incoming_calls_v3', category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH, visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_stat_call', ongoing: true, autoCancel: false,
        sound: 'ringtone', loopSound: true,
        timeoutAfter: Math.max(1, expires ? expires - Date.now() : 45000),
        pressAction: { id: 'open', launchActivity: 'default' },
        fullScreenAction: { id: 'open', launchActivity: 'default' },
        actions: [ { title: 'Decline', pressAction: { id: 'decline' } },
          { title: 'Answer', pressAction: { id: 'answer', launchActivity: 'default' } } ],
      },
    });
  } else if (callKeep && !fromPushKit && data.uuid) {
    callKeep.displayIncomingCall(data.uuid, data.callerName || 'HeyShishu caller', data.callerName, 'generic', data.callType === 'video');
  }
}

async function notificationAction(action, data) {
  if (!data?.callId || endedIds.has(data.callId)) return;
  if (action === 'answer') {
    answeredIds.add(data.callId);
    await dismissIncomingNotification(data.callId);
    // Cold-start actions wait here for secure session restoration and Router readiness.
    await savePending(data, 'answer');
  } else if (action === 'decline' || action === 'end') {
    const endpoint = action === 'decline' ? 'decline' : 'end';
    const request = api.post(`/calls/${data.callId}/${endpoint}`).then(() => null, (error) => error);
    // Clear native UI immediately, while the headless task still awaits delivery.
    await finishNativeCall(data.callId, data.uuid, 2);
    const error = await request;
    if (error) throw error;
  } else if (action === 'open') {
    const saved = await getPendingCall();
    if (saved?.data?.callId === data.callId && saved.action === 'active') {
      listeners.forEach((listener) => listener(saved));
    } else await showIncomingCall(data);
  }
}

export async function markCallAnswered(data) {
  const alreadyAnswered = answeredIds.has(data.callId);
  answeredIds.add(data.callId);
  await savePending(data, 'active');
  await dismissIncomingNotification(data.callId);
  startPolling();
  if (callKeep && data.uuid && !alreadyAnswered) callKeep.answerIncomingCall(data.uuid);
}
export async function startNativeOutgoingCall(data) {
  answeredIds.add(data.callId);
  await savePending(data, 'active');
  startPolling();
  if (callKeep && data.uuid) callKeep.startCall(data.uuid, data.remoteName || 'HeyShishu caller', data.remoteName, 'generic', data.callType === 'video');
}
export async function showOngoingCall(data, startedAt) {
  if (!isNative || endedIds.has(data.callId)) return;
  const saved = await getPendingCall();
  if (startedAt && saved?.data?.callId === data.callId && !saved.data.startedAt) {
    await savePending({ ...saved.data, startedAt: new Date(startedAt).toISOString() }, saved.action);
  }
  if (endedIds.has(data.callId)) return;
  if (callKeep && data.uuid && startedAt && data.mode === 'outgoing') callKeep.reportConnectedOutgoingCallWithUUID(data.uuid);
  if (notifee) {
    await channels();
    await notifee.displayNotification({ id: `active-${data.callId}`, title: data.remoteName || 'HeyShishu call',
      body: startedAt ? `${data.callType === 'video' ? 'Video' : 'Audio'} call in progress` : 'Connecting call…', data: { ...data, type: 'CALL_ACTIVE' },
      android: { channelId: 'ongoing_calls', category: AndroidCategory.CALL, smallIcon: 'ic_stat_call',
        asForegroundService: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE],
        ongoing: true, autoCancel: false, timestamp: startedAt || undefined, showChronometer: Boolean(startedAt),
        pressAction: { id: 'open', launchActivity: 'default' },
        actions: [{ title: 'End call', pressAction: { id: 'end' } }],
      },
    });
  }
}

const handleMessage = async (message) => {
  const data = message.data;
  if (data?.type === 'CALL_INCOMING') {
    // iOS incoming calls must originate in native PushKit. FCM is for cancellation only.
    if (Platform.OS === 'android') await showIncomingCall(data);
  } else if (data?.type === 'CALL_ENDED') await finishNativeCall(data.callId, data.uuid);
  else if (data?.type === 'CALL_ACCEPTED') {
    const saved = await getPendingCall();
    if (saved?.data?.callId === data.callId && saved.action === 'incoming' && !answeredIds.has(data.callId)) await finishNativeCall(data.callId, data.uuid, 4);
  }
};
const registerToken = async (token, transport = 'fcm') => {
  if (!token || !(await getSession())?.token) return;
  await api.post('/calls/device-token', { token, transport, platform: Platform.OS,
    environment: Constants.expoConfig?.extra?.callPushEnvironment === 'sandbox' ? 'sandbox' : 'production' });
};

export async function registerCallNotifications() {
  if (!isNative) return;
  if (notifee) {
    await channels(); await notifee.requestPermission();
    const permissions = NativeModules.ShishuCallPermissions;
    if (permissions && !await permissions.canUseFullScreenIntent() && !await SecureStore.getItemAsync('call.fullscreenPrompted')) {
      await SecureStore.setItemAsync('call.fullscreenPrompted', 'true');
      Alert.alert('Incoming calls on the lock screen', 'Allow full-screen call notifications in Settings to see Answer and Decline when your phone is locked.', [
        { text: 'Later', style: 'cancel' }, { text: 'Open settings', onPress: () => permissions.openFullScreenIntentSettings() },
      ]);
    }
  }
  else await messaging().requestPermission();
  if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) await messaging().registerDeviceForRemoteMessages();
  await registerToken(await messaging().getToken());
  if (voipToken) await registerToken(voipToken, 'voip');
  // Request microphone access while visible so a later locked-screen answer can connect.
  if (AppState.currentState === 'active') await Camera.requestMicrophonePermissionsAsync();
  unsubscribeRefresh?.();
  unsubscribeRefresh = messaging().onTokenRefresh(guarded(registerToken));
  return () => { unsubscribeRefresh?.(); unsubscribeRefresh = null; };
}

if (isNative) {
  messaging().setBackgroundMessageHandler(handleMessage);
  messaging().onMessage(guarded(handleMessage));
  if (notifee) {
    const event = async ({ type, detail }) => {
      if ([EventType.ACTION_PRESS, EventType.PRESS].includes(type)) await notificationAction(detail.pressAction?.id || 'open', detail.notification?.data);
    };
    notifee.onBackgroundEvent(event);
    notifee.onForegroundEvent(guarded(event));
    notifee.registerForegroundService(() => new Promise((resolve) => { stopService = resolve; startPolling(); }));
  }
  if (callKeep) {
    const callKeepEvent = async (name, data) => {
      if (name === 'RNCallKeepDidDisplayIncomingCall' && data.payload?.callId) {
        if (data.error) { console.warn('[CallKit] Incoming call rejected:', data.error); return; }
        await showIncomingCall(data.payload, true);
      } else if (name === 'RNCallKeepPerformAnswerCallAction' || name === 'RNCallKeepPerformEndCallAction') {
        const saved = await getPendingCall();
        if (saved?.data?.uuid?.toLowerCase() !== data.callUUID?.toLowerCase()) return;
        if (name === 'RNCallKeepPerformAnswerCallAction' && saved.action === 'active') return;
        await notificationAction(name === 'RNCallKeepPerformAnswerCallAction' ? 'answer' : (saved.action === 'active' ? 'end' : 'decline'), saved.data);
      }
    };
    callKeep.addEventListener('didDisplayIncomingCall', guarded((data) => callKeepEvent('RNCallKeepDidDisplayIncomingCall', data)));
    callKeep.addEventListener('answerCall', guarded((data) => callKeepEvent('RNCallKeepPerformAnswerCallAction', data)));
    callKeep.addEventListener('endCall', guarded((data) => callKeepEvent('RNCallKeepPerformEndCallAction', data)));
    callKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => listeners.forEach((listener) => listener({ action: 'mute', data: { muted, uuid: callUUID } })));
    callKeep.addEventListener('didResetProvider', guarded(async () => {
      const saved = await getPendingCall();
      if (saved) {
        try { await api.post(`/calls/${saved.data.callId}/end`, { reason: 'error' }); }
        finally { await finishNativeCall(saved.data.callId, saved.data.uuid); }
      }
    }));
    callKeep.addEventListener('didActivateAudioSession', () => listeners.forEach((listener) => listener({ action: 'audioActive' })));
    callKeep.addEventListener('didLoadWithEvents', guarded(async (events) => {
      for (const event of events) await callKeepEvent(event.name, event.data);
      callKeep.clearInitialEvents();
    }));
    voip.addEventListener('register', (token) => { voipToken = token; guarded(registerToken)(token, 'voip'); });
    voip.addEventListener('notification', guarded((data) => showIncomingCall(data, true)));
    voip.addEventListener('didLoadWithEvents', guarded(async (events) => {
      for (const event of events) {
        if (event.name === 'RNVoipPushRemoteNotificationsRegisteredEvent') { voipToken = event.data; await registerToken(voipToken, 'voip'); }
        if (event.name === 'RNVoipPushRemoteNotificationReceivedEvent') await showIncomingCall(event.data, true);
      }
    }));
  }
}
export async function consumeInitialCallAction() {
  if (notifee) {
    const initial = await notifee.getInitialNotification();
    if (initial) await notificationAction(initial.pressAction?.id || 'open', initial.notification?.data);
  }
  return getPendingCall();
}
