import React from 'react';
import ChatList from '../../../components/ChatList';

export default function MessagesScreen() {
  return <ChatList showBackButton backRoute="/(main)/(tabs)/requests" />;
}
