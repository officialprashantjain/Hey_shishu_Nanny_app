import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

const AVAILABLE = 7420; // Will come from backend/context

const QUICK_AMOUNTS = [500, 1000, 2000];

export default function WithdrawScreen() {
  const router = useRouter();
  const [upiId, setUpiId]     = useState('');
  const [amount, setAmount]   = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const amountNum  = parseFloat(amount) || 0;
  const isDisabled = !upiId.trim() || amountNum <= 0 || amountNum > AVAILABLE;

  // Reset form every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setUpiId('');
      setAmount('');
      setShowSuccess(false);
    }, [])
  );

  const handleConfirm = () => {
    if (isDisabled) return;
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Withdrawal Requested!</Text>
        <Text style={styles.successSub}>
          ₹{amountNum.toLocaleString()} will be transferred to your UPI ID within 2 hours.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(main)/earnings')}>
          <Text style={styles.doneBtnText}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(main)/earnings')}>
            <Ionicons name="chevron-back" size={22} color={colors.description} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLbl}>Available to Withdraw</Text>
          <Text style={styles.balanceVal}>₹{AVAILABLE.toLocaleString()}</Text>
        </View>

        {/* UPI / Bank input */}
        <Text style={styles.fieldLabel}>UPI ID / Bank Account</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="card-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. yourname@upi"
            placeholderTextColor={colors.description + '55'}
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount input */}
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor={colors.description + '55'}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick amount chips */}
        <View style={styles.chipsRow}>
          {QUICK_AMOUNTS.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, amount === String(q) && styles.chipActive]}
              onPress={() => setAmount(String(q))}
            >
              <Text style={[styles.chipText, amount === String(q) && styles.chipTextActive]}>
                ₹{q.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, amount === String(AVAILABLE) && styles.chipActive]}
            onPress={() => setAmount(String(AVAILABLE))}
          >
            <Text style={[styles.chipText, amount === String(AVAILABLE) && styles.chipTextActive]}>
              Full
            </Text>
          </TouchableOpacity>
        </View>

        {/* Validation hint */}
        {amountNum > AVAILABLE && (
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={14} color={colors.danger} />
            <Text style={styles.errorText}>Amount exceeds available balance</Text>
          </View>
        )}

        {/* ETA info row */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>Usually within 2 hours on working days</Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, isDisabled && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

  body: { flex: 1 },
  bodyContent: { padding: 24 },

  // Balance card
  balanceCard: {
    backgroundColor: colors.primary + '12',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  balanceLbl: { fontFamily: fonts.rubik, fontSize: 13, color: colors.primary, marginBottom: 4 },
  balanceVal: { fontFamily: fonts.rubikBold, fontSize: 34, color: colors.primary },

  // Inputs
  fieldLabel: {
    fontFamily: fonts.rubikBold, fontSize: 13,
    color: colors.description, marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14, borderWidth: 1, borderColor: colors.lightGray,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20,
  },
  input: {
    flex: 1, fontFamily: fonts.rubik, fontSize: 15, color: colors.description,
  },

  // Chips
  chipsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 30, borderWidth: 1, borderColor: colors.primary + '40',
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.rubikBold, fontSize: 13, color: colors.primary },
  chipTextActive: { color: colors.white },

  // Validation
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  errorText: { fontFamily: fonts.rubik, fontSize: 12, color: colors.danger },

  // Info row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary + '10',
    borderRadius: 12, padding: 12, marginBottom: 28,
  },
  infoText: { fontFamily: fonts.rubik, fontSize: 13, color: colors.primary, flex: 1 },

  // Confirm button
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  confirmBtnDisabled: { backgroundColor: colors.gray, shadowOpacity: 0 },
  confirmBtnText: { fontFamily: fonts.rubikBold, fontSize: 17, color: colors.white },

  // Success state
  successIconBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: fonts.rubikBold, fontSize: 24,
    color: colors.description, marginBottom: 12, textAlign: 'center',
  },
  successSub: {
    fontFamily: fonts.rubik, fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22, marginBottom: 36,
    opacity: 0.75,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 30, paddingVertical: 16, paddingHorizontal: 48,
    alignItems: 'center',
  },
  doneBtnText: { fontFamily: fonts.rubikBold, fontSize: 16, color: colors.white },
});
