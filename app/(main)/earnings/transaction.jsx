import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

const STATUS_CONFIG = {
  paid:       { label: 'Paid',       bg: '#E8F5E9', text: colors.success,  icon: 'checkmark-circle' },
  pending:    { label: 'Pending',    bg: '#FFF3CD', text: colors.warning,  icon: 'time' },
  processing: { label: 'Processing', bg: '#EDE7F6', text: colors.secondary, icon: 'sync-circle' },
};

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const item = JSON.parse(data);

  const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.paid;

  const Row = ({ label, value, valueStyle }) => (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, valueStyle]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.white }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(main)/earnings')}>
            <Ionicons name="chevron-back" size={22} color={colors.description} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status Badge */}
        <View style={styles.statusBlock}>
          <Ionicons name={s.icon} size={44} color={s.text} />
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>

        {/* Net Amount Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Amount Received</Text>
          <Text style={styles.heroAmount}>₹{item.net.toLocaleString()}</Text>
        </View>

        {/* Session Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Info</Text>
          <View style={styles.divider} />
          <Row label="Parent"       value={item.parentName} />
          <Row label="Child"        value={item.childName} />
          <Row label="Date"         value={item.date} />
          <Row label="Hours Worked" value={`${item.hoursWorked} hrs`} />
          <Row label="Hourly Rate"  value={`₹${item.hourlyRate}/hr`} />
        </View>

        {/* Earnings Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings Breakdown</Text>
          <View style={styles.divider} />
          <Row
            label="Gross Earnings"
            value={`₹${item.gross.toLocaleString()}`}
          />
          <Row
            label="Platform Fee (10%)"
            value={`- ₹${item.platformFee.toLocaleString()}`}
            valueStyle={{ color: colors.danger }}
          />
          <View style={styles.netDivider} />
          <Row
            label="Net Payout"
            value={`₹${item.net.toLocaleString()}`}
            valueStyle={{ color: colors.primary, fontFamily: fonts.rubikBold, fontSize: 17 }}
          />
        </View>

        {/* Reference Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Reference</Text>
          <View style={styles.divider} />
          <View style={styles.refRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.refId}>{item.refId}</Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.rubikBold, fontSize: 18, color: colors.description },

  content: { padding: 20 },

  // Status Block
  statusBlock: {
    alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8,
  },
  badge: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  badgeText: { fontFamily: fonts.rubikBold, fontSize: 13 },

  // Hero
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  heroLabel: {
    fontFamily: fonts.rubik, fontSize: 13, color: colors.white, opacity: 0.8, marginBottom: 6,
  },
  heroAmount: {
    fontFamily: fonts.rubikBold, fontSize: 40, color: colors.white, letterSpacing: 1,
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: {
    fontFamily: fonts.rubikBold, fontSize: 14, color: colors.description, marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: colors.lightGray, marginBottom: 14 },
  netDivider: { height: 1, backgroundColor: colors.lightGray, marginVertical: 12 },

  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  breakdownLabel: {
    fontFamily: fonts.rubik, fontSize: 14, color: colors.description, opacity: 0.7,
  },
  breakdownValue: {
    fontFamily: fonts.rubik, fontSize: 14, color: colors.description,
  },

  // Reference
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refId: {
    fontFamily: fonts.rubikBold, fontSize: 14, color: colors.primary,
    letterSpacing: 0.5,
  },
});
