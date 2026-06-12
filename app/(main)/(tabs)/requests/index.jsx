import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { mockRequests } from '../../../../constants/dummyData';
import { RequestCard } from '../../../../components/features/RequestCard';
import { SmallRequestCard } from '../../../../components/features/SmallRequestCard';

import { useRouter } from 'expo-router';

export default function RequestsScreen() {
  const [data, setData] = useState(mockRequests);
  const router = useRouter();

  // Split data -> find all primary new requests, the rest are others
  const newRequests = data.filter(req => req.isNew);
  const otherRequests = data.filter(req => !req.isNew);

  const handleAccept = (id) => {
    console.log("Accepted request", id);
    // Navigate to the Upcoming Screen
    router.push("/(main)/(tabs)/upcoming");
    
    setData(data.filter(r => r.id !== id));
  };

  const handleDecline = (id) => {
    console.log("Declined request", id);
    setData(data.filter(r => r.id !== id));
  };

  const handleViewRequestDetails = (request) => {
    router.push({
      pathname: '/(main)/booking-details',
      params: {
        id: request.id,
        parentName:  request.childName,
        parentPhoto: request.photo,
        address: request.location,
        distance: request.distance,
        childName: request.childName,
        childAge: request.age,
        childPhoto: request.photo,
        childNotes: request.notes,
        date: request.date,
        time: request.time,
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Primary Requests */}
      {newRequests.map(req => (
        <RequestCard 
          key={req.id}
          data={req} 
          onAccept={() => handleAccept(req.id)}
          onDecline={() => handleDecline(req.id)}
          onViewDetails={() => handleViewRequestDetails(req)}
        />
      ))}

      {/* Title for remaining list */}
      {/* {otherRequests.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Other Requests</Text>
        </View>
      )} */}

      {/* Render list of smaller compact requests */}
      {/* {otherRequests.map(item => (
        <SmallRequestCard 
          key={item.id} 
          data={item} 
          onPress={() => handleViewRequestDetails(item)}
        />
      ))} */}
      
      {/* Bottom spacing to account for Tab bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Using deep background matching the mock image design concept
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.primary,
  }
});
