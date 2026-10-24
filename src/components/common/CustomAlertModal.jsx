import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

export const CustomAlertModal = ({
  visible,
  onClose,
  title = 'Notification',
  message = '',
  type = 'success',
  buttonText = 'Got It',
}) => {
  const isError = type === 'error';
  const isInfo = type === 'info';

  const iconName = isError
    ? 'alert-circle'
    : isInfo
    ? 'information-circle'
    : 'mail-unread';

  const iconColor = isError
    ? '#E53935'
    : isInfo
    ? '#4A90E2'
    : colors.primary;

  const iconBg = isError
    ? '#FFEBEE'
    : isInfo
    ? '#E3F2FD'
    : '#E8F5E9';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={36} color={iconColor} />
              </View>

              <Text style={styles.title}>{title}</Text>

              {message ? (
                <Text style={styles.message}>{message}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 15, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts?.chocoShake || 'System',
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: fonts?.rubik || 'System',
    fontSize: 14.5,
    color: colors.description,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontFamily: fonts?.rubikBold || 'System',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CustomAlertModal;
