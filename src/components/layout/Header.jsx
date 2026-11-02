import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Switch } from 'react-native';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { Ionicons } from '@expo/vector-icons';
import socketService from '../../services/socketService';
import { getUnreadCount } from '../../services/notificationService';

export const Header = ({ title = "New Requests" }) => {
  const navigation = useNavigation();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(() => {
    getUnreadCount()
      .then((res) => {
        const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
        setUnreadCount(count);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(fetchCount);

  useEffect(() => {
    fetchCount();

    const handleUnreadCount = (data) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    const handleNewNotif = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socketService.on('unread_notifications_count', handleUnreadCount);
    socketService.on('booking_notification', handleNewNotif);

    return () => {
      socketService.off('unread_notifications_count', handleUnreadCount);
      socketService.off('booking_notification', handleNewNotif);
    };
  }, [fetchCount]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Hamburger Icon */}
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={32} color={colors.primary} />
        </TouchableOpacity>

        {/* Center Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Right Actions (Bell + Toggle) */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={() => router.push('/(main)/notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
{/* 
          <View style={[styles.toggleContainer, { backgroundColor: isOnline ? '#28A745' : colors.gray }]}>
            <Text style={styles.toggleText}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              trackColor={{ false: 'transparent', true: 'transparent' }}
              thumbColor={"#FFF"}
              ios_backgroundColor="transparent"
              onValueChange={() => setIsOnline(!isOnline)}
              value={isOnline}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View> */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background, 
    paddingTop: Platform.OS === 'android' ? 30 : 0, 
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.primary,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    position: 'relative',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: fonts.rubikBold,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 2,
    height: 32,
  },
  toggleText: {
    color: '#FFF',
    fontFamily: fonts.rubikBold,
    fontSize: 12,
    marginRight: 2,
  }
});
