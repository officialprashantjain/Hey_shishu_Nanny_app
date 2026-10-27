import { AppState, Platform, PermissionsAndroid } from 'react-native';
import { Camera } from 'expo-camera';

export async function requestCallPermissions(callType) {
  const needsCamera = callType === 'video' && AppState.currentState === 'active';
  if (Platform.OS === 'android') {
    const required = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (needsCamera) required.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    const result = await PermissionsAndroid.requestMultiple(required);
    if (required.some((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('Microphone and camera access are required. Enable them in app settings to join the call.');
    }
  } else if (Platform.OS === 'ios') {
    const microphone = await Camera.requestMicrophonePermissionsAsync();
    if (!microphone.granted) throw new Error('Microphone access is required to join the call.');
    if (needsCamera) {
      const camera = await Camera.requestCameraPermissionsAsync();
      if (!camera.granted) throw new Error('Camera access is required for a video call.');
    }
  }
}
