import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomImage as Image } from '../common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

export const SmallRequestCard = ({ data, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={data.photo} style={styles.avatar} contentFit="cover" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{data.childName}</Text>
          <Text style={styles.timeAgo}>{data.postedAgo}</Text>
        </View>
        <Text style={styles.age}>{data.age}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.details}>{data.time} • {data.distance}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 12,
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: colors.primary,
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    flex: 1,
  },
  timeAgo: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 12,
  },
  age: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 14,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  details: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
  },
});
