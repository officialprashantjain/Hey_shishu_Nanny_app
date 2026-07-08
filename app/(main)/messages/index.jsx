import React from 'react';
import ChatList from '../../../src/components/features/ChatList';

export default function MessagesScreen() {
  return <ChatList showBackButton backRoute="/(main)/(tabs)/requests" />;
}
