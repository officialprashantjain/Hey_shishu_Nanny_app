import { Audio } from 'expo-av';
import { registerCallMediaCleanup } from './callMedia';

let activeSound = null;
let isPlaying = false;
let playRequestId = 0;

export async function startRingtone() {
  const currentReq = ++playRequestId;
  if (isPlaying && activeSound) return;
  isPlaying = true;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    if (activeSound) {
      try {
        await activeSound.stopAsync();
        await activeSound.unloadAsync();
      } catch (_) {}
      activeSound = null;
    }

    if (!isPlaying || currentReq !== playRequestId) return;

    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/ringtone.mp3'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      }
    );

    if (!isPlaying || currentReq !== playRequestId) {
      await sound.stopAsync();
      await sound.unloadAsync();
      return;
    }

    activeSound = sound;
  } catch (error) {
    console.warn('[callRingtone] Failed to start ringtone:', error.message);
    isPlaying = false;
  }
}

export async function stopRingtone() {
  playRequestId++;
  isPlaying = false;
  if (activeSound) {
    const sound = activeSound;
    activeSound = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (_) {}
  }
}

// Auto cleanup when Agora prepares media
registerCallMediaCleanup(stopRingtone);
