import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { useRouter } from 'expo-router';
import { UpcomingBookingCard } from '../../../../components/UpcomingBookingCard';
import { CustomButton } from '../../../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

export default function UpcomingBookingScreen() {
  const router = useRouter();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  // Expanded dummy data to showcase multiple accepted bookings scalability
  const [acceptedBookings] = useState([
    {
      id: "JOB-A12X",
      parentName: "Sneha Sharma",
      parentPhoto: "https://xsgames.co/randomusers/assets/avatars/female/2.jpg",
      address: "B-405, Omaxe Heights, Sector 86, Faridabad",
      distance: "3.5 km",
      childName: "Aarav Mehta",
      childAge: "2.5 Years Old",
      childPhoto:   "https://plus.unsplash.com/premium_photo-1667480556784-a8f27e62104c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      childNotes: "Aarav loves story time and outdoor play. Peanut allergy.",
      date: "Today, 12 May 2025",
      time: "10:00 AM – 2:00 PM"
    },
    {
      id: "JOB-B49Y",
      parentName: "Rakesh Verma",
      parentPhoto: "https://xsgames.co/randomusers/assets/avatars/male/12.jpg",
      address: "Villa 34, DLF Phase 2, Gurugram",
      distance: "6.2 km",
      childName: "Kiara Verma",
      childAge: "1.5 Years Old",
      childPhoto:  "https://plus.unsplash.com/premium_photo-1667480556784-a8f27e62104c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      childNotes: "Please ensure her nap time is strictly between 1 PM and 3 PM.",
      date: "Tomorrow, 13 May 2025",
      time: "12:00 PM – 6:00 PM"
    }
  ]);

  const handleStartJourneyClick = (bookingId) => {
    setPendingBookingId(bookingId);
    setShowLocationModal(true);
  };

  const confirmStartJourney = () => {
    setShowLocationModal(false);
    console.log("Starting journey for booking:", pendingBookingId);
    // Move to Tab 3 for Active Location Session tracking
    router.push('/(main)/(tabs)/ontheway');
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

  const handleViewDetails = (booking) => {
    router.push({
      pathname: '/(main)/booking-details',
      params: {
        id: booking.id,
        parentName: booking.parentName,
        parentPhoto: booking.parentPhoto,
        address: booking.address,
        distance: booking.distance,
        childName: booking.childName,
        childAge: booking.childAge,
        childPhoto: booking.childPhoto,
        childNotes: booking.childNotes,
        date: booking.date,
        time: booking.time,
      }
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Upcoming Sessions ({acceptedBookings.length})</Text>
        <Text style={styles.pageSubtitle}>Select a booking to start your journey.</Text>
      </View>

      {acceptedBookings.map((booking) => (
        <UpcomingBookingCard 
          key={booking.id} 
          data={booking} 
          onStartJourney={() => handleStartJourneyClick(booking.id)} 
          onMessage={() => handleMessageParent(booking.parentName)}
          onCall={() => handleCallParent(booking.parentName)}
          onViewDetails={() => handleViewDetails(booking)}
        />
      ))}

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
