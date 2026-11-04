import React, { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Alert, Linking, Platform, AppState, NativeModules } from 'react-native';
import api from './api';
import socketService from './socketService';
import { stopSafetyForeground } from './nativeCallService';
import { getSession } from '../utils/storage';

let notifee, AndroidImportance, AndroidForegroundServiceType;
if (Platform.OS === 'android') {
  try {
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default || notifeeModule;
    AndroidImportance = notifeeModule.AndroidImportance;
    AndroidForegroundServiceType = notifeeModule.AndroidForegroundServiceType;
  } catch (err) {
    console.warn('[AudioHeartbeat] Notifee module not available:', err?.message);
  }
}

class AudioHeartbeatService {
  constructor() {
    this.activeShiftId = null;
    this.countdownTimerId = null;
    this.sampleTimerId = null;
    this.recording = null;
    this.isRecordingActive = false;
    this.recordingSecondsElapsed = 0;
    this.subscribers = new Set();
    this.onStateChangeCallback = null;
    this.config = {
      enabled: true,
      intervalMins: 5,  // Dynamic admin setting (fallback: 5 mins)
      durationSecs: 30, // Dynamic admin setting (fallback: 30 secs)
      parentAccess: true,
      retentionDays: 14,
    };
    this.nextSampleTimestamp = null;
    this.sampleCount = 0;
    this.shouldAbortCurrentSample = false;
    this.currentTriggerType = null;
    this._boundHandleInstantCommand = this.handleInstantAudioCommand.bind(this);
    this.currentState = {
      status: 'idle',
      isRecording: false,
      secondsElapsed: 0,
      totalDurationSecs: 30,
      intervalMins: 5,
      remainingSecs: 0,
    };

    // Immediately fetch dynamic config from Admin backend
    this.fetchConfig();

    // Listen to AppState transitions: if app was backgrounded/device slept and sample is due, execute immediately
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (this.activeShiftId && this.config.enabled && !this.isRecordingActive) {
          if (this.nextSampleTimestamp && Date.now() >= this.nextSampleTimestamp) {
            console.log('[AudioHeartbeat] 📱 App foregrounded & periodic check-in due. Running cycle now.');
            this.runHeartbeatCycle();
          }
        }
      }
    });
  }

  /**
   * High-reliability OS background sleep.
   * If running on native Android, uses ShishuCallPermissions.sleep() which runs on the OS Looper
   * and is completely immune to Choreographer pauses when screen is locked or app is in background.
   * Falls back to standard JS setTimeout if native module is unavailable.
   */
  async _backgroundSleep(ms) {
    if (Platform.OS === 'android' && NativeModules?.ShishuCallPermissions?.sleep) {
      try {
        await NativeModules.ShishuCallPermissions.sleep(ms);
        return;
      } catch (_) {}
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Acquire a partial CPU WakeLock to keep CPU awake during active audio recording
   */
  async _acquireWakeLock(timeoutMs) {
    if (Platform.OS === 'android' && NativeModules?.ShishuCallPermissions?.acquireWakeLock) {
      try {
        await NativeModules.ShishuCallPermissions.acquireWakeLock(timeoutMs);
      } catch (_) {}
    }
  }

  /**
   * Release CPU WakeLock
   */
  async _releaseWakeLock() {
    if (Platform.OS === 'android' && NativeModules?.ShishuCallPermissions?.releaseWakeLock) {
      try {
        await NativeModules.ShishuCallPermissions.releaseWakeLock();
      } catch (_) {}
    }
  }

  /**
   * Subscribe to live heartbeat state changes (multi-subscriber support)
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
      // Call immediately with latest state
      callback(this.currentState);
      return () => {
        this.subscribers.delete(callback);
      };
    }
    return () => {};
  }

  /**
   * Fetch latest heartbeat configuration from backend
   */
  async fetchConfig() {
    try {
      const res = await api.get('/session-audio/config');
      const d = res?.data?.enabled !== undefined ? res.data : (res?.data?.data || res?.data || res);
      if (d) {
        this.config = {
          enabled: d.enabled !== undefined ? Boolean(d.enabled) : true,
          intervalMins: Number(d.intervalMins) > 0 ? Number(d.intervalMins) : 5,
          durationSecs: Number(d.durationSecs) > 0 ? Number(d.durationSecs) : 30,
          parentAccess: d.parentAccess !== undefined ? Boolean(d.parentAccess) : true,
          retentionDays: Number(d.retentionDays) > 0 ? Number(d.retentionDays) : 14,
          onDemandDurationSecs: Number(d.onDemandDurationSecs) > 0 ? Number(d.onDemandDurationSecs) : 30,
        };
        console.log('[AudioHeartbeat] Dynamic Admin Config applied from DB:', this.config);
        this._emitState(this.isRecordingActive ? 'recording' : 'idle');
      }
    } catch (err) {
      console.warn('[AudioHeartbeat] Using fallback config:', err?.message);
    }
    return this.config;
  }

  /**
   * Request microphone permissions from the device OS
   */
  async requestPermissions() {
    try {
      let perm = await Audio.getPermissionsAsync();
      if (perm.status === 'granted') {
        return true;
      }

      perm = await Audio.requestPermissionsAsync();
      if (perm.status === 'granted') {
        return true;
      }

      if (!perm.canAskAgain) {
        Alert.alert(
          'Microphone Permission Required',
          'HeyShishu Nanny App needs microphone access for session safety check-ins. Please enable Microphone in your phone Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return false;
    } catch (err) {
      console.warn('[AudioHeartbeat] Permission error:', err);
      return false;
    }
  }

  /**
   * Ensure safety notification channel exists on Android
   */
  async ensureSafetyChannel() {
    if (Platform.OS !== 'android' || !notifee) return null;
    try {
      const channelId = 'nanny_safety_audio_channel';
      await notifee.createChannel({
        id: channelId,
        name: 'HeyShishu Safety Monitor',
        importance: AndroidImportance?.LOW || 2,
        vibration: false,
        sound: undefined,
      });
      return channelId;
    } catch (err) {
      console.warn('[AudioHeartbeat] Error creating notification channel:', err?.message);
      return null;
    }
  }

  /**
   * Start or update Foreground Service Notification on Android
   * Keeps the app process alive and grants Android mic background privileges
   * when Nanny minimizes app, opens WhatsApp/Gallery, or locks screen.
   */
  async updateForegroundNotification(isRecordingNow = false) {
    if (Platform.OS !== 'android' || !notifee) return;
    try {
      const channelId = await this.ensureSafetyChannel();
      if (!channelId) return;

      const title = isRecordingNow
        ? '🎙️ HeyShishu Safety: Recording Check-in...'
        : '🛡️ HeyShishu Child Safety Active';

      const body = isRecordingNow
        ? 'Capturing ambient audio check-in snippet for child safety'
        : 'Session safety audio monitoring is active in background';

      await notifee.displayNotification({
        id: 'nanny_safety_fg_service',
        title,
        body,
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          autoCancel: false,
          foregroundServiceTypes: [
            AndroidForegroundServiceType?.FOREGROUND_SERVICE_TYPE_MICROPHONE || 128,
          ],
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (err) {
      console.warn('[AudioHeartbeat] Foreground notification error:', err?.message);
    }
  }

  /**
   * Stop Foreground Service Notification
   */
  async stopForegroundNotification() {
    if (Platform.OS !== 'android' || !notifee) return;
    try {
      stopSafetyForeground();
      await notifee.cancelNotification('nanny_safety_fg_service');
      await notifee.stopForegroundService();
    } catch (err) {
      console.warn('[AudioHeartbeat] Error stopping foreground notification:', err?.message);
    }
  }

  /**
   * Configure audio mode.
   * When forRecording=true: activates hardware mic session.
   * When forRecording=false: explicitly releases hardware mic session so the device OS green indicator turns off.
   */
  async configureAudioMode(forRecording = false) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: forRecording,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.warn('[AudioHeartbeat] AudioMode error:', err);
    }
  }

  /**
   * Record a single periodic or on-demand audio heartbeat snippet.
   * Activates hardware mic for exact durationSecs (e.g. 30s), then stops and immediately releases the hardware mic.
   * Supports clean pre-emption if an on-demand parent request interrupts an active periodic clip.
   */
  async recordSample(durationSecs, triggerType = 'periodic') {
    if (this.isRecordingActive) return null;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('[AudioHeartbeat] ❌ Mic permission not granted');
      return null;
    }

    this.shouldAbortCurrentSample = false;

    // 1. Promote notification to Recording Foreground Service with MICROPHONE service type
    await this.updateForegroundNotification(true);

    // 2. Activate hardware mic audio mode
    await this.configureAudioMode(true);

    // 3. Acquire native CPU wake lock to ensure uninterrupted recording in background/sleep
    await this._acquireWakeLock((durationSecs + 10) * 1000);

    try {
      this.isRecordingActive = true;
      this.currentTriggerType = triggerType;
      this.recordingSecondsElapsed = 0;
      console.log(`[AudioHeartbeat] 🎙️ Recording safety clip NOW (${triggerType}, duration: ${durationSecs}s)...`);

      // Emit recording state immediately so top banner appears
      this._emitState('recording', {
        isRecording: true,
        secondsElapsed: 0,
        totalDurationSecs: durationSecs,
        triggerType,
      });

      const recordingPreset = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 24000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 24000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      };

      const { recording } = await Audio.Recording.createAsync(recordingPreset);
      this.recording = recording;

      // 4. Background-Resilient Wall-Clock Wait Loop:
      // Uses _backgroundSleep which runs on native Android Looper Handler so it is never
      // suspended by Choreographer frame throttling when app is backgrounded or screen is locked.
      const targetEndTimestamp = Date.now() + durationSecs * 1000;
      while (Date.now() < targetEndTimestamp && this.isRecordingActive) {
        // Pre-emption check: Stop early if an on-demand command arrived
        if (this.shouldAbortCurrentSample) {
          console.log('[AudioHeartbeat] ⚡ Sample pre-empted early to service instant parent request!');
          break;
        }

        const remainingMs = targetEndTimestamp - Date.now();
        const stepMs = Math.min(1000, Math.max(100, remainingMs));
        await this._backgroundSleep(stepMs);
        this.recordingSecondsElapsed = Math.min(
          durationSecs,
          Math.round((Date.now() - (targetEndTimestamp - durationSecs * 1000)) / 1000)
        );
        this._emitState('recording', {
          isRecording: true,
          secondsElapsed: this.recordingSecondsElapsed,
          totalDurationSecs: durationSecs,
          triggerType,
        });
      }

      // 5. Stop and unload recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('[AudioHeartbeat] ✅ Recording completed for sample duration, URI:', uri);
      this.recording = null;
      this.isRecordingActive = false;
      this.currentTriggerType = null;
      this.shouldAbortCurrentSample = false;
      const actualDuration = Math.max(1, this.recordingSecondsElapsed);
      this.recordingSecondsElapsed = 0;

      // ── 6. RELEASE HARDWARE MICROPHONE ──
      // Explicitly turn off allowsRecordingIOS. This instructs Android/iOS to release the physical mic,
      // which automatically turns OFF the native green microphone indicator in the device status bar.
      await this.configureAudioMode(false);

      // ── 7. RELEASE CPU WAKELOCK ──
      await this._releaseWakeLock();

      // Return notification to Idle Monitor mode
      await this.updateForegroundNotification(false);

      // Emit idle state so the app top banner automatically hides
      this._emitState('idle', {
        isRecording: false,
        secondsElapsed: 0,
      });

      return { uri, duration: actualDuration, triggerType };
    } catch (err) {
      console.error('[AudioHeartbeat] ❌ Error during recording:', err);
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (_) {}
        this.recording = null;
      }
      this.isRecordingActive = false;
      this.currentTriggerType = null;
      this.shouldAbortCurrentSample = false;
      this.recordingSecondsElapsed = 0;
      await this.configureAudioMode(false);
      await this._releaseWakeLock();
      await this.updateForegroundNotification(false);
      this._emitState('idle', { isRecording: false, secondsElapsed: 0 });
      return null;
    }
  }

  /**
   * Upload recorded audio sample to backend / S3 with triggerType
   */
  async uploadSample(fileUri, durationSecs, triggerType = 'periodic') {
    if (!fileUri || !this.activeShiftId) return false;

    try {
      this._emitState('uploading', { isRecording: false });
      this.sampleCount += 1;
      console.log(`[AudioHeartbeat] 📤 Uploading sample #${this.sampleCount} (${triggerType}) for session ${this.activeShiftId}...`);

      const formData = new FormData();
      formData.append('sampleIndex', String(this.sampleCount));
      formData.append('durationSecs', String(durationSecs));
      formData.append('recordedAt', new Date().toISOString());
      formData.append('triggerType', triggerType);

      const fileName = `heartbeat_${this.activeShiftId}_${Date.now()}.m4a`;
      formData.append('audio', {
        uri: fileUri,
        name: fileName,
        type: 'audio/m4a',
      });

      await api.post(`/session-audio/sessions/${this.activeShiftId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });

      console.log(`[AudioHeartbeat] ✅ Sample #${this.sampleCount} (${triggerType}) uploaded successfully to backend!`);

      // Cleanup local temp file to keep device storage at 0
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (_) {}

      this._emitState('idle', { isRecording: false });
      return true;
    } catch (err) {
      console.error('[AudioHeartbeat] ❌ Upload failed:', err?.response?.data || err?.message);
      this._emitState('idle', { isRecording: false });
      return false;
    }
  }

  /**
   * Handle on-demand instant recording command triggered by parent via Socket.IO
   */
  async handleInstantAudioCommand(payload) {
    if (!this.activeShiftId) {
      console.warn('⚠️ [AudioHeartbeat] Instant command ignored: No active shift on this device.');
      return;
    }

    // ── RE-ENTRANCY LOCK: If an on-demand recording is ALREADY in progress, ignore duplicate command ──
    if (this.isRecordingActive && this.currentTriggerType === 'on_demand') {
      console.log('⚡ [AudioHeartbeat] On-demand recording is ALREADY active. Ignoring duplicate instant command.');
      return;
    }

    console.log('⚡ [AudioHeartbeat] Instant live audio request received from parent:', payload);

    // Immediately pause periodic countdown so periodic loop does not race with instant recording
    this.nextSampleTimestamp = null;

    const duration = Number(payload?.durationSecs) || this.config.onDemandDurationSecs || 30;

    // 1. Pre-emption: If any recording is currently running, stop it to prioritize parent on-demand request
    if (this.isRecordingActive) {
      console.log('⚡ [AudioHeartbeat] Active recording in progress! Pre-empting to prioritize parent on-demand request...');
      this.shouldAbortCurrentSample = true;
      let retries = 0;
      while (this.isRecordingActive && retries < 30) {
        await this._backgroundSleep(100);
        retries++;
      }
      this.isRecordingActive = false;
      this.shouldAbortCurrentSample = false;
      // Small buffer to allow OS audio hardware to fully release
      await this._backgroundSleep(300);
    }

    // 2. Start fresh on-demand recording specifically for parent
    try {
      this.currentTriggerType = 'on_demand';

      // Notify parent app via socket that nanny mic is recording NOW
      socketService.emit('session:instant_audio_started', {
        bookingId: this.activeShiftId,
        durationSecs: duration,
      });

      console.log(`🎙️ [AudioHeartbeat] Recording fresh on-demand clip for parent (${duration}s)...`);
      const res = await this.recordSample(duration, 'on_demand');
      if (res?.uri) {
        await this.uploadSample(res.uri, res.duration || duration, 'on_demand');
      }

      // Reset the next periodic countdown starting from now
      const intervalMs = (this.config.intervalMins || 1) * 60 * 1000;
      this.nextSampleTimestamp = Date.now() + intervalMs;
      console.log(`[AudioHeartbeat] ⏰ Next periodic sample rescheduled in ${this.config.intervalMins || 1} minutes`);
    } catch (err) {
      console.error('[AudioHeartbeat] Error during on-demand recording:', err);
    } finally {
      this.currentTriggerType = null;
    }
  }

  /**
   * Execute one heartbeat cycle:
   * Record for sample duration (e.g. 30s) with mic ON, then release mic, upload, and schedule next cycle.
   */
  async runHeartbeatCycle() {
    if (!this.activeShiftId || !this.config.enabled || this.isRecordingActive) return;

    // Clear next timestamp immediately to prevent race conditions during countdown loop
    this.nextSampleTimestamp = null;

    const duration = this.config.durationSecs || 30;
    const res = await this.recordSample(duration, 'periodic');
    if (res?.uri) {
      await this.uploadSample(res.uri, res.duration || duration, 'periodic');
    }

    // Schedule next sample exactly intervalMins (e.g. 1 or 5 minutes) from right after this sample finishes
    const intervalMs = (this.config.intervalMins || 5) * 60 * 1000;
    this.nextSampleTimestamp = Date.now() + intervalMs;
    console.log(`[AudioHeartbeat] ⏰ Next sample scheduled in ${this.config.intervalMins || 5} minutes`);
  }

  /**
   * Start recurring countdown loop for future samples.
   * Runs setInterval for smooth UI updates when app is open, AND
   * starts a native-safe background loop that uses _backgroundSleep so cycles trigger
   * reliably even when the phone is locked or app is minimized.
   */
  startCountdownLoop() {
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.countdownTimerId = setInterval(() => {
      if (!this.nextSampleTimestamp) return;
      const remainingSecs = Math.max(0, Math.round((this.nextSampleTimestamp - Date.now()) / 1000));
      if (!this.isRecordingActive) {
        this._emitState('idle', { remainingSecs, isRecording: false });
      }

      // Time to record next sample (foreground trigger)
      if (remainingSecs <= 0 && !this.isRecordingActive) {
        this.runHeartbeatCycle();
      }
    }, 1000);

    // Continuous native-safe background monitor loop
    this.startBackgroundLoop();
  }

  /**
   * Continuous native-safe background monitor loop.
   * Runs _backgroundSleep(2000) on Android's native OS Looper Handler so periodic check-ins
   * trigger even when screen is locked or app is in deep sleep.
   */
  async startBackgroundLoop() {
    this.isBackgroundLoopActive = true;
    while (this.activeShiftId && this.config.enabled && this.isBackgroundLoopActive) {
      await this._backgroundSleep(2000);
      if (!this.activeShiftId || !this.config.enabled || !this.isBackgroundLoopActive) break;

      if (this.nextSampleTimestamp && Date.now() >= this.nextSampleTimestamp && !this.isRecordingActive) {
        console.log('[AudioHeartbeat] ⏰ Native OS background loop triggered periodic check-in!');
        await this.runHeartbeatCycle();
      }
    }
  }

  /**
   * Start periodic background heartbeat loop for an active session.
   * ✅ NO INITIAL DELAY: Starts the first recording INSTANTLY upon mic permission confirmation!
   */
  async start(shiftId, onStateChange) {
    if (onStateChange) {
      this.onStateChangeCallback = onStateChange;
    }

    if (this.activeShiftId === shiftId && (this.countdownTimerId || this.isRecordingActive)) {
      return;
    }

    this.activeShiftId = shiftId;
    console.log('[AudioHeartbeat] 🚀 Starting heartbeat service for session ID:', shiftId);

    await this.fetchConfig();
    if (!this.config.enabled) {
      this._emitState('disabled', { isRecording: false });
      return;
    }

    // Request permissions upfront
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) {
      console.warn('[AudioHeartbeat] ⚠️ Mic permission pending or denied.');
      this._emitState('permission_denied', { isRecording: false });
      return;
    }

    // ── Realtime Socket Listener for Instant On-Demand Parent Requests ──
    try {
      await socketService.connect();
      socketService.off('session:instant_audio_command', this._boundHandleInstantCommand);
      socketService.on('session:instant_audio_command', this._boundHandleInstantCommand);
    } catch (socketErr) {
      console.warn('[AudioHeartbeat] Socket connect warning:', socketErr?.message);
    }

    // Start foreground notification so Android preserves background timers
    await this.updateForegroundNotification(false);

    // ── Native Safety Monitor Service for onTaskRemoved() kill detection ──
    try {
      const session = await getSession();
      const token = session?.token || '';
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      if (Platform.OS === 'android' && NativeModules?.ShishuCallPermissions?.startSafetyMonitor) {
        await NativeModules.ShishuCallPermissions.startSafetyMonitor({
          bookingId: String(shiftId),
          shiftId: String(shiftId),
          token,
          apiBaseUrl,
        });
        console.log('[AudioHeartbeat] 🛡️ Native ShishuSafetyMonitorService registered successfully.');
      }

      // Notify backend that nanny app is active/resumed to resolve any previous closure alerts
      if (apiBaseUrl) {
        fetch(`${apiBaseUrl}/session-safety/nanny-app-resumed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: String(shiftId),
            shiftId: String(shiftId),
          }),
        }).catch(() => {});
      }
    } catch (monitorErr) {
      console.warn('[AudioHeartbeat] Failed to start native safety monitor:', monitorErr?.message);
    }

    // Start countdown timer loop for background monitoring
    this.startCountdownLoop();

    // ── INSTANT FIRST SAMPLE: Start recording IMMEDIATELY right after permission confirmation ──
    console.log('[AudioHeartbeat] 🎙️ Mic permission confirmed! Instantly recording first audio safety sample NOW...');
    this.runHeartbeatCycle();
  }

  /**
   * Trigger a manual recording sample on demand (e.g. when nanny taps recording widget)
   */
  async triggerManualSample() {
    if (this.isRecordingActive) return;
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) return;
    console.log('[AudioHeartbeat] 🎙️ Manual recording sample triggered on demand!');
    const duration = this.config.durationSecs || 30;
    const res = await this.recordSample(duration, 'manual_nanny');
    if (res?.uri) {
      await this.uploadSample(res.uri, res.duration || duration, 'manual_nanny');
    }
    const intervalMs = (this.config.intervalMins || 1) * 60 * 1000;
    this.nextSampleTimestamp = Date.now() + intervalMs;
  }

  /**
   * Stop the heartbeat loop when shift ends or nanny logs out
   */
  async stop() {
    console.log('[AudioHeartbeat] 🛑 Stopping heartbeat service');
    this.activeShiftId = null;
    this.nextSampleTimestamp = null;
    this.shouldAbortCurrentSample = false;

    // Detach socket listener
    try {
      socketService.off('session:instant_audio_command', this._boundHandleInstantCommand);
    } catch (_) {}

    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }

    if (this.sampleTimerId) {
      clearInterval(this.sampleTimerId);
      this.sampleTimerId = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (_) {}
      this.recording = null;
    }

    this.isRecordingActive = false;
    this.isBackgroundLoopActive = false;
    this.recordingSecondsElapsed = 0;
    await this.configureAudioMode(false);
    await this._releaseWakeLock();

    // Stop native safety monitor
    try {
      if (Platform.OS === 'android' && NativeModules?.ShishuCallPermissions?.stopSafetyMonitor) {
        await NativeModules.ShishuCallPermissions.stopSafetyMonitor();
        console.log('[AudioHeartbeat] 🛑 Native ShishuSafetyMonitorService stopped.');
      }
    } catch (_) {}

    await this.stopForegroundNotification();
    this._emitState('stopped', { isRecording: false, secondsElapsed: 0 });
  }

  _emitState(status, extra = {}) {
    this.currentState = {
      ...this.currentState,
      status,
      isRecording: this.isRecordingActive,
      intervalMins: this.config.intervalMins,
      durationSecs: this.config.durationSecs,
      ...extra,
    };

    // Notify all registered subscribers (e.g. top banner, service screen)
    for (const callback of this.subscribers) {
      try {
        callback(this.currentState);
      } catch (err) {
        console.warn('[AudioHeartbeat] Subscriber callback error:', err);
      }
    }

    if (typeof this.onStateChangeCallback === 'function') {
      try {
        this.onStateChangeCallback(this.currentState);
      } catch (_) {}
    }
  }
}

const audioHeartbeatService = new AudioHeartbeatService();

/**
 * Custom React Hook to subscribe to live recording state across any component or layout
 */
export function useAudioHeartbeat() {
  const [state, setState] = useState(audioHeartbeatService.currentState);
  useEffect(() => {
    return audioHeartbeatService.subscribe(setState);
  }, []);
  return state;
}

export default audioHeartbeatService;
