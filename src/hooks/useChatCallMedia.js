import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { registerCallMediaCleanup, releaseChatMedia } from '../utils/callMedia';

export default function useChatCallMedia(onStopped) {
  const media = useRef({ recording: null, sound: null, pendingRecording: null, cancelled: false, cleanup: null });
  const callback = useRef(onStopped);
  const alive = useRef(true);
  callback.current = onStopped;
  const stop = useCallback(() => {
    if (media.current.cleanup) return media.current.cleanup;
    media.current.cleanup = releaseChatMedia(media.current).finally(() => {
      if (alive.current) callback.current();
      media.current.cleanup = null;
    });
    return media.current.cleanup;
  }, []);
  useEffect(() => {
    alive.current = true;
    const unregister = registerCallMediaCleanup(stop);
    return () => { alive.current = false; unregister(); stop().catch(() => {}); };
  }, [stop]);
  useFocusEffect(useCallback(() => {
    media.current.cancelled = false;
    return () => { stop().catch((error) => console.warn('[Chat audio] Cleanup:', error.message)); };
  }, [stop]));
  return media;
}
