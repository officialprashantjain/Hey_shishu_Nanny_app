const cleanups = new Set();
export function registerCallMediaCleanup(cleanup) {
  cleanups.add(cleanup);
  return () => cleanups.delete(cleanup);
}
export async function prepareCallMedia() {
  // Release voice-note microphones and playback before Agora takes audio ownership.
  await Promise.all([...cleanups].map((cleanup) => cleanup()));
}

export async function releaseChatMedia(media) {
  media.cancelled = true;
  // A note can still be acquiring or releasing its microphone when a call arrives.
  for (const key of ['pendingRecording', 'pendingRecordingStop']) {
    if (media[key]) { try { await media[key]; } catch (_) {} }
  }
  const recording = media.recording;
  const sound = media.sound;
  media.recording = null;
  media.sound = null;
  const results = await Promise.allSettled([recording?.stopAndUnloadAsync(), sound?.unloadAsync()]);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}
