import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { useRouter } from 'expo-router';
import { UpcomingBookingCard } from '../../../../components/UpcomingBookingCard';

export default function UpcomingBookingScreen() {
  const router = useRouter();

  // Expanded dummy data to showcase multiple accepted bookings scalability
  const [acceptedBookings] = useState([
    {
      id: "JOB-A12X",
      parentName: "Sneha Sharma",
      parentPhoto: "https://xsgames.co/randomusers/assets/avatars/male/12.jpg",
      address: "B-405, Omaxe Heights, Sector 86, Faridabad",
      distance: "3.5 km",
      childName: "Aarav Mehta",
      childAge: "2.5 Years Old",
      childPhoto: "https://xsgames.co/randomusers/assets/avatars/male/40.jpg",
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
      childPhoto: "https://xsgames.co/randomusers/assets/avatars/female/2.jpg",
      childNotes: "Please ensure her nap time is strictly between 1 PM and 3 PM.",
      date: "Tomorrow, 13 May 2025",
      time: "12:00 PM – 6:00 PM"
    }
  ]);

  const handleStartJourney = (bookingId) => {
    console.log("Starting journey for booking:", bookingId);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Upcoming Sessions ({acceptedBookings.length})</Text>
        <Text style={styles.pageSubtitle}>Select a booking to start your journey.</Text>
      </View>

      {acceptedBookings.map((booking) => (
        <UpcomingBookingCard 
          key={booking.id} 
          data={booking} 
          onStartJourney={() => handleStartJourney(booking.id)} 
          onMessage={() => handleMessageParent(booking.parentName)}
          onCall={() => handleCallParent(booking.parentName)}
          onViewDetails={() => handleViewDetails(booking)}
        />
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
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
  }
});
