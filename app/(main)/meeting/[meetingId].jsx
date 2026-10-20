import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import meetingService from '../../../src/services/meetingService';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

// Detect whether we are running in Expo Go (which cannot load native C++ react-native-agora modules)
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.executionEnvironment === 'expo';

let createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
  RenderModeType;

if (isExpoGo) {
  ({
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    RtcTextureView,
    VideoSourceType,
    RenderModeType,
  } = require('../../../src/utils/agora-mock'));
} else {
  ({
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    RtcSurfaceView,
    RtcTextureView,
    VideoSourceType,
    RenderModeType,
  } = require('react-native-agora'));
}

const AgoraVideoView = Platform.OS === 'android' ? (RtcTextureView || RtcSurfaceView) : RtcSurfaceView;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Calculate expected Counselor Agora UID: 100000000 + (parseInt(last6Hex, 16) % 50000000)
 */
const getCounselorAgoraUid = (counselorId) => {
  if (!counselorId) return null;
  const rawId = typeof counselorId === 'object' ? counselorId._id || counselorId.id : counselorId;
  if (!rawId) return null;
  const hex = rawId.toString().slice(-6);
  const num = parseInt(hex, 16);
  if (isNaN(num)) return null;
  return 100000000 + (num % 50000000);
};

const explainAgoraResult = (code) => {
  switch (code) {
    case 0: return 'OK / Success';
    case -2: return 'Invalid Argument (ERR_INVALID_ARGUMENT)';
    case -3: return 'Not Ready (ERR_NOT_READY)';
    case -4: return 'Not Supported (ERR_NOT_SUPPORTED)';
    case -7: return 'Not Initialized (ERR_NOT_INITIALIZED)';
    default: return `Agora Code: ${code}`;
  }
};

let globalAgoraEngine = null;
let isGlobalAgoraInitialized = false;

export default function NannyMeetingRoomScreen() {
  const { meetingId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const effectiveTopInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);

  const agoraEngineRef = useRef(null);
  const eventHandlerRef = useRef(null);
  const expectedCounselorUidRef = useRef(null);
  const isAudienceRef = useRef(true);

  // Lifecycle guards to eliminate re-joining lockups and race conditions
  const joinAttemptRef = useRef(0);
  const isJoiningRef = useRef(false);
  const isJoinedRef = useRef(false);
  const isLeavingRef = useRef(false);
  const isMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [hostUid, setHostUid] = useState(null);
  const [screenUid, setScreenUid] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [cameraSwitchCount, setCameraSwitchCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing meeting room...');
  const [sessionId, setSessionId] = useState(Date.now());

  // UI Responsiveness & Display Controls
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isLandscapeView, setIsLandscapeView] = useState(false);
  const [screenRenderMode, setScreenRenderMode] = useState(RenderModeType.RenderModeFit);
  const [hostRenderMode, setHostRenderMode] = useState(RenderModeType.RenderModeFit);
  const [isHostThumbnailMinimized, setIsHostThumbnailMinimized] = useState(false);

  const requestAudioVideoPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('[Meeting] 📱 Requesting Android audio & camera permissions...');
        const { PermissionsAndroid } = require('react-native');
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        console.log('[Meeting] 📱 Permissions result:', JSON.stringify(results));
      } catch (err) {
        console.warn('[Meeting] ⚠️ Android permissions request error:', err);
      }
    }
  };

  const handleRefreshToken = useCallback(async () => {
    try {
      console.log(`[Meeting] 🔄 Requesting fresh Agora RTC token for meeting ID: ${meetingId}...`);
      const res = await meetingService.getToken(meetingId);
      const newToken = res?.data?.token;
      if (newToken && agoraEngineRef.current) {
        const renewRes = agoraEngineRef.current.renewToken(newToken);
        console.log(`[Meeting] 🔄 agoraEngine.renewToken() returned: ${renewRes} [${explainAgoraResult(renewRes)}]`);
      }
    } catch (err) {
      console.error('[Meeting] ❌ Failed to renew token from server:', err?.response?.data || err?.message || err);
    }
  }, [meetingId]);

  const joinMeetingRoom = useCallback(async (mDetail, tData) => {
    if (isExpoGo) {
      setLoading(false);
      setStatusMessage('Expo Go detected. Real video requires a native development build.');
      console.warn('[Meeting] ⚠️ Expo Go detected. Agora RTC requires a native development build.');
      return;
    }

    try {
      const joinAttempt = joinAttemptRef.current + 1;
      joinAttemptRef.current = joinAttempt;
      isJoiningRef.current = true;
      isLeavingRef.current = false;
      setHostUid(null);
      setScreenUid(null);
      setIsJoined(false);
      isJoinedRef.current = false;
      setIsFrontCamera(true);
      setCameraSwitchCount(0);

      const isWebinar = mDetail.meetingType === 'webinar';
      const isAudience = tData.agoraRole === 'audience' || isWebinar;

      console.log(`[Meeting] 🎬 [joinMeetingRoom - Attempt #${joinAttempt}] Starting join flow`);
      console.log(`[Meeting] 📋 Meeting Type: ${mDetail.meetingType} | Client Role: ${isAudience ? 'AUDIENCE (LiveBroadcasting)' : 'BROADCASTER (Communication)'}`);
      console.log(`[Meeting] 🎯 Target Channel: "${tData.channelName}" | Client Agora UID: ${tData.uid}`);

      if (!isAudience) {
        await requestAudioVideoPermissions();
      }

      if (mDetail?.counselorId) {
        const cUid = getCounselorAgoraUid(mDetail.counselorId);
        expectedCounselorUidRef.current = cUid;
        console.log(`[Meeting] 🎯 Expected Counselor Agora UID: ${cUid} (from counselor ID: ${mDetail.counselorId?._id || mDetail.counselorId})`);
      }

      // Reuse or initialize the global native Agora engine singleton
      if (!globalAgoraEngine) {
        console.log('[Meeting] 🔧 [Agora Engine] Creating Agora engine instance for the first time...');
        globalAgoraEngine = createAgoraRtcEngine();
        const appId = tData.agoraAppId || process.env.EXPO_PUBLIC_AGORA_APP_ID;
        const initResult = globalAgoraEngine.initialize({ appId });
        console.log(`[Meeting] 🔧 [Agora Engine] engine.initialize() returned: ${initResult} [${explainAgoraResult(initResult)}] (App ID: ${appId ? appId.slice(0, 6) + '...' : 'none'})`);
        globalAgoraEngine.enableVideo();
        globalAgoraEngine.enableAudio();
        isGlobalAgoraInitialized = true;
      } else {
        console.log('[Meeting] ♻️ [Agora Engine] Reusing existing initialized Agora engine singleton (rejoin/new session)');
      }

      agoraEngineRef.current = globalAgoraEngine;
      const engine = agoraEngineRef.current;

      // Always unregister previous handler before registering new one to prevent duplicate listeners
      if (eventHandlerRef.current) {
        try {
          engine.unregisterEventHandler(eventHandlerRef.current);
          console.log('[Meeting] 🧹 Unregistered previous Agora event handler');
        } catch (e) {
          console.warn('[Meeting] ⚠️ Failed to unregister previous handler:', e);
        }
        eventHandlerRef.current = null;
      }

      // Flush any lingering previous channel session so Agora C++ socket starts clean
      try {
        const flushResult = engine.leaveChannel();
        if (flushResult === 0) {
          console.log('[Meeting] 🚪 Pre-join channel flush: ensuring previous channel was closed before joining');
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } catch (e) {}

      const isCurrentAttempt = (connection) => {
        if (connection?.channelId && connection.channelId !== tData.channelName) {
          console.log(`[Meeting] ℹ️ Discarding event for outdated channel: ${connection.channelId} (expected: ${tData.channelName})`);
          return false;
        }
        return isMountedRef.current && !isLeavingRef.current && joinAttemptRef.current === joinAttempt;
      };

      const eventHandler = {
        onJoinChannelSuccess: (connection, elapsed) => {
          if (!isCurrentAttempt(connection)) return;
          console.log(`[Meeting] ✅ Joined channel: "${connection.channelId}" | My UID: ${connection.localUid} | Elapsed: ${elapsed}ms`);
          isJoinedRef.current = true;
          isJoiningRef.current = false;
          setIsJoined(true);
          setLoading(false);

          if (isAudience) {
            if (expectedCounselorUidRef.current) {
              console.log(`[Meeting] 🎙️ Pre-binding expected Counselor UID: ${expectedCounselorUidRef.current} so video displays immediately when live`);
              setHostUid(expectedCounselorUidRef.current);
            }
            setStatusMessage('Connected to webinar. Waiting for counselor video...');
          } else {
            setStatusMessage('Connected to meeting.');
          }
        },

        onUserJoined: (connection, remoteUid, elapsed) => {
          if (!isCurrentAttempt(connection)) return;
          console.log(`[Meeting] 👤 Remote user joined: UID ${remoteUid} (Elapsed: ${elapsed}ms)`);

          if (remoteUid >= 900000000) {
            console.log(`[Meeting] 🖥️ Screen sharing stream detected on UID: ${remoteUid}`);
            setScreenUid(remoteUid);
            return;
          }

          if (isAudience) {
            console.log(`[Meeting] 📹 Setting Host Counselor UID to: ${remoteUid}`);
            setHostUid(remoteUid);
            setStatusMessage('');
          } else {
            console.log(`[Meeting] 🤝 Setting 1-to-1 remote participant UID to: ${remoteUid}`);
            setHostUid(remoteUid);
            setStatusMessage('');
          }
        },

        onUserOffline: (connection, remoteUid, reason) => {
          if (!isCurrentAttempt(connection)) return;
          console.log(`[Meeting] 👋 Remote user UID ${remoteUid} went offline (Reason code: ${reason})`);

          if (remoteUid >= 900000000) {
            console.log(`[Meeting] 🖥️ Screen share stopped for UID: ${remoteUid}`);
            setScreenUid(null);
            return;
          }

          setHostUid((currentHostUid) => {
            if (currentHostUid === remoteUid) {
              console.log(`[Meeting] ⏳ Host/participant UID ${remoteUid} left`);
              setStatusMessage('Waiting for counselor to reconnect...');
              return isAudience ? expectedCounselorUidRef.current : null;
            }
            return currentHostUid;
          });
        },

        onUserMuteVideo: (connection, remoteUid, muted) => {
          if (!isCurrentAttempt(connection)) return;
          console.log(`[Meeting] 📹 Remote user UID ${remoteUid} video ${muted ? 'MUTED' : 'UNMUTED'}`);
          if (!muted && remoteUid < 900000000) {
            setHostUid(remoteUid);
            setStatusMessage('');
          }
        },

        onRemoteVideoStateChanged: (connection, remoteUid, state, reason, elapsed) => {
          if (!isCurrentAttempt(connection)) return;
          console.log(`[Meeting] 📹 Remote video state UID ${remoteUid}: state ${state}, reason ${reason}`);
          if (state === 2 && remoteUid < 900000000) {
            setHostUid(remoteUid);
            setStatusMessage('');
          }
        },

        onError: (err, msg) => {
          console.error(`[Meeting] ⚠️ Agora Engine Error [Code ${err}]: ${msg}`);
        },

        onTokenPrivilegeWillExpire: (connection, token) => {
          console.warn('[Meeting] ⚠️ Agora RTC Token privilege will expire soon! Requesting renewal...');
          handleRefreshToken();
        },

        onRequestToken: (connection) => {
          console.warn('[Meeting] ⚠️ Agora RTC Token expired! Requesting renewal...');
          handleRefreshToken();
        },

        onLeaveChannel: (connection, stats) => {
          console.log(`[Meeting] 🚪 Left channel: "${connection.channelId}" (Duration: ${stats?.duration || 0}s)`);
        },
      };

      eventHandlerRef.current = eventHandler;
      engine.registerEventHandler(eventHandler);
      console.log('[Meeting] 📡 Registered new Agora event handler');

      // Configure Channel Profile and Role
      if (isAudience) {
        console.log('[Meeting] 🔒 Setting Channel Profile: LiveBroadcasting (Audience mode)');
        engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
        engine.setClientRole(ClientRoleType.ClientRoleAudience);
        engine.muteLocalAudioStream(true);
        engine.muteLocalVideoStream(true);
      } else {
        console.log('[Meeting] 🎙️ Setting Channel Profile: Communication (1-to-1 Broadcaster mode)');
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.muteLocalAudioStream(false);
        engine.muteLocalVideoStream(false);
      }

      setStatusMessage('Connecting to live channel...');
      console.log(`[Meeting] 🚀 Invoking agoraEngine.joinChannel() on channel: "${tData.channelName}" with UID: ${tData.uid}...`);

      const joinResult = await engine.joinChannel(
        tData.token,
        tData.channelName,
        tData.uid,
        {
          channelProfile: isAudience
            ? ChannelProfileType.ChannelProfileLiveBroadcasting
            : ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: isAudience
            ? ClientRoleType.ClientRoleAudience
            : ClientRoleType.ClientRoleBroadcaster,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
          publishCameraTrack: !isAudience,
          publishMicrophoneTrack: !isAudience,
        }
      );

      console.log(`[Meeting] 🚀 engine.joinChannel() returned code: ${joinResult} [${explainAgoraResult(joinResult)}]`);

      if (joinResult !== 0) {
        setLoading(false);
        setStatusMessage(`Could not join channel: ${explainAgoraResult(joinResult)}`);
      }
    } catch (err) {
      console.error('[Meeting] ❌ Exception during joinMeetingRoom:', err);
      setLoading(false);
      setStatusMessage(`Connection error: ${err.message || 'Unknown error'}`);
    }
  }, [handleRefreshToken]);

  // Clean, robust focus lifecycle: triggers on mount and on every re-focus
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      isLeavingRef.current = false;
      const currentAttempt = joinAttemptRef.current + 1;
      joinAttemptRef.current = currentAttempt;

      console.log(`[Meeting] 🏁 NannyMeetingRoomScreen focused for meetingId: "${meetingId}" (Attempt #${currentAttempt} at ${new Date().toLocaleTimeString()})`);

      const initRoom = async () => {
        try {
          setLoading(true);
          setStatusMessage('Connecting to meeting...');

          console.log(`[Meeting] 📡 [Step 1/3] Calling API /trainee/meetings/${meetingId}...`);
          const meetingRes = await meetingService.getMeeting(meetingId);
          const mDetail = meetingRes?.data?.meeting || meetingRes?.meeting;

          if (!mDetail) {
            console.error('[Meeting] ❌ Meeting not found or access denied from API response');
            setStatusMessage('Meeting details not found or access denied.');
            setLoading(false);
            return;
          }

          setMeeting(mDetail);
          console.log(`[Meeting] 📋 [Step 1/3 Complete] Title: "${mDetail.title}" | Type: ${mDetail.meetingType} | Status: "${mDetail.status}"`);

          const isWebinar = mDetail.meetingType === 'webinar';
          isAudienceRef.current = isWebinar;

          console.log(`[Meeting] 🔑 [Step 2/3] Calling API /meetings/${meetingId}/token...`);
          const tokenRes = await meetingService.getToken(meetingId);
          const tData = tokenRes?.data;

          if (!tData?.token || !tData?.channelName) {
            console.error('[Meeting] ❌ Invalid token payload from server:', tData);
            setStatusMessage('Failed to generate Agora token. Please retry.');
            setLoading(false);
            return;
          }

          setTokenData(tData);
          console.log(`[Meeting] 🔑 [Step 2/3 Complete] Channel: "${tData.channelName}" | UID: ${tData.uid} | Role: "${tData.agoraRole}"`);

          console.log('[Meeting] 🚀 [Step 3/3] Joining Agora Channel with minted credentials...');
          await joinMeetingRoom(mDetail, tData);
        } catch (err) {
          console.error('[Meeting] ❌ Exception in initRoom flow:', err?.response?.data || err?.message || err);
          setLoading(false);
          const msg = err?.response?.data?.message || err?.message || 'Failed to connect to meeting';
          setStatusMessage(msg);
        }
      };

      initRoom();

      return () => {
        console.log(`[Meeting] 💤 NannyMeetingRoomScreen blurred/unmounted (Attempt #${currentAttempt})`);
        isMountedRef.current = false;
        joinAttemptRef.current += 1;
        isJoiningRef.current = false;
        isJoinedRef.current = false;

        if (agoraEngineRef.current) {
          try {
            if (eventHandlerRef.current) {
              agoraEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
              eventHandlerRef.current = null;
              console.log('[Meeting] 🧹 Cleaned up event handler on blur/unmount');
            }
            agoraEngineRef.current.leaveChannel();
            console.log('[Meeting] 🚪 Sent leaveChannel on blur/unmount');
          } catch (e) {
            console.warn('[Meeting] ⚠️ Error during blur/unmount cleanup:', e);
          }
        }
      };
    }, [meetingId, joinMeetingRoom])
  );

  const toggleMute = () => {
    if (!agoraEngineRef.current) return;
    const next = !isMuted;
    agoraEngineRef.current.muteLocalAudioStream(next);
    setIsMuted(next);
  };

  const toggleCamera = () => {
    if (!agoraEngineRef.current) return;
    const next = !isCameraOff;
    agoraEngineRef.current.muteLocalVideoStream(next);
    setIsCameraOff(next);
  };

  const switchCamera = () => {
    if (!agoraEngineRef.current || isCameraOff) return;
    try {
      console.log('[Meeting] 🔄 Flipping camera between front and back...');
      const res = agoraEngineRef.current.switchCamera();
      const nextFront = !isFrontCamera;
      setIsFrontCamera(nextFront);
      setCameraSwitchCount((c) => c + 1);
      console.log(`[Meeting] 🔄 Camera switched to ${nextFront ? 'FRONT' : 'BACK/REAR'} camera (return code: ${res})`);
    } catch (err) {
      console.warn('[Meeting] ⚠️ Failed to switch camera:', err);
    }
  };

  const handleLeave = async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    joinAttemptRef.current += 1;
    isJoiningRef.current = false;
    isJoinedRef.current = false;
    console.log('🚪 [Meeting] User clicked Leave Meeting - safely exiting meeting room');
    try {
      if (agoraEngineRef.current) {
        setStatusMessage('Leaving session...');
        if (eventHandlerRef.current) {
          try {
            agoraEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
            console.log('🚪 [Meeting] Unregistered event handler before leaving');
          } catch (e) {}
          eventHandlerRef.current = null;
        }
        console.log('🚪 [Meeting] Invoking agoraEngine.leaveChannel()...');
        const leaveRes = await agoraEngineRef.current.leaveChannel();
        console.log(`🚪 [Meeting] leaveChannel returned code: ${leaveRes}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (e) {
      console.warn('🚪 [Meeting] Error during leaveChannel:', e);
    } finally {
      setHostUid(null);
      setScreenUid(null);
      setIsJoined(false);
      setIsFrontCamera(true);
      setCameraSwitchCount(0);
      setLoading(true);
      setStatusMessage('Initializing meeting room...');
      setSessionId(Date.now());
      console.log('🚪 [Meeting] Exiting screen, navigating directly to meetings list');
      router.replace('/(main)/meetings');
    }
  };

  const isWebinar = meeting?.meetingType === 'webinar';
  const isAudience = tokenData?.agoraRole === 'audience' || isWebinar;
  const isScreenSharingActive = Boolean(screenUid);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" translucent={true} />

      {/* Top Navigation Bar with Safe Area */}
      {controlsVisible && !isLandscapeView && (
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={[
            styles.topSafeArea,
            Platform.OS === 'android' && insets.top === 0 && { paddingTop: effectiveTopInset },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {meeting?.title || 'HeyShishu Meeting'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <Text style={styles.meetingTypeBadge}>
                  {isWebinar ? 'Webinar' : '1-to-1 Meeting'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeHeaderBtn}
              onPress={handleLeave}
              activeOpacity={0.7}
            >
              <Text style={styles.closeHeaderText}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Main Video View Canvas */}
      <Pressable
        style={styles.videoStage}
        onPress={() => setControlsVisible((prev) => !prev)}
      >
        {/* Loading Spinner / State Overlay */}
        {loading && (
          <View style={styles.stateOverlay}>
            <ActivityIndicator size="large" color="#34D399" />
            <Text style={styles.stateText}>{statusMessage}</Text>
          </View>
        )}

        {/* Waiting for counselor / host overlay */}
        {!loading && !hostUid && !screenUid && (
          <View style={styles.stateOverlay}>
            <View style={styles.waitingAvatarContainer}>
              <Text style={styles.waitingAvatarIcon}>👩‍⚕️</Text>
            </View>
            <Text style={styles.waitingTitle}>
              {isAudience ? 'Waiting for counselor...' : 'Connecting with participant...'}
            </Text>
            <Text style={styles.waitingSubtitle}>
              {statusMessage || 'The live broadcast will appear here once active.'}
            </Text>
          </View>
        )}

        {/* Screen Share Track Display (UID >= 900000000) */}
        {isScreenSharingActive && (
          <View style={styles.screenShareWrapper}>
            <AgoraVideoView
              key={`screen-${screenUid}-${sessionId}`}
              style={styles.screenShareVideo}
              canvas={{
                uid: screenUid,
                sourceType: VideoSourceType.VideoSourceRemote,
                renderMode: screenRenderMode,
              }}
            />
            <View style={styles.screenShareBadge}>
              <Text style={styles.screenShareBadgeText}>🖥️ Screen Share</Text>
            </View>
          </View>
        )}

        {/* Remote Host Video Display (Full Screen) */}
        {!isScreenSharingActive && hostUid && (
          <View style={styles.remoteHostWrapper}>
            <AgoraVideoView
              key={`remote-host-${hostUid}-${sessionId}`}
              style={styles.remoteHostVideo}
              canvas={{
                uid: hostUid,
                sourceType: VideoSourceType.VideoSourceRemote,
                renderMode: hostRenderMode,
              }}
            />
            <View style={styles.hostNamePill}>
              <Text style={styles.hostNamePillText}>
                {meeting?.counselorId?.name || (isAudience ? 'Counselor' : 'Remote Participant')}
              </Text>
            </View>
          </View>
        )}

        {/* Remote Host Thumbnail when screen share is active */}
        {isScreenSharingActive && hostUid && (
          isHostThumbnailMinimized ? (
            <TouchableOpacity
              style={styles.hostThumbnailRestoreBtn}
              onPress={() => setIsHostThumbnailMinimized(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.hostThumbnailRestoreText}>Host</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.hostThumbnailContainer}>
              <AgoraVideoView
                key={`host-thumb-${hostUid}-${sessionId}`}
                style={styles.hostThumbnailVideo}
                canvas={{
                  uid: hostUid,
                  sourceType: VideoSourceType.VideoSourceRemote,
                  renderMode: RenderModeType.RenderModeFit,
                }}
              />
              <View style={styles.thumbnailHeader}>
                <Text style={styles.thumbnailLabel}>Host</Text>
                <TouchableOpacity
                  style={styles.thumbnailMinimizeBtn}
                  onPress={() => setIsHostThumbnailMinimized(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.thumbnailMinimizeText}>–</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        {/* Local user camera preview (for 1-to-1 publisher) */}
        {!isAudience && isJoined && !isLandscapeView && (
          <View style={styles.localThumbnailContainer}>
            <AgoraVideoView
              key={`local-${tokenData?.uid}-${sessionId}-${cameraSwitchCount}`}
              style={styles.localThumbnailVideo}
              canvas={{
                uid: tokenData?.uid,
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: RenderModeType.RenderModeFit,
              }}
            />
            {isCameraOff ? (
              <View style={styles.cameraOffOverlay}>
                <Text style={styles.cameraOffText}>Camera Off</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.thumbnailFlipBtn}
                onPress={switchCamera}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.thumbnailFlipIcon}>🔄</Text>
              </TouchableOpacity>
            )}
            <View style={styles.cameraBadgeContainer}>
              <Text style={styles.cameraBadgeText}>
                {isFrontCamera ? 'Front' : 'Back'}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* Bottom Control Bar with Safe Area */}
      {controlsVisible && !isLandscapeView && (
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={[
            styles.bottomSafeArea,
            Platform.OS === 'android' && insets.bottom === 0 && { paddingBottom: 12 },
          ]}
        >
          <View style={styles.bottomBar}>
            {isAudience ? (
              // Webinar audience: Leave button & clean listening status
              <View style={styles.audienceControls}>
                <View style={styles.audienceInfo}>
                  <Text style={styles.audienceInfoIcon}>🎧</Text>
                  <Text style={styles.audienceInfoText} numberOfLines={1}>
                    Listening as audience
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={handleLeave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.leaveButtonText}>Leave Webinar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // 1-to-1 publisher: Mic, Camera, Flip Camera, and End Call
              <View style={styles.oneToOneControls}>
                <TouchableOpacity
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  <Text style={styles.controlButtonIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
                  <Text style={styles.controlButtonLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                  onPress={toggleCamera}
                >
                  <Text style={styles.controlButtonIcon}>{isCameraOff ? '🚫' : '📷'}</Text>
                  <Text style={styles.controlButtonLabel}>
                    {isCameraOff ? 'Start Cam' : 'Stop Cam'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, isCameraOff && styles.controlButtonDisabled]}
                  onPress={switchCamera}
                  disabled={isCameraOff}
                >
                  <Text style={styles.controlButtonIcon}>🔄</Text>
                  <Text style={styles.controlButtonLabel}>
                    {isFrontCamera ? 'Flip Cam' : 'Front Cam'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.endCallButton}
                  onPress={handleLeave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.endCallButtonIcon}>📞</Text>
                  <Text style={styles.endCallButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E12',
  },
  topSafeArea: {
    backgroundColor: '#111827',
    zIndex: 20,
  },
  bottomSafeArea: {
    backgroundColor: '#111827',
    zIndex: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.rubikBold,
    marginBottom: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.rubikBold,
    letterSpacing: 0.5,
  },
  meetingTypeBadge: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: fonts.rubik,
  },
  closeHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoStage: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0E12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 5,
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: fonts.rubik,
    marginTop: 12,
    textAlign: 'center',
  },
  waitingAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  waitingAvatarIcon: {
    fontSize: 38,
  },
  waitingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.rubikBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontFamily: fonts.rubik,
    textAlign: 'center',
    lineHeight: 18,
  },
  screenShareWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  screenShareVideo: {
    width: '100%',
    height: '100%',
  },
  screenShareBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  screenShareBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: fonts.rubikBold,
  },
  remoteHostWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  remoteHostVideo: {
    width: '100%',
    height: '100%',
  },
  hostNamePill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hostNamePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.rubik,
  },
  hostThumbnailContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 100,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: '#0F172A',
    zIndex: 15,
  },
  hostThumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  thumbnailHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  thumbnailLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.rubikBold,
  },
  thumbnailMinimizeBtn: {
    paddingHorizontal: 4,
  },
  thumbnailMinimizeText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hostThumbnailRestoreBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    zIndex: 15,
  },
  hostThumbnailRestoreText: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: fonts.rubikBold,
  },
  localThumbnailContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    width: 84,
    height: 114,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#0F172A',
    zIndex: 15,
  },
  localThumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  thumbnailFlipBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  thumbnailFlipIcon: {
    fontSize: 12,
  },
  cameraBadgeContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cameraBadgeText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontFamily: fonts.rubik,
  },
  cameraOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOffText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: fonts.rubik,
  },
  bottomBar: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  audienceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audienceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  audienceInfoIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  audienceInfoText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: fonts.rubik,
  },
  leaveButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.rubikBold,
  },
  oneToOneControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
  },
  controlButtonActive: {
    opacity: 0.6,
  },
  controlButtonDisabled: {
    opacity: 0.35,
  },
  controlButtonIcon: {
    fontSize: 22,
    marginBottom: 3,
  },
  controlButtonLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: fonts.rubik,
  },
  endCallButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  endCallButtonIcon: {
    fontSize: 16,
  },
  endCallButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.rubikBold,
  },
});
