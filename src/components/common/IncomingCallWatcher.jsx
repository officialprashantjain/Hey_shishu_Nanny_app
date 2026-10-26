import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import callService from '../../services/callService';
import notificationService from '../../services/notificationService';

/**
 * IncomingCallWatcher
 * ───────────────────
 * Headless push notification & calling receiver mounted in MainLayout.
 * 1. Registers FCM push token with backend on startup.
 * 2. Listens for real-time FCM push notifications to pop incoming_call screen instantly.
 * 3. Uses a lightweight fallback poll (only on app resume / relaxed interval) to save server & battery.
 */
export default function IncomingCallWatcher() {
  const router = useRouter();
  const segments = useSegments();
  const lastRungCallIdRef = useRef(null);

  const presentIncomingCall = (incoming) => {
    const incomingCallId = incoming.callId || incoming._id;
    if (!incomingCallId || lastRungCallIdRef.current === incomingCallId) {
      return;
    }

    lastRungCallIdRef.current = incomingCallId;
    console.log(`\n🔔 [IncomingCallWatcher] Presenting incoming ${incoming.callType?.toUpperCase()} call from "${incoming.callerName}" (ID: ${incomingCallId})`);

    router.push({
      pathname: '/(main)/messages/incoming_call',
      params: {
        callId: incomingCallId,
        callerName: incoming.callerName || 'Parent',
        callerPhoto: incoming.callerPhoto || '',
        callType: incoming.callType || 'video',
        channelName: incoming.channelName,
      },
    });
  };

  useEffect(() => {
    // 1. Initialize FCM & register token with backend
    notificationService.registerForPushNotifications();

    // 2. Setup real-time FCM push listener (instant, zero polling required)
    const cleanupFCM = notificationService.setupCallNotificationListeners((pushData) => {
      presentIncomingCall(pushData);
    });

    return () => {
      cleanupFCM();
    };
  }, []);

  useEffect(() => {
    const isAlreadyOnCallScreen = segments.some(
      (seg) => seg === 'incoming_call' || seg === 'active_call' || seg === 'no_response'
    );

    if (isAlreadyOnCallScreen) {
      return;
    }

    const checkIncomingCall = async () => {
      try {
        const res = await callService.getActiveIncomingCall();
        const incomingData = res?.data?.hasIncoming !== undefined ? res.data : (res?.hasIncoming !== undefined ? res : null);
        if (incomingData?.hasIncoming && incomingData?.call) {
          presentIncomingCall(incomingData.call);
        }
      } catch (err) {
        // Silently ignore polling glitches
      }
    };

    // Check once on mount
    checkIncomingCall();

    // Smart check on AppState change (when user brings app to foreground)
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkIncomingCall();
      }
    });

    // Relaxed fallback interval (15 seconds instead of aggressive 3s spam)
    const interval = setInterval(checkIncomingCall, 15000);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [segments]);

  return null;
}
