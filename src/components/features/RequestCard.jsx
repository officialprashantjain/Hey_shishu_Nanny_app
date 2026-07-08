import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomImage as Image } from '../common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

export const RequestCard = ({ data, onAccept, onDecline, onViewDetails }) => {
  if (!data) return null;

  return (
    <View style={styles.cardContainer}>
      {/* Header element of card */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>New Booking Request</Text>
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={16} color={colors.error || '#E53935'} />
          <Text style={styles.timerText}>{data.timeLeft || '20s left'}</Text>
        </View>
      </View>
      <Text style={styles.subtext}>Be the first to accept</Text>

      {/* Main card box */}
      <View style={styles.cardInner}>
        {/* Profile Row */}
        <TouchableOpacity style={styles.profileRow} onPress={onViewDetails} activeOpacity={0.7}>
          <Image source={data.photo} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileDetails}>
            <Text style={styles.name}>{data.childName}</Text>
            <Text style={styles.age}>{data.age}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{data.type}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.description} />
        </TouchableOpacity>

        {/* Details List */}
        <View style={styles.detailsList}>
          <DetailRow icon="calendar-outline" label="Date" value={data.date} />
          <DetailRow icon="time-outline" label="Time" value={data.time} />
          <DetailRow icon="hourglass-outline" label="Duration" value={data.duration} />
          <DetailRow 
            icon="location-outline" 
            label="Location" 
            value={data.location} 
            highlight={data.distance} 
          />
        </View>

        {/* Note */}
        {data.notes && (
          <View style={styles.noteSection}>
            <View style={styles.noteHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.noteTitle}>Note from Parent</Text>
            </View>
            <Text style={styles.noteText}>{data.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const DetailRow = ({ icon, label, value, highlight }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <View style={styles.detailRight}>
      <Text style={styles.detailValue}>{value}</Text>
      {highlight && <Text style={styles.highlightText}> {highlight}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.primary,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: colors.error || '#E53935',
    fontFamily: fonts.rubikBold,
    fontSize: 14,
  },
  subtext: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardInner: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FAFAF9',
    padding: 12,
    borderRadius: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    marginBottom: 2,
  },
  age: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 14,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.secondary + '15',
  },
  badgeText: {
    color: colors.secondary,
    fontFamily: fonts.rubikBold,
    fontSize: 10,
  },
  detailsList: {
    gap: 14,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '35%',
  },
  detailLabel: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 14,
  },
  detailRight: {
    flexDirection: 'row',
    width: '65%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailValue: {
    color: colors.primary,
    fontFamily: fonts.rubik,
    fontSize: 14,
  },
  highlightText: {
    color: colors.secondary,
    fontFamily: fonts.rubikBold,
    fontSize: 14,
  },
  noteSection: {
    marginBottom: 24,
    backgroundColor: '#FAFAF9',
    padding: 14,
    borderRadius: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  noteTitle: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 14,
  },
  noteText: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  declineText: {
    color: colors.description,
    fontFamily: fonts.rubikBold,
    fontSize: 16,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptText: {
    color: colors.white,
    fontFamily: fonts.rubikBold,
    fontSize: 16,
  },
});
