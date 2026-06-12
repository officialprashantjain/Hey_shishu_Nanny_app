import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/color';
import { fonts } from '../../constants/font';

export const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  inputStyle,
  leftIcon,
  rightIcon,
  onFocus,
  ...props
}) => (
  <View style={styles.container}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputContainer, inputStyle]}>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.gray}
        onFocus={onFocus}
        {...props}
      />
      {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 58,
  },
  iconContainer: {
    marginRight: 12,
  },
  rightIconContainer: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: fonts.rubik,
    color: colors.description,
  },
});
