import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

export const CustomButton = ({ title, onPress, style, textStyle, disabled, variant = 'primary' }) => (
  <TouchableOpacity
    style={[
      styles.button,
      variant === 'outline' && styles.outlineButton,
      variant === 'danger' && styles.dangerButton,
      style,
      disabled && styles.disabledButton,
    ]}
    onPress={disabled ? null : onPress}
    activeOpacity={disabled ? 1 : 0.8}
    disabled={disabled}
  >
    <Text
      style={[
        styles.text,
        variant === 'outline' && styles.outlineText,
        variant === 'danger' && styles.dangerText,
        textStyle,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 8,
  },
  outlineButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.description,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.rubikBold,
    fontWeight: 'bold',
  },
  outlineText: {
    color: colors.description,
  },
  dangerText: {
    color: colors.white,
  },
});
