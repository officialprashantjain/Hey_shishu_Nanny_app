import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { registerCallModalListener, initiateOutgoingCall } from '../../utils/callLauncher';

/**
 * Beautiful, branded contact sheet matching HeyShishu Nanny app theme.
 * Replaces default system alerts with a sleek bottom-sheet modal.
 */
export default function CallOptionModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [callData, setCallData] = useState(null);

  useEffect(() => {
    const unregister = registerCallModalListener((data) => {
      setCallData(data);
      setVisible(true);
    });
    return () => {
      if (typeof unregister === 'function') {
        unregister();
      }
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setCallData(null);
  };

  if (!visible || !callData) {
    return null;
  }

  const {
    receiverId,
    receiverName = 'Parent',
    receiverPhoto = null,
    bookingId = null,
    phone = null,
    router: passedRouter,
  } = callData;

  const activeRouter = passedRouter || router;

  const handleVideoCall = () => {
    handleClose();
    initiateOutgoingCall({
      router: activeRouter,
      receiverId,
      receiverName,
      receiverPhoto,
      bookingId,
      callType: 'video',
    });
  };

  const handleAudioCall = () => {
    handleClose();
    initiateOutgoingCall({
      router: activeRouter,
      receiverId,
      receiverName,
      receiverPhoto,
      bookingId,
      callType: 'audio',
    });
  };

  const handleDirectDial = () => {
    handleClose();
    if (phone) {
      const cleanPhone = String(phone).replace(/[^\d+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
        console.warn('Could not open phone dialer:', err);
        Alert.alert('Notice', 'Could not open phone dialer.');
      });
    }
  };

  const getInitial = (name) => {
    if (!name) return 'P';
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : 'P';
  };

  const hasPhoto = Boolean(
    receiverPhoto &&
    (typeof receiverPhoto === 'number' || (typeof receiverPhoto === 'string' && receiverPhoto.length > 0))
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle indicator */}
              <View style={styles.dragHandle} />

              {/* Close Button top-right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#71717A" />
              </TouchableOpacity>

              {/* Recipient Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarWrapper}>
                  {hasPhoto ? (
                    <Image
                      source={typeof receiverPhoto === 'string' ? { uri: receiverPhoto } : receiverPhoto}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>{getInitial(receiverName)}</Text>
                    </View>
                  )}
                  <View style={styles.onlineBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.headerInfo}>
                  <View style={styles.tagRow}>
                    <View style={styles.parentTag}>
                      <Text style={styles.parentTagText}>PARENT</Text>
                    </View>
                    <Text style={styles.activeBookingDot}>•</Text>
                    <Text style={styles.activeBookingText}>Active Booking</Text>
                  </View>
                  <Text style={styles.receiverName} numberOfLines={1}>
                    {receiverName}
                  </Text>
                  <Text style={styles.subtitleText}>
                    Choose how you want to connect
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Options List */}
              <View style={styles.optionsList}>
                {/* 1. In-App Video Call */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={handleVideoCall}
                  activeOpacity={0.72}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: '#E6F4F1' }]}>
                    <Ionicons name="videocam" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <Text style={styles.optionTitle}>In-App Video Call</Text>
                      <View style={styles.badgeHD}>
                        <Text style={styles.badgeHDText}>HD FREE</Text>
                      </View>
                    </View>
                    <Text style={styles.optionSubtitle}>
                      Direct high-quality face-to-face video
                    </Text>
                  </View>
                  <View style={styles.chevronBox}>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                {/* 2. In-App Voice Call */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={handleAudioCall}
                  activeOpacity={0.72}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: '#EDF5F2' }]}>
                    <Ionicons name="call" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <Text style={styles.optionTitle}>In-App Voice Call</Text>
                      <View style={[styles.badgeHD, { backgroundColor: '#E8F3EE' }]}>
                        <Text style={[styles.badgeHDText, { color: colors.primary }]}>FREE</Text>
                      </View>
                    </View>
                    <Text style={styles.optionSubtitle}>
                      Crystal-clear voice call over internet
                    </Text>
                  </View>
                  <View style={styles.chevronBox}>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                {/* 3. Direct Phone Call (SIM/Carrier) */}
                {phone ? (
                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={handleDirectDial}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.optionIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="phone-portrait-outline" size={22} color="#D97706" />
                    </View>
                    <View style={styles.optionContent}>
                      <View style={styles.optionTitleRow}>
                        <Text style={styles.optionTitle}>Direct Cellular Call</Text>
                        <View style={[styles.badgeHD, { backgroundColor: '#FDE68A' }]}>
                          <Text style={[styles.badgeHDText, { color: '#B45309' }]}>SIM</Text>
                        </View>
                      </View>
                      <Text style={styles.optionSubtitle} numberOfLines={1}>
                        {phone} • Standard mobile dialer
                      </Text>
                    </View>
                    <View style={styles.chevronBox}>
                      <Ionicons name="chevron-forward" size={18} color="#D97706" />
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 15, 39, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E0D8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingRight: 36,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#E8F3EE',
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F3EE',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontFamily: fonts?.rubikBold || 'System',
    color: colors.primary,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  parentTag: {
    backgroundColor: '#E8F3EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  parentTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  activeBookingDot: {
    marginHorizontal: 6,
    color: '#9CA3AF',
    fontSize: 12,
  },
  activeBookingText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: fonts?.rubik || 'System',
  },
  receiverName: {
    fontSize: 20,
    fontFamily: fonts?.chocoShake || fonts?.rubikBold || 'System',
    color: colors.description,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#71717A',
    fontFamily: fonts?.rubik || 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2EDE4',
    marginVertical: 16,
  },
  optionsList: {
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#EFE9DF',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 11,
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  optionTitle: {
    fontSize: 15.5,
    fontFamily: fonts?.rubikBold || 'System',
    fontWeight: '700',
    color: colors.description,
    marginRight: 8,
  },
  badgeHD: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  badgeHDText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  optionSubtitle: {
    fontSize: 12.5,
    fontFamily: fonts?.rubik || 'System',
    color: '#71717A',
    lineHeight: 17,
  },
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#EFE9DF',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: fonts?.rubikBold || 'System',
    fontWeight: '600',
    color: '#52525B',
  },
});
