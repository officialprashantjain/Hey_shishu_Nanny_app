import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, NativeModules } from 'react-native';
import { useDispatch } from 'react-redux';
import { restoreSession } from '../services/api';

export default function SessionBootstrap({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const restore = async () => {
    // Only a call screen may stay above the Android lock screen.
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(false);
    setFailed(false);
    try {
      const session = await restoreSession();
      dispatch({ type: session ? 'auth/sessionRestored' : 'auth/logout', payload: session });
      setReady(true);
    } catch (error) {
      // A temporarily unavailable keychain must never be treated as an explicit logout.
      console.warn('[Session] Secure storage unavailable:', error.message);
      setFailed(true);
    }
  };
  useEffect(() => { restore(); }, []);
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    {failed ? <Pressable onPress={restore}><Text>Could not restore your session. Tap to retry.</Text></Pressable> : <ActivityIndicator />}
  </View>;
  return children;
}
