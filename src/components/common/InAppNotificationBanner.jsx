import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import socketService from '../../services/socketService';
import {
  fetchPendingBookings,
  fetchCancelledBookings,
  fetchCompletedBookings,
} from '../../redux/slices/bookingSlice';

export default function InAppNotificationBanner() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [currentNotif, setCurrentNotif] = useState(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Connect socket if not already connected
    socketService.connect();

    const handleBookingNotification = (notif) => {
      console.log('🔔 [Nanny InAppBanner] Received notification:', notif?.title);
      if (!notif) return;

      // 1. Auto-refresh booking Redux slices based on event type
      const type = notif.type || '';
      if (type === 'booking_request' || type === 'booking_timeout') {
        dispatch(fetchPendingBookings());
      } else if (type === 'booking_cancelled') {
        dispatch(fetchPendingBookings());
        dispatch(fetchCancelledBookings());
      } else if (type === 'booking_completed') {
        dispatch(fetchCompletedBookings());
      }

      // 2. Clear any existing banner timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setCurrentNotif(notif);

      // 3. Animate banner down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // 4. Auto-dismiss after 6 seconds
      timeoutRef.current = setTimeout(() => {
        dismissBanner();
      }, 6000);
    };

    socketService.on('booking_notification', handleBookingNotification);

    return () => {
      socketService.off('booking_notification', handleBookingNotification);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [dispatch]);

  const dismissBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentNotif(null);
    });
  };

  const handlePress = () => {
    if (!currentNotif) return;
    const { type, data } = currentNotif;
    dismissBanner();

    // Navigate to appropriate screen based on event type / screen param
    if (data?.screen === 'requests' || type === 'booking_request' || type === 'booking_timeout' || type === 'booking_cancelled') {
      router.push('/(main)/(tabs)/requests');
    } else if (data?.screen === 'upcoming' || type === 'booking_confirmed') {
      router.push('/(main)/(tabs)/upcoming');
    } else if (data?.screen === 'service' || type === 'booking_started') {
      router.push('/(main)/(tabs)/service');
    } else if (data?.screen === 'earnings' || type === 'booking_completed') {
      router.push('/(main)/earnings');
    } else if (data?.screen === 'ratings' || type === 'booking_review') {
      router.push('/(main)/ratings');
    } else {
      router.push('/(main)/notifications');
    }
  };

  if (!currentNotif) return null;

  const isRequest = currentNotif.type === 'booking_request';
  const isCancelled = currentNotif.type === 'booking_cancelled';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.bannerCard,
          isRequest && styles.requestBorder,
          isCancelled && styles.cancelBorder,
        ]}
      >
        <View style={[styles.iconContainer, isRequest ? styles.requestIconBg : isCancelled ? styles.cancelIconBg : styles.defaultIconBg]}>
          <Ionicons
            name={isRequest ? 'notifications' : isCancelled ? 'close-circle' : 'checkmark-circle'}
            size={22}
            color={isRequest ? '#FF9800' : isCancelled ? '#EF4444' : colors.primary}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentNotif.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {currentNotif.body}
          </Text>
        </View>

        <TouchableOpacity onPress={dismissBanner} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 10,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestBorder: {
    borderColor: '#FDBA74',
    borderLeftWidth: 5,
    borderLeftColor: '#F97316',
  },
  cancelBorder: {
    borderColor: '#FCA5A5',
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestIconBg: {
    backgroundColor: '#FFF7ED',
  },
  cancelIconBg: {
    backgroundColor: '#FEF2F2',
  },
  defaultIconBg: {
    backgroundColor: '#ECFDF5',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
