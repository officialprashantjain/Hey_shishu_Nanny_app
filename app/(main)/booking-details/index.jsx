import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../components/common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const dummyBookingData = {
    id: params.id || 'JOB-A12X',
    parentName: params.parentName || 'Sneha Sharma',
    parentPhoto: params.parentPhoto || 'https://xsgames.co/randomusers/assets/avatars/male/12.jpg',
    address: params.address || 'B-405, Omaxe Heights, Sector 86, Faridabad',
    distance: params.distance || '3.5 km',
    childName: params.childName || 'Aarav Mehta',
    childAge: params.childAge || '2.5 Years Old',
    childPhoto: params.childPhoto || 'https://xsgames.co/randomusers/assets/avatars/male/40.jpg',
    childNotes: params.childNotes || 'Aarav loves story time and outdoor play. Peanut allergy.',
    date: params.date || 'Today, 12 May 2025',
    time: params.time || '10:00 AM – 2:00 PM',
  };

  const handleMessageParent = () => {
    router.push({
      pathname: '/(main)/messages/chat',
      params: { name: dummyBookingData.parentName, subject: 'Babysitting' }
    });
  };

  const handleCallParent = () => {
    router.push('/(main)/messages/incoming_call');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image
              source={require('../../../assets/icons/left-arrow.svg')}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Parent Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Parent Details</Text>
          <View style={styles.profileRow}>
            <Image source={dummyBookingData.parentPhoto} style={styles.avatar} contentFit="cover" />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{dummyBookingData.parentName}</Text>
              <Text style={styles.subtext}>Primary Contact</Text>
            </View>
            <View style={styles.iconActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleMessageParent}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary }]} onPress={handleCallParent}>
                <Ionicons name="call" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Address</Text>
          <View style={styles.addressBox}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.addressText}>{dummyBookingData.address}</Text>
              <Text style={styles.distanceText}>{dummyBookingData.distance} away</Text>
            </View>
          </View>
        </View>

        {/* Child Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Child Details</Text>
          <View style={styles.profileRow}>
            <Image source={dummyBookingData.childPhoto} style={styles.avatarSmall} contentFit="cover" />
            <View style={styles.profileInfo}>
              <Text style={styles.nameSmall}>{dummyBookingData.childName}</Text>
              <Text style={styles.subtextSmall}>{dummyBookingData.childAge}</Text>
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.description} />
            <Text style={styles.infoText}>{dummyBookingData.date} | {dummyBookingData.time}</Text>
          </View>
        </View>

        {/* Important Notes */}
        {/* <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Important Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{dummyBookingData.childNotes}</Text>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafeArea: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.description,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  cardSectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.description,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    marginBottom: 2,
  },
  nameSmall: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    marginBottom: 2,
  },
  subtext: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
  },
  subtextSmall: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 12,
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  addressText: {
    color: colors.primary,
    fontFamily: fonts.rubik,
    fontSize: 14,
    lineHeight: 20,
  },
  distanceText: {
    marginTop: 4,
    color: colors.secondary,
    fontFamily: fonts.rubikBold,
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: colors.primary,
    fontFamily: fonts.rubik,
    fontSize: 14,
  },
  notesBox: {
    backgroundColor: '#FAFAF9',
    padding: 12,
    borderRadius: 12,
  },
  notesText: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
    lineHeight: 18,
  },
});
