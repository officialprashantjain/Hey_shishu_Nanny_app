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
import { resolveChildName, resolveChildAge, resolveChildPhoto, resolveChildList } from '../../../src/utils/childHelper';
import { resolveBookingDateAndSchedule, resolveBookingAddress, resolveBookingDistance } from '../../../src/utils/bookingHelper';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const initialChildPhoto = params.childPhoto
    ? typeof params.childPhoto === 'string' && params.childPhoto.startsWith('http')
      ? { uri: params.childPhoto }
      : params.childPhoto
    : require('../../../assets/icons/jack.svg');

  let parsedInitialAddressDetails = null;
  if (params.addressDetails) {
    try {
      parsedInitialAddressDetails = typeof params.addressDetails === 'string'
        ? JSON.parse(params.addressDetails)
        : params.addressDetails;
    } catch (_) {}
  }

  const initialDistance = (params.distance && params.distance !== '1.8 km') ? params.distance : null;

  const [bookingData, setBookingData] = useState({
    id: params.id || '',
    parentId: params.parentId || params.receiverId || null,
    parentName: resolveParentName(params.parentName, params.parentPhone),
    parentPhone: resolveParentPhone(params.parentPhone),
    parentPhoto: params.parentPhoto || require('../../../assets/icons/nanny-image.svg'),
    address: parsedInitialAddressDetails?.formattedFullAddress || params.address || 'Address not specified',
    addressDetails: parsedInitialAddressDetails,
    distance: initialDistance,
    childName: params.childName || 'Child',
    childAge: params.childAge || '',
    childPhoto: initialChildPhoto,
    childNotes: params.childNotes || '',
    children: [],
    date: params.date || '',
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
          const b = res?.data?.booking || res?.data?.data?.booking || res?.booking;
          if (b) {
            const p = b.parentId;
            const contact = b.contactNumber;
            const resolvedName = resolveParentName(p, contact);
            const resolvedPhone = resolveParentPhone(p, contact);
            const childrenList = resolveChildList(b.childIds);
            const cName = resolveChildName(b.childIds, null);
            const cAge = resolveChildAge(b.childIds);
            const cPhoto = resolveChildPhoto(b.childIds);

            // Format dates accurately using bookingDate & slots
            const schedule = resolveBookingDateAndSchedule(b);
            const addressInfo = resolveBookingAddress(b.address);
            const dynamicDistance = resolveBookingDistance(b);

            setBookingData((prev) => ({
              ...prev,
              parentId: p?._id || prev.parentId,
              parentName: resolvedName || prev.parentName,
              parentPhone: resolvedPhone || prev.parentPhone,
              parentPhoto: p?.profileImage?.url || p?.profileImage || prev.parentPhoto,
              address: addressInfo.formattedFullAddress || prev.address,
              addressDetails: addressInfo,
              distance: dynamicDistance || prev.distance,
              childName: cName || prev.childName,
              childAge: cAge || prev.childAge,
              childPhoto: cPhoto || prev.childPhoto,
              childNotes: b.parentNotes || prev.childNotes,
              children: childrenList,
              date: schedule.dateStr || prev.date,
              time: schedule.timeStr || prev.time,
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
            <Ionicons name="location" size={22} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.addressText}>{bookingData.address}</Text>

              {/* Manually Filled Address Details */}
              {(!!bookingData.addressDetails?.flatNumber ||
                !!bookingData.addressDetails?.landmark ||
                (!!bookingData.addressDetails?.fullAddressText &&
                  bookingData.addressDetails.fullAddressText !== bookingData.addressDetails?.mapLocation &&
                  !bookingData.addressDetails?.mapLocation?.includes(bookingData.addressDetails.fullAddressText))) ? (
                <View style={styles.addressSectionBox}>
                  <Text style={styles.addressSubHeader}>MANUAL DETAILS (FILLED BY PARENT)</Text>
                  {!!bookingData.addressDetails?.flatNumber && (
                    <Text style={styles.addressDetailRow}>
                      🏠 <Text style={styles.addressLabelBold}>Flat / House / Floor:</Text> {bookingData.addressDetails.flatNumber}
                    </Text>
                  )}
                  {!!bookingData.addressDetails?.landmark && (
                    <Text style={styles.addressDetailRow}>
                      📍 <Text style={styles.addressLabelBold}>Landmark:</Text> {bookingData.addressDetails.landmark}
                    </Text>
                  )}
                  {!!bookingData.addressDetails?.fullAddressText &&
                    bookingData.addressDetails.fullAddressText !== bookingData.addressDetails.mapLocation &&
                    !bookingData.addressDetails?.mapLocation?.includes(bookingData.addressDetails.fullAddressText) && (
                    <Text style={styles.addressDetailRow}>
                      📝 <Text style={styles.addressLabelBold}>House / Street:</Text> {bookingData.addressDetails.fullAddressText}
                    </Text>
                  )}
                </View>
              ) : null}

              {/* Google Map Selected Location */}
              {!!bookingData.addressDetails?.mapLocation && (
                <View style={[styles.addressSectionBox, { marginTop: 8 }]}>
                  <Text style={styles.addressSubHeader}>GOOGLE MAP LOCATION</Text>
                  <Text style={styles.addressDetailRow}>
                    🗺️ <Text style={styles.addressLabelBold}>Area & City:</Text> {bookingData.addressDetails.mapLocation}
                  </Text>
                </View>
              )}

              {Boolean(bookingData.distance) && (
                <Text style={styles.distanceText}>{bookingData.distance} away</Text>
              )}
            </View>
          </View>
        </View>

        {/* Child Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>
            {bookingData.children.length > 1 ? `Children Details (${bookingData.children.length})` : 'Child Details'}
          </Text>
          {bookingData.children && bookingData.children.length > 0 ? (
            bookingData.children.map((child, idx) => (
              <View
                key={child._id || idx}
                style={[
                  styles.profileRow,
                  idx > 0 && { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
                ]}
              >
                <Image source={child.photoSource} style={styles.avatarSmall} contentFit="cover" />
                <View style={styles.profileInfo}>
                  <Text style={styles.nameSmall}>{child.name}</Text>
                  <Text style={styles.subtextSmall}>
                    {child.ageText || ''}
                    {child.gender ? ` • ${child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}` : ''}
                  </Text>
                  {Array.isArray(child.allergies) && child.allergies.length > 0 && (
                    <Text style={[styles.subtextSmall, { color: '#E11D48', marginTop: 4, fontWeight: '600' }]}>
                      ⚠️ Allergies: {child.allergies.join(', ')}
                    </Text>
                  )}
                  {!!child.specialNeeds && (
                    <Text style={[styles.subtextSmall, { color: '#D97706', marginTop: 2 }]}>
                      ℹ️ Special Needs: {child.specialNeeds}
                    </Text>
                  )}
                  {!!child.medicalNotes && (
                    <Text style={[styles.subtextSmall, { color: '#4B5563', marginTop: 2 }]}>
                      💊 Medical: {child.medicalNotes}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.profileRow}>
              <Image source={bookingData.childPhoto} style={styles.avatarSmall} contentFit="cover" />
              <View style={styles.profileInfo}>
                <Text style={styles.nameSmall}>{bookingData.childName}</Text>
                {!!bookingData.childAge && <Text style={styles.subtextSmall}>{bookingData.childAge}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Date & Time</Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.description} />
            <Text style={styles.infoText}>
              {bookingData.date && bookingData.time
                ? `${bookingData.date} | ${bookingData.time}`
                : bookingData.date || bookingData.time || 'Schedule not specified'}
            </Text>
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
    marginTop: 6,
    color: colors.secondary,
    fontFamily: fonts.rubikBold,
    fontSize: 12,
  },
  addressSectionBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  addressSubHeader: {
    fontFamily: fonts.rubikBold,
    fontSize: 10,
    color: colors.description,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressDetailRow: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.primary,
    marginTop: 3,
    lineHeight: 18,
  },
  addressLabelBold: {
    fontFamily: fonts.rubikBold,
    color: colors.primary,
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
