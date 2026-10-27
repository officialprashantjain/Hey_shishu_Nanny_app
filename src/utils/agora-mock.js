/**
 * Agora Mock Module
 * Used in Expo Go (which cannot run native modules like react-native-agora).
 * This provides stub implementations so the rest of the app loads without crashing.
 * The video call functionality will NOT work in Expo Go — that is intentional.
 * It works fully in real Android/iOS builds.
 */

export const createAgoraRtcEngine = () => {
  console.warn('[Agora Mock] react-native-agora is not available in Expo Go. Video calls will not work.');
  return {
    registerEventHandler: () => {},
    unregisterEventHandler: () => {},
    initialize: () => 0,
    enableVideo: () => 0,
    enableAudio: () => 0,
    joinChannel: async () => 0,
    leaveChannel: () => 0,
    release: () => {},
    renewToken: () => 0,
    setChannelProfile: () => 0,
    setClientRole: () => 0,
    setRemoteRenderMode: () => 0,
    muteLocalAudioStream: () => 0,
    muteLocalVideoStream: () => 0,
    switchCamera: () => 0,
    setEnableSpeakerphone: () => 0,
    setDefaultAudioRouteToSpeakerphone: () => {},
    startPreview: () => {},
    stopPreview: () => {},
    enableLocalVideo: () => {},
    updateChannelMediaOptions: () => {},
  };
};

export const ChannelProfileType = {
  ChannelProfileCommunication: 0,
  ChannelProfileLiveBroadcasting: 1,
};

export const ClientRoleType = {
  ClientRoleBroadcaster: 1,
  ClientRoleAudience: 2,
};

export const VideoSourceType = {
  VideoSourceCamera: 0,
  VideoSourceRemote: 1,
};

export const RenderModeType = {
  RenderModeHidden: 1,
  RenderModeFit: 2,
  RenderModeAdaptive: 3,
};

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const RtcSurfaceView = ({ style }) =>
  React.createElement(
    View,
    { style: [style, stubStyles.container] },
    React.createElement(Text, { style: stubStyles.text }, '📵 Video not available\nin Expo Go')
  );

export const RtcTextureView = RtcSurfaceView;

export const AgoraVideoView = RtcSurfaceView;

const stubStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
});
