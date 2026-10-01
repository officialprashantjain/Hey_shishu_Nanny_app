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
    initialize: () => {},
    enableVideo: () => {},
    joinChannel: async () => {},
    leaveChannel: () => {},
    release: () => {},
    muteLocalAudioStream: () => {},
    muteLocalVideoStream: () => {},
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

// Stub RtcSurfaceView component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const RtcSurfaceView = ({ style }) => (
  <View style={[style, stubStyles.container]}>
    <Text style={stubStyles.text}>📵 Video not available{'\n'}in Expo Go</Text>
  </View>
);

const stubStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  text: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
