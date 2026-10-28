import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../src/components/common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { promptAndStartCall } from '../../../src/utils/callLauncher';
import { resolveParentName, resolveParentPhone, getCleanPhoneNumber } from '../../../src/utils/parentHelper';
import { getBookingDetailAsNanny } from '../../../src/services/bookingService';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [bookingData, setBookingData] = useState({
    id: params.id || '',
    parentId: params.parentId || params.receiverId || null,
    parentName: resolveParentName(params.parentName, params.parentPhone),
    parentPhone: resolveParentPhone(params.parentPhone),
    parentPhoto: params.parentPhoto || require('../../../assets/icons/nanny-image.svg'),
    address: params.address || 'Address not specified',
    distance: params.distance || '1.8 km',
    childName: params.childName || 'Child',
    childAge: params.childAge || '',
    childPhoto: params.childPhoto || require('../../../assets/icons/nanny-image.svg'),
    childNotes: params.childNotes || '',
    date: params.date || 'Today',
    time: params.time || '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (params.id) {
      setLoading(true);
      getBookingDetailAsNanny(params.id)
        .then((res) => {
          if (!isMounted) return;
          const b = res?.data?.data?.booking;
          if (b) {
            const p = b.parentId;
            const contact = b.contactNumber;
            const resolvedName = resolveParentName(p, contact);
            const resolvedPhone = resolveParentPhone(p, contact);
            const child = b.childIds?.[0];
            const cName = child ? `${child.firstName || ''} ${child.lastName || ''}`.trim() : null;
            const cAge = child?.age ? `${child.age} Years Old` : child?.dateOfBirth ? `${new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} Years Old` : null;

            // Format dates
            let dateStr = bookingData.date;
            let timeStr = bookingData.time;
            if (b.startDateTime && b.endDateTime) {
              const start = new Date(b.startDateTime);
              const end = new Date(b.endDateTime);
              dateStr = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
              timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
            }

            setBookingData((prev) => ({
              ...prev,
              parentId: p?._id || prev.parentId,
              parentName: resolvedName || prev.parentName,
              parentPhone: resolvedPhone || prev.parentPhone,
              parentPhoto: p?.profileImage?.url || p?.profileImage || prev.parentPhoto,
              address: b.address?.fullAddress || `${b.address?.area || ''} ${b.address?.city || ''}`.trim() || prev.address,
              childName: cName || prev.childName,
              childAge: cAge || prev.childAge,
              childNotes: b.parentNotes || prev.childNotes,
              date: dateStr,
              time: timeStr,
            }));
          }
        })
        .catch((err) => {
          console.log('[BookingDetails] Backend fetch error:', err?.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [params.id]);

  const handleMessageParent = () => {
    router.push({
      pathname: '/(main)/messages/chat',
      params: { 
        name: bookingData.parentName, 
        parentId: bookingData.parentId,
        receiverId: bookingData.parentId,
        bookingId: bookingData.id,
        photo: bookingData.parentPhoto,
        subject: 'Babysitting',
      }
    });
  };


  const handleCallParent = () => {
    promptAndStartCall({
      router,
      receiverId: bookingData.parentId,
      receiverName: bookingData.parentName,
      receiverPhoto: bookingData.parentPhoto,
      bookingId: bookingData.id,
      phone: bookingData.parentPhone,
    });
  };

  const handleDirectDial = () => {
    if (bookingData.parentPhone) {
      Linking.openURL(`tel:${getCleanPhoneNumber(bookingData.parentPhone)}`);
    } else {
      handleCallParent();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image
              source={require('../../../assets/icons/left-arrow.svg')}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Parent Details</Text>
          <View style={styles.profileRow}>
            <Image source={bookingData.parentPhoto} style={styles.avatar} contentFit="cover" />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{bookingData.parentName}</Text>
              <Text style={styles.subtext}>Primary Contact</Text>
              
              {!!bookingData.parentPhone && (
                <TouchableOpacity 
                  style={styles.phoneBadge}
                  onPress={handleDirectDial}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={12} color={colors.primary} />
                  <Text style={styles.phoneText}>{bookingData.parentPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.iconActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleMessageParent}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary }]} onPress={handleCallParent}>
                <Ionicons name="call" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Address</Text>
          <View style={styles.addressBox}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.addressText}>{bookingData.address}</Text>
              <Text style={styles.distanceText}>{bookingData.distance} away</Text>
            </View>
          </View>
        </View>

        {/* Child Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Child Details</Text>
          <View style={styles.profileRow}>
            <Image source={bookingData.childPhoto} style={styles.avatarSmall} contentFit="cover" />
            <View style={styles.profileInfo}>
              <Text style={styles.nameSmall}>{bookingData.childName}</Text>
              {!!bookingData.childAge && <Text style={styles.subtextSmall}>{bookingData.childAge}</Text>}
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.description} />
            <Text style={styles.infoText}>{bookingData.date} {bookingData.time ? `| ${bookingData.time}` : ''}</Text>
          </View>
        </View>

        {/* Notes from Parent */}
        {!!bookingData.childNotes && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Important Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{bookingData.childNotes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafeArea: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.description,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  cardSectionTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.description,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  avatarSmall: {
    width: 44,
    height: 44,
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
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  phoneText: {
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    color: colors.primary,
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  notesText: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 13,
    lineHeight: 18,
  },
});
