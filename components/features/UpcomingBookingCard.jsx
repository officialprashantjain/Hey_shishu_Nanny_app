import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomImage as Image } from '../common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/color';
import { fonts } from '../../constants/font';

export const UpcomingBookingCard = ({ data, onStartJourney, onMessage, onCall, onViewDetails }) => {
  if (!data) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardSectionTitle}>Booking: {data.id}</Text>
        <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
          <Text style={styles.detailsText}>Details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Parent Details */}
      <View style={styles.profileRow}>
        <Image source={data.parentPhoto} style={styles.avatar} contentFit="cover" />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{data.parentName}</Text>
          <Text style={styles.subtext}>Primary Contact</Text>
        </View>
        <View style={styles.iconActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onMessage}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary }]} onPress={onCall}>
            <Ionicons name="call" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressBox}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.addressText}>{data.address}</Text>
          <Text style={styles.distanceText}>{data.distance} away</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Child Details */}
      <View style={styles.profileRow}>
        <Image source={data.childPhoto} style={styles.avatarSmall} contentFit="cover" />
        <View style={styles.profileInfo}>
          <Text style={styles.nameSmall}>{data.childName}</Text>
          <Text style={styles.subtextSmall}>{data.childAge}</Text>
        </View>
      </View>
        
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color={colors.description} />
        <Text style={styles.infoText}>{data.date} | {data.time}</Text>
      </View>
        
      <View style={styles.notesBox}>
        <Text style={styles.notesTitle}>Important Notes:</Text>
        <Text style={styles.notesText}>{data.childNotes}</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={styles.startBtn} 
        onPress={onStartJourney}
      >
        <Text style={styles.startBtnText}>Start Journey</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.description,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.primary,
    marginRight: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
    marginBottom: 20,
  },
  notesTitle: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    marginBottom: 4,
  },
  notesText: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
    lineHeight: 18,
  },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
    fontSize: 16,
  }
});
