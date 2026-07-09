import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { useRouter } from 'expo-router';
import { UpcomingBookingCard } from '../../../../src/components/features/UpcomingBookingCard';
import { CustomButton } from '../../../../src/components/common/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConfirmedBookings, startBooking, selectConfirmedBookings, selectBookingLoading } from '../../../../src/redux/slices/bookingSlice';
import { useFocusEffect } from '@react-navigation/native';
import { useAlert } from '../../../../src/contexts/AlertContext';

export default function UpcomingBookingScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  
  const confirmedBookings = useSelector(selectConfirmedBookings);
  const isLoading = useSelector(selectBookingLoading);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchConfirmedBookings());
    }, [dispatch])
  );

  const handleStartJourneyClick = (bookingId) => {
    setPendingBookingId(bookingId);
    setShowLocationModal(true);
  };

  const confirmStartJourney = async () => {
    setShowLocationModal(false);
    console.log("Starting journey for booking:", pendingBookingId);
    try {
      const resultAction = await dispatch(startBooking(pendingBookingId));
      if (startBooking.fulfilled.match(resultAction)) {
        // Move to Tab 3 for Active Location Session tracking
        router.push('/(main)/(tabs)/ontheway');
      } else {
        showAlert('Error', resultAction.payload || 'Failed to start journey');
      }
    } catch (e) {
      showAlert('Error', 'Unexpected error occurred while starting journey');
    }
  };

  const mapBookingToCard = (booking) => {
    const start = new Date(booking.startDateTime);
    const end = new Date(booking.endDateTime);
    const dateStr = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Format AM/PM time
    const startTimeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
    
    return {
      id: booking._id,
      childName: booking.childIds?.[0]?.firstName || 'Aarav Mehta',
      childAge: booking.childIds?.[0]?.age ? `${booking.childIds[0].age} Years Old` : '2.5 Years Old',
      date: dateStr,
      time: `${startTimeStr} – ${endTimeStr}`,
      address: `${booking.address?.area || 'Sector 45'}, ${booking.address?.city || 'Noida'}`,
      distance: '1.8 km', 
      childNotes: booking.parentNotes || '',
      childPhoto: require('../../../../assets/icons/nanny-image.svg'), // Using fallback image that exists
      parentPhoto: require('../../../../assets/icons/nanny-image.svg'), // Using dummy fallback
      
      fullAddress: booking.address?.fullAddress || `${booking.address?.area || ''} ${booking.address?.city || ''}`,
      parentName: booking.parentId?.fullName || 'Sneha Sharma',
      parentPhone: booking.contactNumber || booking.parentId?.phoneNumber || '',
    };
  };

  const handleMessageParent = (parentName) => {
    router.push({
      pathname: '/(main)/messages/chat',
      params: { name: parentName, subject: 'Babysitting' }
    });
  };

  const handleCallParent = (parentName) => {
    router.push('/(main)/messages/incoming_call');
  };

  const handleViewDetails = (mappedBooking) => {
    router.push({
      pathname: '/(main)/booking-details',
      params: {
        id: mappedBooking.id,
        parentName: mappedBooking.parentName,
        parentPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/12.jpg',
        address: mappedBooking.fullAddress,
        distance: mappedBooking.distance,
        childName: mappedBooking.childName,
        childAge: mappedBooking.childAge,
        childPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/40.jpg',
        childNotes: mappedBooking.childNotes,
        date: mappedBooking.date,
        time: mappedBooking.time,
      }
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Upcoming Sessions ({confirmedBookings.length})</Text>
        <Text style={styles.pageSubtitle}>Select a booking to start your journey.</Text>
      </View>

      {isLoading && confirmedBookings.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : confirmedBookings.length === 0 ? (
        <Text style={{ ...styles.pageSubtitle, textAlign: 'center', marginTop: 20 }}>No upcoming bookings scheduled.</Text>
      ) : (
        confirmedBookings.map((booking) => {
          const mapped = mapBookingToCard(booking);
          return (
            <UpcomingBookingCard 
              key={mapped.id} 
              data={mapped} 
              onStartJourney={() => handleStartJourneyClick(mapped.id)} 
              onMessage={() => handleMessageParent(mapped.parentName)}
              onCall={() => handleCallParent(mapped.parentName)}
              onViewDetails={() => handleViewDetails(mapped)}
            />
          );
        })
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
    
    <Modal
      visible={showLocationModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalIconBox}>
            <Ionicons name="location" size={32} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Location Access Required</Text>
          <Text style={styles.modalSub}>
            To help parents track your estimated arrival time and for your safety, HeyShishu needs your location even when the app is minimized.
          </Text>

          <CustomButton
            title="Allow Location Access"
            onPress={confirmStartJourney}
            style={{ borderRadius: 30, marginBottom: 12, backgroundColor: colors.primary, width: '100%' }}
          />
          <TouchableOpacity style={styles.cancelLink} onPress={() => setShowLocationModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

// Styling based on HeyShishu Theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.primary,
  },
  pageSubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EAEFFF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20, color: colors.primary,
    textAlign: 'center', marginBottom: 12,
  },
  modalSub: {
    fontFamily: fonts.rubik,
    fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24,
  },
  cancelLink: { padding: 10 },
  cancelText: { fontFamily: fonts.rubikBold, fontSize: 15, color: colors.description }
});
