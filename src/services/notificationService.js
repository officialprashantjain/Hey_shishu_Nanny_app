import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import callService from './callService';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * Initialize push notifications, set up Android notification channels,
   * obtain the FCM device token, and register it with the HeyShishu backend.
   */
  registerForPushNotifications: async () => {
    try {
      // 1. Android notification channel configuration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('incoming_calls', {
          name: 'Incoming Calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#FF231F7C',
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      // 2. Request user notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ [FCM] Notification permissions not granted by user.');
        return null;
      }

      // 3. Obtain native device push token (FCM on Android, APNs on iOS)
      let deviceToken = null;
      try {
        const tokenRes = await Notifications.getDevicePushTokenAsync();
        deviceToken = tokenRes?.data;
      } catch (tokenErr) {
        // Fallback to Expo push token if native device token unavailable (e.g. simulator)
        try {
          const expoTokenRes = await Notifications.getExpoPushTokenAsync();
          deviceToken = expoTokenRes?.data;
        } catch (e) {}
      }

      if (!deviceToken) {
        console.log('[FCM] No push token generated on this device (simulator or missing Google Play).');
        return null;
      }

      console.log(`📱 [FCM Token Acquired]: ${deviceToken.substring(0, 25)}...`);

      // 4. Send token to backend to associate with this user account
      try {
        await callService.registerDeviceToken(deviceToken);
        console.log('✅ [FCM Token Registered with Backend]');
      } catch (regErr) {
        console.warn('⚠️ [FCM Token Registration Warning]:', regErr.message);
      }

      return deviceToken;
    } catch (err) {
      console.warn('[notificationService.registerForPushNotifications] error:', err.message);
      return null;
    }
  },

  /**
   * Attach listener to handle incoming calls from push notifications
   */
  setupCallNotificationListeners: (onIncomingCall) => {
    // 1. When a notification is received in foreground/background
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === 'CALL_INCOMING') {
        console.log(`\n🔔 [FCM PUSH] Incoming call notification received: ${data.callType?.toUpperCase()} from "${data.callerName}"`);
        if (typeof onIncomingCall === 'function') {
          onIncomingCall(data);
        }
      }
    });

    // 2. When user taps the notification banner or lock-screen action
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'CALL_INCOMING') {
        console.log(`\n👆 [FCM PUSH TAPPED] User tapped call notification from "${data.callerName}"`);
        if (typeof onIncomingCall === 'function') {
          onIncomingCall(data);
        }
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};

export default notificationService;
