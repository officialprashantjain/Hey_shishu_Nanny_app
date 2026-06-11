import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../constants/color';
import { fonts } from '../constants/font';
import { CustomButton } from './CustomButton';

/**
 * OtpModal — Reusable OTP verification popup
 * Used for:
 *   1. Arrival OTP (nanny arrives at parent's home)
 *   2. Session End OTP (parent confirms service done)
 */
export const OtpModal = ({ visible, title, subtitle, onConfirm, onCancel }) => {
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const inputs = useRef([]);

  const handleChange = (val, index) => {
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = () => {
    const code = otp.join('');
    if (code.length === 4) {
      setOtp(['', '', '', '']);
      onConfirm(code);
    }
  };

  const handleCancel = () => {
    setOtp(['', '', '', '']);
    onCancel?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => (inputs.current[i] = ref)}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleChange(v.slice(-1), i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  returnKeyType="next"
                  selectTextOnFocus
                />
              ))}
            </View>

            <CustomButton
              title="Confirm & Proceed"
              onPress={handleConfirm}
              disabled={otp.join('').length < 4}
            />
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 50,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray,
    borderRadius: 2,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gray,
    backgroundColor: colors.white,
    fontSize: 24,
    fontFamily: fonts.rubikBold,
    color: colors.description,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.gray,
  },
});
