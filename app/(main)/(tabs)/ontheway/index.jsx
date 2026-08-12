import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Platform, Modal, TextInput,
  KeyboardAvoidingView, ActivityIndicator, Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { CustomImage as Image } from '../../../../src/components/common/CustomImage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { useRouter } from 'expo-router';
import { CustomButton } from '../../../../src/components/common/CustomButton';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOngoingBookings, startRunningBooking, selectOngoingBookings, selectBookingLoading, selectActiveShift, startDailyShift, selectConfirmedBookings, selectOnrunningBookings, fetchOnrunningBookings } from '../../../../src/redux/slices/bookingSlice';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAlert } from '../../../../src/contexts/AlertContext';

const { width } = Dimensions.get('window');

export default function OnTheWayScreen() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const router = useRouter();
  const mapRef = useRef(null);
  const { showAlert } = useAlert();
  
  const dispatch = useDispatch();
  const ongoingBookings = useSelector(selectOngoingBookings);
  const confirmedBookings = useSelector(selectConfirmedBookings);
  const onrunningBookings = useSelector(selectOnrunningBookings);
  const isLoading = useSelector(selectBookingLoading);
  const activeShift = useSelector(selectActiveShift);
  
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchOngoingBookings());
      dispatch(fetchOnrunningBookings()); // Needs to check if master booking is onrunning
    }, [dispatch])
  );
  
  const ACTIVE_JOB = useMemo(() => {
    // ── MULTI-DAY FLOW: Use activeShift + confirmed parent booking ──
    if (activeShift) {
       // Search across all possible status lists for the master booking!
       const parentBooking = 
          confirmedBookings.find(b => b._id === activeShift.bookingId) || 
          ongoingBookings.find(b => b._id === activeShift.bookingId) || 
          onrunningBookings.find(b => b._id === activeShift.bookingId);
       
       if (!parentBooking) return null;
       const start = new Date(parentBooking.startDateTime);
       const end = new Date(parentBooking.endDateTime);
       return {
         id: parentBooking._id,
         isShift: true,
         shiftId: activeShift._id,
         childName: parentBooking.childIds?.[0]?.firstName || 'Aarav Mehta',
         childAge: parentBooking.childIds?.[0]?.age ? `${parentBooking.childIds[0].age} Years Old` : '2.5 Years Old',
         childPhoto: require('../../../../assets/icons/nanny-image.svg'),
         parentName: parentBooking.parentId?.fullName || 'Sneha Sharma',
         parentPhoto: require('../../../../assets/icons/nanny-image.svg'),
         address: parentBooking.address?.fullAddress || `${parentBooking.address?.area || ''} ${parentBooking.address?.city || ''}`,
         distance: '1.8 km',
         childNotes: parentBooking.parentNotes || '',
         date: new Date(activeShift.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
         time: `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`,
         destination: { 
           latitude: parentBooking.serviceLocation?.coordinates?.[1] || 22.7513, 
           longitude: parentBooking.serviceLocation?.coordinates?.[0] || 75.8946 
         },
         fullAddress: parentBooking.address?.fullAddress || '',
       };
    }

    // ── SINGLE-DAY (CLASSIC) FLOW ──
    if (!ongoingBookings || ongoingBookings.length === 0) return null;
    const booking = ongoingBookings[0];
    const start = new Date(booking.startDateTime);
    const end = new Date(booking.endDateTime);
    return {
      id: booking._id,
      childName: booking.childIds?.[0]?.firstName || 'Aarav Mehta',
      childAge: booking.childIds?.[0]?.age ? `${booking.childIds[0].age} Years Old` : '2.5 Years Old',
      childPhoto: require('../../../../assets/icons/nanny-image.svg'),
      parentName: booking.parentId?.fullName || 'Sneha Sharma',
      parentPhoto: require('../../../../assets/icons/nanny-image.svg'),
      address: booking.address?.fullAddress || `${booking.address?.area || ''} ${booking.address?.city || ''}`,
      distance: '1.8 km',
      childNotes: booking.parentNotes || '',
      date: start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`,
      destination: { 
        latitude: booking.serviceLocation?.coordinates?.[1] || 22.7513, 
        longitude: booking.serviceLocation?.coordinates?.[0] || 75.8946 
      },
      fullAddress: booking.address?.fullAddress || '',
    };
  }, [ongoingBookings]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [nannyLocation, setNannyLocation] = useState(null);   // live GPS
  const [locationError, setLocationError] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [routePoints, setRoutePoints] = useState([]);
  const [travelStats, setTravelStats] = useState({ distance: '--', duration: '--' });
  const otpRefs = useRef([]);

  // Fetch route from OSRM (Open Source Routing Machine) - Free
  const fetchOSRMRoute = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM returns coordinates as [longitude, latitude]
        const coords = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        setRoutePoints(coords);
        
        // Convert distance to km and duration to minutes
        const dist = (route.distance / 1000).toFixed(1);
        const dur = Math.round(route.duration / 60);
        setTravelStats({
          distance: `${dist} km`,
          duration: `${dur} min`
        });
      }
    } catch (error) {
      console.error('Error fetching OSRM route:', error);
    }
  };

  // ── Permissions & Live Location ────────────────────────────────────────────
  useEffect(() => {
    let subscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable it in settings.');
        return;
      }

      // Get initial position fast
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = initial.coords;
      const initialLoc = { latitude, longitude };
      setNannyLocation(initialLoc);
      
      if (ACTIVE_JOB) {
        fetchOSRMRoute(initialLoc, ACTIVE_JOB.destination);
      }

      // Watch live position updates
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000,   // every 10 seconds for route refresh
          distanceInterval: 20, // or every 20 metres moved
        },
        (loc) => {
          const { latitude: lat, longitude: lng } = loc.coords;
          const newLoc = { latitude: lat, longitude: lng };
          setNannyLocation(newLoc);
          
          if (ACTIVE_JOB) {
             fetchOSRMRoute(newLoc, ACTIVE_JOB.destination);
          }
        }
      );

      // Fit map to show both markers
      if (mapRef.current && ACTIVE_JOB && initialLoc) {
        mapRef.current.fitToCoordinates(
          [initialLoc, ACTIVE_JOB.destination],
          { edgePadding: { top: 140, right: 40, bottom: 300, left: 40 }, animated: true }
        );
      }
    })();

    return () => { if (subscription) subscription.remove(); };
  }, [ACTIVE_JOB]);

  // ── OTP Handlers
  const handleOtpChange = (text, index) => {
    const numeric = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numeric;
    setOtp(newOtp);
    if (numeric && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      showAlert('Incomplete OTP', 'Please enter the 4-digit OTP provided by the parent.');
      return;
    }
    if (!ACTIVE_JOB) {
      showAlert('Error', 'No active job found.');
      return;
    }
    
    try {
      if (ACTIVE_JOB.isShift) {
        // Multi-Day Secure Flow
        const resultAction = await dispatch(startDailyShift({ 
           shiftId: ACTIVE_JOB.shiftId, 
           otp: enteredOtp,
           location: nannyLocation 
        }));
        if (startDailyShift.fulfilled.match(resultAction)) {
          setShowOtpModal(false);
          setOtp(['', '', '', '']);
          setShowAudioModal(true);
        } else {
          showAlert('Error', resultAction.payload || 'Incorrect OTP or verification failed.');
        }
      } else {
        // Classic Flow
        const resultAction = await dispatch(startRunningBooking({ id: ACTIVE_JOB.id, otp: enteredOtp }));
        if (startRunningBooking.fulfilled.match(resultAction)) {
          setShowOtpModal(false);
          setOtp(['', '', '', '']);
          setShowAudioModal(true);
        } else {
          showAlert('Error', resultAction.payload || 'Incorrect OTP or verification failed.');
        }
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred verifying OTP.');
    }
  };

  // ── Re-center map ─────────────────────────────────────────────────────────
  const handleRecenter = () => {
    if (!nannyLocation || !mapRef.current || !ACTIVE_JOB) return;
    mapRef.current.fitToCoordinates(
      [nannyLocation, ACTIVE_JOB.destination],
      { edgePadding: { top: 140, right: 40, bottom: 300, left: 40 }, animated: true }
    );
  };

  // ── MAP REGION (fallback if GPS not yet acquired) ─────────────────────────
  const mapRegion = (nannyLocation && ACTIVE_JOB)
    ? {
        latitude: (nannyLocation.latitude + ACTIVE_JOB.destination.latitude) / 2,
        longitude: (nannyLocation.longitude + ACTIVE_JOB.destination.longitude) / 2,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      }
    : ACTIVE_JOB ? {
        latitude: ACTIVE_JOB.destination.latitude,
        longitude: ACTIVE_JOB.destination.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      } : null;

  // ── RENDER 
  return (
    <View style={styles.container}>
      {!ACTIVE_JOB ? (
         <View style={styles.emptyState}>
            {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : 
            <Text style={styles.emptyText}>No Active Journey Found.</Text>}
         </View>
      ) : (
      <>
      {/* ── MAP */}
      {locationError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={20} color={colors.white} />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      ) : !nannyLocation ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Acquiring GPS…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          showsUserLocation={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {/* Nanny's live car marker */}
          {nannyLocation && (
            <Marker coordinate={nannyLocation} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.nannyMarker}>
                <Ionicons name="car" size={20} color={colors.white} />
              </View>
            </Marker>
          )}

          {/* Parent / Destination marker */}
          <Marker
            coordinate={ACTIVE_JOB.destination}
            title="Parent Location"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destMarker}>
              <Ionicons name="location" size={32} color={colors.primary} />
            </View>
          </Marker>

          {/* Polyline from Nanny → Parent (Real road path from OSRM) */}
          {routePoints.length > 0 && (
            <Polyline
              coordinates={routePoints}
              strokeColor={colors.secondary}
              strokeWidth={4}
            />
          )}
        </MapView>
      )}

      {/* ── TOP CARD ─────────────────────────────────────────────────────── */}
      {!isFullScreen && <View style={styles.topCard}>
        <View style={styles.topCardRow}>
          <View style={styles.profileSection}>
              <Image source={ACTIVE_JOB.childPhoto} style={styles.avatar} contentFit="cover" />
              <View>
                <Text style={styles.name}>{ACTIVE_JOB.childName}</Text>
                <Text style={styles.age}>{ACTIVE_JOB.childAge}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push({
              pathname: '/(main)/booking-details',
              params: {
                id: ACTIVE_JOB.id,
                parentName: ACTIVE_JOB.parentName,
                parentPhoto: ACTIVE_JOB.parentPhoto,
                address: ACTIVE_JOB.address,
                distance: ACTIVE_JOB.distance,
                childName: ACTIVE_JOB.childName,
                childAge: ACTIVE_JOB.childAge,
                childPhoto: ACTIVE_JOB.childPhoto,
                childNotes: ACTIVE_JOB.childNotes,
                date: ACTIVE_JOB.date,
                time: ACTIVE_JOB.time,
              }
            })}>
              <Text style={styles.detailsText}>Details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.topCardRow}>
          <View style={styles.addressSection}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.addressText} numberOfLines={1}>{ACTIVE_JOB.address}</Text>
          </View>
          <View style={styles.iconActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push({ pathname: '/(main)/messages/chat', params: { name: ACTIVE_JOB.parentName, subject: 'Babysitting' } })}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.callCircleBtn]} onPress={() => router.push('/(main)/messages/incoming_call')}>
              <Ionicons name="call" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>}

      {/* ── MAP CONTROL BUTTONS (Re-center + Fullscreen toggle) ─────────── */}
      <View style={styles.mapControlsRow}>
        {/* Fullscreen expand/collapse */}
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={() => setIsFullScreen(!isFullScreen)}
        >
          <Ionicons
            name={isFullScreen ? 'contract-outline' : 'expand-outline'}
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Re-center */}
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleRecenter}>
          <Ionicons name="locate" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────────────── */}
      {!isFullScreen && <View style={styles.bottomCard}>
        <View style={styles.dragIndicator} />

        <View style={styles.statusRow}>
          <View style={styles.carIconBox}>
            <Ionicons name="car-sport" size={24} color={colors.white} />
          </View>
          <Text style={styles.statusTitle}>You are on the way</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ETA to reach</Text>
            <Text style={styles.statValueBold}>{travelStats.duration}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{travelStats.distance}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.arriveBtn} onPress={() => setShowOtpModal(true)}>
          <Text style={styles.arriveBtnText}>I Have Reached</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Please reach the location and verify OTP</Text>
      </View>}

      {/* ── OTP ARRIVAL VERIFICATION MODAL ───────────────────────────────── */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowOtpModal(false); setOtp(['', '', '', '']); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />

            <View style={styles.modalIconRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
              </View>
            </View>

            <Text style={styles.modalTitle}>Arrival Verification</Text>
            <Text style={styles.modalSub}>
              Ask <Text style={{ fontFamily: fonts.rubikBold, color: colors.primary }}>
                {ACTIVE_JOB.parentName}
              </Text> for the 4-digit OTP to confirm you have arrived.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(r) => (otpRefs.current[idx] = r)}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(t) => handleOtpChange(t, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                />
              ))}
            </View>

            <CustomButton
              title="Verify & Start Session"
              onPress={handleVerifyOtp}
              disabled={otp.some((digit) => !digit)}
              style={{
                borderRadius: 30,
                marginBottom: 14,
              }}
            />

            <TouchableOpacity style={styles.cancelLink} onPress={() => { setShowOtpModal(false); setOtp(['', '', '', '']); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── AUDIO PERMISSION PRE-PROMPT MODAL ────────────────────────────── */}
      <Modal
        visible={showAudioModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAudioModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalSheetCenter}>
            <View style={styles.modalIconBoxCenter}>
              <Ionicons name="mic" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitleCenter}>Microphone Access</Text>
            <Text style={styles.modalSubCenter}>
              Your session is starting. For maximum safety and dispute resolution, the microphone will remain active during the session.
            </Text>

            <CustomButton
              title="Allow Microphone & Start"
              onPress={() => {
                setShowAudioModal(false);
                router.replace('/(main)/(tabs)/service');
              }}
              style={{ borderRadius: 30, marginBottom: 12, width: '100%', backgroundColor: colors.primary }}
            />
            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowAudioModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </>)}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: fonts.rubik, fontSize: 16, color: colors.description },

  // Map loading / error states
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
  },
  errorBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 99,
  },
  errorText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.white,
    flex: 1,
  },

  // Custom Markers
  nannyMarker: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  destMarker: { alignItems: 'center' },

  // TOP CARD
  topCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  topCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 14, marginRight: 12 },
  name: { fontFamily: fonts.rubikBold, fontSize: 16, color: colors.primary },
  age: { fontFamily: fonts.rubik, fontSize: 13, color: colors.description, marginTop: 2 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center' },
  detailsText: { fontFamily: fonts.rubikBold, fontSize: 14, color: colors.primary, marginRight: 2 },
  headerDivider: { height: 1, backgroundColor: '#EAEAEA', marginVertical: 12 },
  addressSection: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  addressText: { fontFamily: fonts.rubik, fontSize: 15, color: colors.primary, marginLeft: 8 },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.white,
  },
  callCircleBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 4, elevation: 3,
  },

  // MAP CONTROL BUTTONS
  mapControlsRow: {
    position: 'absolute',
    bottom: 310,
    right: 16,
    gap: 10,
    alignItems: 'center',
  },
  mapControlBtn: {
    width: 48, height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 4,
  },

  // BOTTOM CARD
  bottomCard: {
    position: 'absolute',
    bottom: 0, width,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.08,
    shadowRadius: 20, elevation: 10,
  },
  dragIndicator: {
    width: 40, height: 4,
    backgroundColor: '#DDDDE0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  carIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  statusTitle: { fontFamily: fonts.rubikBold, fontSize: 18, color: colors.primary },
  statsContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 24, paddingHorizontal: 8,
  },
  statBox: { flex: 1 },
  statLabel: { fontFamily: fonts.rubik, fontSize: 13, color: colors.description, marginBottom: 4 },
  statValueBold: { fontFamily: fonts.rubikBold, fontSize: 24, color: colors.primary },
  statValue: { fontFamily: fonts.rubik, fontSize: 22, color: colors.description },
  verticalDivider: {
    height: 44, width: 1,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 20,
  },
  arriveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 6,
    marginBottom: 14,
  },
  arriveBtnText: { color: colors.white, fontFamily: fonts.rubikBold, fontSize: 18 },
  footerNote: {
    textAlign: 'center', fontFamily: fonts.rubik,
    fontSize: 13, color: colors.description,
  },

  // OTP MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  modalIconRow: { alignItems: 'center', marginBottom: 16 },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 22, color: colors.primary,
    textAlign: 'center', marginBottom: 8,
  },
  modalSub: {
    fontFamily: fonts.rubik,
    fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.description,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: fonts.rubik,
    color: colors.primary,
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  cancelLink: { alignItems: 'center', padding: 8 },
  cancelText: { fontFamily: fonts.rubik, fontSize: 15, color: colors.description },

  // Center Modal styles for Audio Pre-prompt
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheetCenter: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBoxCenter: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleCenter: {
    fontFamily: fonts.rubikBold,
    fontSize: 20, color: colors.primary,
    textAlign: 'center', marginBottom: 12,
  },
  modalSubCenter: {
    fontFamily: fonts.rubik,
    fontSize: 15, color: colors.description,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24,
  },
});
