import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import callService from '../../services/callService';
import { registerCallNotifications, subscribeCalls, consumeInitialCallAction, getPendingCall, showIncomingCall, finishNativeCall } from '../../services/nativeCallService';

export default function IncomingCallWatcher() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const lastPresentation = useRef(null);
  useEffect(() => {
    let alive = true;
    let cleanupTokens;
    let registering = false;
    let registered = false;
    let presenting = false;
    const present = async (event) => {
      if (!alive || !event?.data?.callId) return;
      if (event.action === 'active' && event.data?.mode === 'outgoing') return; // Handled directly by callLauncher
      if (!['incoming', 'answer', 'active'].includes(event.action)) return;
      if (Platform.OS !== 'android' && AppState.currentState !== 'active' && event.action === 'incoming') return;
      const onCall = segmentsRef.current.some((segment) => ['incoming_call', 'active_call'].includes(segment));
      const key = `${event.data.callId}:${event.action}`;
      if (presenting || onCall || lastPresentation.current === key) return;
      presenting = true;
      try {
        const status = await callService.getCallStatus(event.data.callId);
        if (!['ringing', 'accepted'].includes(status.data.status)) {
          await finishNativeCall(event.data.callId, event.data.uuid);
          return;
        }
        if (!alive) return;
        lastPresentation.current = key;
        if (event.action === 'active') {
          routerRef.current?.push({ pathname: '/(main)/messages/active_call', params: event.data });
        } else {
          routerRef.current?.push({ pathname: '/(main)/messages/incoming_call', params: {
            ...event.data, autoAnswer: event.action === 'answer' ? 'true' : 'false',
          } });
        }
      } catch (error) {
        console.warn('[Incoming call] Presentation deferred:', error.response?.status || error.code || 'network');
      } finally { presenting = false; }
    };
    const register = async () => {
      if (registering || registered || !alive) return;
      registering = true;
      try {
        const cleanup = await registerCallNotifications();
        if (alive) { cleanupTokens = cleanup; registered = true; } else cleanup?.();
      } catch (error) { console.warn('[Call push] Registration deferred:', error.message); }
      finally { registering = false; }
    };
    const checkLocal = async () => {
      try {
        await present(await getPendingCall());
        if (AppState.currentState !== 'active') return;
        register();
      } catch (error) { console.warn('[Incoming call] Local check deferred:', error.message); }
    };
    const unsubscribe = subscribeCalls(present);
    register();
    consumeInitialCallAction().then(present).catch((error) => console.warn('[Call push] Initial action:', error.message));
    checkLocal();
    const stateSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') checkLocal(); });
    return () => { alive = false; cleanupTokens?.(); unsubscribe(); stateSubscription.remove(); };
  }, []);
  return null;
}
