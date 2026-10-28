import { AppState, Platform, Alert, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { prepareCallMedia } from '../utils/callMedia';
import { requestCallPermissions } from '../utils/callPermissions';
import { startRingtone, stopRingtone } from '../utils/callRingtone';
import callService from './callService';
import { finishNativeCall, showOngoingCall, subscribeCalls } from './nativeCallService';
import api from './api';
import { useState, useEffect } from 'react';

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const agoraModule = isExpoGo
  ? require('../utils/agora-mock')
  : require('react-native-agora');

const {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} = agoraModule;

class CallSessionManager {
  constructor() {
    this.currentCall = null;
    this.listeners = new Set();
    this.agoraEngine = null;
    this.durationInterval = null;
    this.statusPollInterval = null;
    this.nativeUnsubscribe = null;
    this.appStateSubscription = null;
    this.isEnding = false;
    this.setupStarted = false;
    this.lastSummary = null;
  }

  getState() {
    return this.currentCall ? { ...this.currentCall } : null;
  }

  getLastSummary() {
    return this.lastSummary;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.warn('[CallSessionManager] Listener error:', err);
      }
    });
  }

  getCallParams() {
    if (!this.currentCall) return {};
    return {
      callId: this.currentCall.callId,
      uuid: this.currentCall.uuid,
      channelName: this.currentCall.channelName,
      token: this.currentCall.token,
      agoraAppId: this.currentCall.agoraAppId,
      uid: String(this.currentCall.uid),
      callType: this.currentCall.callType,
      mode: this.currentCall.mode,
      remoteName: this.currentCall.remoteName,
      remotePhoto: this.currentCall.remotePhoto || '',
      remoteUserId: this.currentCall.remoteUserId || '',
      bookingId: this.currentCall.bookingId || '',
      conversationId: this.currentCall.conversationId || '',
      receiverRole: this.currentCall.receiverRole || '',
      startedAt: this.currentCall.connectedAt ? new Date(this.currentCall.connectedAt).toISOString() : '',
    };
  }

  getCallData() {
    if (!this.currentCall) return {};
    return {
      callId: this.currentCall.callId,
      uuid: this.currentCall.uuid,
      channelName: this.currentCall.channelName,
      token: this.currentCall.token,
      agoraAppId: this.currentCall.agoraAppId,
      uid: this.currentCall.uid,
      callType: this.currentCall.callType,
      mode: this.currentCall.mode,
      remoteName: this.currentCall.remoteName,
      remotePhoto: this.currentCall.remotePhoto || '',
    };
  }

  async startOrAttachCall(params) {
    if (this.currentCall && this.currentCall.callId === params.callId) {
      this.attachScreen();
      return this.currentCall;
    }

    if (this.currentCall) {
      await this.endCall('superseded', false);
    }

    this.isEnding = false;
    this.setupStarted = false;
    const callType = params.callType === 'audio' ? 'audio' : 'video';
    const mode = params.mode || 'outgoing';
    const numericUid = Number(params.uid);
    const restoredStartedAt = params.startedAt ? new Date(params.startedAt).getTime() : null;

    this.currentCall = {
      callId: params.callId,
      uuid: params.uuid,
      channelName: params.channelName,
      token: params.token,
      agoraAppId: params.agoraAppId,
      uid: numericUid,
      callType,
      mode,
      remoteName: params.remoteName || (mode === 'outgoing' ? 'Parent' : 'Nanny'),
      remotePhoto: params.remotePhoto || '',
      remoteUserId: params.remoteUserId || params.receiverId || params.callerId || params.parentId || null,
      bookingId: params.bookingId || null,
      conversationId: params.conversationId || null,
      receiverRole: params.receiverRole || null,
      isJoined: false,
      remoteUid: null,
      callConnected: Boolean(restoredStartedAt),
      connectedAt: restoredStartedAt,
      callDuration: restoredStartedAt ? Math.max(0, Math.floor((Date.now() - restoredStartedAt) / 1000)) : 0,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: callType === 'video',
      callStatusMessage: mode === 'outgoing' ? 'Ringing…' : 'Connecting…',
      isMinimized: false,
      isScreenAttached: true,
    };

    NativeModules.ShishuCallPermissions?.setCallScreenVisible(true);

    if (mode === 'outgoing' && !this.currentCall.connectedAt) {
      startRingtone();
    }

    this.notify();
    await this.setupEngine();
    this.startTimersAndListeners();

    return this.currentCall;
  }

  async setupEngine() {
    if (this.setupStarted || !this.currentCall || this.isEnding) return;
    this.setupStarted = true;

    try {
      if (isExpoGo) {
        throw new Error('Calls require an Android or iOS development/release build.');
      }
      const call = this.currentCall;
      if (!call.callId || !call.uuid || !call.channelName || !call.token || !call.agoraAppId || !call.uid) {
        throw new Error('Missing call session credentials.');
      }

      await prepareCallMedia();
      await requestCallPermissions(call.callType);

      if (!this.currentCall || this.isEnding) return;

      const engine = createAgoraRtcEngine();
      this.agoraEngine = engine;
      const initialized = engine.initialize({ appId: call.agoraAppId });
      if (initialized < 0) throw new Error(`Could not initialize call engine (${initialized}).`);

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          if (this.currentCall && !this.isEnding) {
            this.currentCall.isJoined = true;
            if (this.currentCall.callType === 'video' && !this.currentCall.isCameraOff) {
              this.agoraEngine?.enableLocalVideo(true);
              this.agoraEngine?.startPreview?.();
              this.agoraEngine?.updateChannelMediaOptions?.({ publishCameraTrack: true });
            }
            this.notify();
          }
        },
        onUserJoined: (_connection, uid) => {
          if (!this.currentCall || this.isEnding) return;
          stopRingtone();
          this.currentCall.connectedAt = this.currentCall.connectedAt || Date.now();
          this.currentCall.remoteUid = uid;
          this.currentCall.callConnected = true;
          this.currentCall.callStatusMessage = 'Call active';
          showOngoingCall(this.getCallData(), this.currentCall.connectedAt).catch((error) =>
            console.warn('[Call] Ongoing notification:', error.message)
          );
          this.notify();
        },
        onUserOffline: () => {
          if (!this.isEnding) {
            this.endCall('receiver_hangup');
          }
        },
        onConnectionStateChanged: (_connection, state) => {
          if (!this.currentCall || this.isEnding) return;
          if (state === 4) {
            this.currentCall.callStatusMessage = 'Reconnecting…';
            this.notify();
          }
          if (state === 5) {
            this.endCall('error');
          }
        },
        onTokenPrivilegeWillExpire: () => this.refreshRtcToken(),
        onRequestToken: () => this.refreshRtcToken(),
        onError: (code) => {
          console.warn('[Call] Agora error:', code);
          if ([101, 110].includes(code)) this.endCall('error');
        },
      });

      engine.enableAudio();
      if (call.callType === 'video') {
        engine.enableVideo();
        engine.enableLocalVideo(!this.currentCall.isCameraOff);
        if (!this.currentCall.isCameraOff) {
          engine.startPreview?.();
        }
      }
      engine.setDefaultAudioRouteToSpeakerphone?.(call.callType === 'video');

      try {
        engine.leaveChannel();
      } catch (_) {}

      const result = engine.joinChannel(call.token, call.channelName, call.uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: call.callType === 'video' && !this.currentCall.isCameraOff,
        autoSubscribeAudio: true,
        autoSubscribeVideo: call.callType === 'video',
      });
      if (result < 0 && result !== -17) {
        throw new Error(`Could not join the call (${result}).`);
      }

      if (Platform.OS === 'android' && AppState.currentState === 'active') {
        await showOngoingCall(this.getCallData(), null);
      }
    } catch (error) {
      if (!this.isEnding) {
        Alert.alert('Call error', error.message);
        await this.endCall('error');
      }
    }
  }

  startTimersAndListeners() {
    this.cleanupTimersAndListeners();

    this.durationInterval = setInterval(() => {
      if (this.currentCall?.connectedAt && !this.isEnding) {
        const nextDuration = Math.max(0, Math.floor((Date.now() - this.currentCall.connectedAt) / 1000));
        if (this.currentCall.callDuration !== nextDuration) {
          this.currentCall.callDuration = nextDuration;
          this.notify();
        }
      }
    }, 1000);

    const checkStatus = async () => {
      if (!this.currentCall?.callId || this.isEnding) return;
      try {
        const response = await callService.getCallStatus(this.currentCall.callId);
        const data = response.data;
        if (!['ringing', 'accepted'].includes(data.status)) {
          await this.endCall('receiver_hangup', false);
          return;
        }
        if (data.status === 'accepted' && !this.currentCall.connectedAt) {
          this.currentCall.callStatusMessage = 'Connecting…';
          if (data.startedAt && Date.now() - new Date(data.startedAt).getTime() > 30000) {
            await this.endCall('error');
            return;
          }
          this.notify();
        }
      } catch (error) {
        if ([403, 404].includes(error.response?.status)) {
          await this.endCall('error', false);
        }
      }
    };
    this.statusPollInterval = setInterval(checkStatus, 2500);

    this.nativeUnsubscribe = subscribeCalls((event) => {
      if (!this.currentCall) return;
      if (event.action === 'audioActive') {
        this.agoraEngine?.enableAudio();
        this.agoraEngine?.setEnableSpeakerphone?.(this.currentCall.isSpeakerOn);
      }
      if (event.action === 'mute' && event.data?.uuid?.toLowerCase() === this.currentCall.uuid?.toLowerCase()) {
        this.currentCall.isMuted = event.data.muted;
        this.agoraEngine?.muteLocalAudioStream(event.data.muted);
        this.notify();
      }
      if (event.action === 'ended' && event.data?.callId === this.currentCall.callId) {
        this.endCall('receiver_hangup', false);
      }
    });

    this.appStateSubscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        checkStatus();
      }
      if (this.currentCall?.callType === 'video' && this.agoraEngine) {
        const enabled = state === 'active' && !this.currentCall.isCameraOff;
        this.agoraEngine.enableLocalVideo(enabled);
        if (enabled) {
          this.agoraEngine.startPreview?.();
        }
        this.agoraEngine.updateChannelMediaOptions?.({ publishCameraTrack: enabled });
      }
    });
  }

  cleanupTimersAndListeners() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
    if (this.nativeUnsubscribe) {
      this.nativeUnsubscribe();
      this.nativeUnsubscribe = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  async refreshRtcToken() {
    if (!this.currentCall?.callId) return;
    try {
      const response = await api.post(`/calls/${this.currentCall.callId}/token`);
      this.agoraEngine?.renewToken(response.data.token);
    } catch (error) {
      if (this.currentCall) {
        this.currentCall.callStatusMessage = 'Reconnecting…';
        this.notify();
      }
      console.warn('[Call] RTC token renewal:', error.response?.status || error.code);
    }
  }

  minimizeCall() {
    if (!this.currentCall) return;
    this.currentCall.isMinimized = true;
    this.currentCall.isScreenAttached = false;
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(false);

    if (this.currentCall.callType === 'video' && this.agoraEngine) {
      this.agoraEngine.enableLocalVideo(false);
      this.agoraEngine.updateChannelMediaOptions?.({ publishCameraTrack: false });
    }

    this.notify();
  }

  maximizeCall(router) {
    if (!this.currentCall) return;
    this.currentCall.isMinimized = false;
    this.currentCall.isScreenAttached = true;
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(true);

    if (this.currentCall.callType === 'video' && this.agoraEngine && !this.currentCall.isCameraOff) {
      this.agoraEngine.enableLocalVideo(true);
      this.agoraEngine.startPreview?.();
      this.agoraEngine.updateChannelMediaOptions?.({ publishCameraTrack: true });
    }

    this.notify();

    if (router) {
      router.push({
        pathname: '/(main)/messages/active_call',
        params: this.getCallParams(),
      });
    }
  }

  attachScreen() {
    if (!this.currentCall) return;
    this.currentCall.isScreenAttached = true;
    this.currentCall.isMinimized = false;
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(true);

    if (this.currentCall.callType === 'video' && this.agoraEngine && !this.currentCall.isCameraOff) {
      this.agoraEngine.enableLocalVideo(true);
      this.agoraEngine.startPreview?.();
      this.agoraEngine.updateChannelMediaOptions?.({ publishCameraTrack: true });
    }

    this.notify();
  }

  detachScreen() {
    if (!this.currentCall) return;
    this.currentCall.isScreenAttached = false;
    this.currentCall.isMinimized = true;
    NativeModules.ShishuCallPermissions?.setCallScreenVisible(false);

    if (this.currentCall.callType === 'video' && this.agoraEngine) {
      this.agoraEngine.enableLocalVideo(false);
      this.agoraEngine.updateChannelMediaOptions?.({ publishCameraTrack: false });
    }

    this.notify();
  }

  toggleMute() {
    if (!this.currentCall) return;
    const next = !this.currentCall.isMuted;
    this.currentCall.isMuted = next;
    this.agoraEngine?.muteLocalAudioStream(next);
    this.notify();
  }

  toggleSpeaker() {
    if (!this.currentCall) return;
    const next = !this.currentCall.isSpeakerOn;
    this.currentCall.isSpeakerOn = next;
    this.agoraEngine?.setEnableSpeakerphone(next);
    this.notify();
  }

  async toggleCamera() {
    if (!this.currentCall || this.currentCall.callType !== 'video') return;
    const next = !this.currentCall.isCameraOff;
    if (!next) {
      try {
        await requestCallPermissions('video');
      } catch (error) {
        Alert.alert('Camera access', error.message);
        return;
      }
    }
    this.currentCall.isCameraOff = next;
    this.agoraEngine?.enableLocalVideo(!next);
    if (!next) {
      this.agoraEngine?.startPreview?.();
    }
    this.agoraEngine?.updateChannelMediaOptions?.({ publishCameraTrack: !next });
    this.notify();
  }

  flipCamera() {
    if (this.currentCall?.callType === 'video') {
      this.agoraEngine?.switchCamera();
    }
  }

  async endCall(reason = 'caller_hangup', notifyServer = true) {
    stopRingtone();
    if (this.isEnding) return;
    this.isEnding = true;

    const call = this.currentCall;
    if (!call) return;

    this.lastSummary = {
      callId: call.callId,
      duration: call.callDuration || 0,
      remoteName: call.remoteName,
      remotePhoto: call.remotePhoto,
      remoteUserId: call.remoteUserId,
      bookingId: call.bookingId,
      conversationId: call.conversationId,
      receiverRole: call.receiverRole,
    };

    const callId = call.callId;
    const uuid = call.uuid;

    const endRequest = notifyServer && callId
      ? callService.endCall(callId, reason).catch((error) => {
          console.warn('[Call] End request:', error.response?.status || error.code);
        })
      : null;

    const engine = this.agoraEngine;
    this.agoraEngine = null;
    this.setupStarted = false;
    try {
      engine?.stopPreview?.();
      engine?.leaveChannel?.();
      engine?.release?.();
    } catch (error) {
      console.warn('[Call] Agora cleanup:', error.message);
    }

    this.cleanupTimersAndListeners();

    try {
      await finishNativeCall(callId, uuid);
    } catch (error) {
      console.warn('[Call] Native cleanup:', error.message);
    }

    this.currentCall = null;
    this.notify();

    await endRequest;
  }
}

export const callSessionManager = new CallSessionManager();

export function useCallSession() {
  const [session, setSession] = useState(() => callSessionManager.getState());
  useEffect(() => {
    return callSessionManager.subscribe((next) => {
      setSession(next ? { ...next } : null);
    });
  }, []);
  return session;
}

export default callSessionManager;
