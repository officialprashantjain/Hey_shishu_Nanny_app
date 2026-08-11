import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput } from 'react-native';
import { colors } from '../../../../constants/color';
import { fonts } from '../../../../constants/font';
import { RequestCard } from '../../../../src/components/features/RequestCard';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingBookings, fetchCompletedBookings, fetchCancelledBookings, setBookingStatus, selectPendingBookings, selectCompletedBookings, selectCancelledBookings, selectBookingLoading } from '../../../../src/redux/slices/bookingSlice';
import { useAlert } from '../../../../src/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';

export default function RequestsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('pending');

  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [selectedDeclineId, setSelectedDeclineId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const pendingBookings = useSelector(selectPendingBookings);
  const completedBookings = useSelector(selectCompletedBookings);
  const cancelledBookings = useSelector(selectCancelledBookings);

  const getActiveArray = () => {
    if (activeTab === 'completed') return completedBookings;
    if (activeTab === 'cancelled') return cancelledBookings;
    return pendingBookings;
  };
  
  const activeBookings = getActiveArray();
  const isLoading = useSelector(selectBookingLoading);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'completed') dispatch(fetchCompletedBookings());
      else if (activeTab === 'cancelled') dispatch(fetchCancelledBookings());
      else dispatch(fetchPendingBookings());
    }, [dispatch, activeTab])
  );

  const handleAccept = async (id) => {
    try {
      const resultAction = await dispatch(setBookingStatus({ id, status: 'confirmed' }));
      if (setBookingStatus.fulfilled.match(resultAction)) {
        showAlert('Success', 'Booking accepted successfully!');
      } else {
        showAlert('Error', resultAction.payload || 'Failed to accept booking');
      }
    } catch (e) {
      showAlert('Error', 'Unexpected error occurred');
    }
  };

  const handleDeclineClick = (id) => {
    setSelectedDeclineId(id);
    setDeclineReason('');
    setDeclineModalVisible(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      return showAlert('Error', 'Please provide a reason for declining.');
    }
    try {
      const resultAction = await dispatch(setBookingStatus({ id: selectedDeclineId, status: 'cancelled', reason: declineReason }));
      if (setBookingStatus.fulfilled.match(resultAction)) {
        showAlert('Success', 'Booking declined.');
        setDeclineModalVisible(false);
      } else {
        showAlert('Error', resultAction.payload || 'Failed to decline booking');
      }
    } catch (e) {
      showAlert('Error', 'Unexpected error occurred');
    }
  };

  const mapBookingToCard = (booking) => {
    const start = new Date(booking.startDateTime);
    const end = new Date(booking.endDateTime);
    const startDateStr = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDateStr = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const finalDateStr = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
    
    // Format AM/PM time
    const startTimeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
    
    // Calculate duration
    let diffHours = booking.totalSlotHours || (Math.abs(end - start) / 36e5);
    diffHours = diffHours % 1 === 0 ? diffHours : Number(diffHours).toFixed(1);
    
    return {
      id: booking._id,
      childName: booking.childIds?.[0]?.firstName || 'Aarav Mehta',
      age: booking.childIds?.[0]?.age ? `${booking.childIds[0].age} Years Old` : '2.5 Years Old',
      type: booking.bookingType || 'hourly',
      date: finalDateStr,
      time: `${startTimeStr} – ${endTimeStr}`,
      duration: `${diffHours} Hours`,
      location: `${booking.address?.area || 'Sector 45'}, ${booking.address?.city || 'Noida'}`,
      distance: '1.8 km', 
      totalAmount: booking.totalAmount != null ? `₹${booking.totalAmount}` : null,
      notes: booking.parentNotes || '',
      photo: require('../../../../assets/icons/nanny-image.svg'), // Using fallback image that exists
      
      fullAddress: booking.address?.fullAddress || `${booking.address?.area || ''} ${booking.address?.city || ''}`,
      parentName: booking.parentId?.fullName || 'Sneha Sharma',
      parentPhone: booking.contactNumber || booking.parentId?.phoneNumber || '',
    };
  };

  const handleViewRequestDetails = (mappedBooking) => {
    router.push({
      pathname: '/(main)/booking-details',
      params: {
        id: mappedBooking.id,
        parentName: mappedBooking.parentName,
        parentPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/12.jpg',
        address: mappedBooking.fullAddress,
        distance: mappedBooking.distance,
        childName: mappedBooking.childName,
        childAge: mappedBooking.age,
        childPhoto: 'https://xsgames.co/randomusers/assets/avatars/male/40.jpg',
        childNotes: mappedBooking.notes,
        date: mappedBooking.date,
        time: mappedBooking.time,
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.activeTab]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>New Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.activeTab]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]} onPress={() => setActiveTab('cancelled')}>
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && activeBookings.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : activeBookings.length === 0 ? (
          <Text style={styles.emptyText}>No {activeTab} bookings found.</Text>
        ) : (
          activeBookings.map(booking => {
            const mapped = mapBookingToCard(booking);
            let headerTitle = 'New Booking Request';
            let subtext = 'Be the first to accept';
            let hideTimer = false;
            
            if (activeTab === 'completed') {
              headerTitle = 'Completed Service';
              subtext = 'This session was completed successfully.';
              hideTimer = true;
            } else if (activeTab === 'cancelled') {
              headerTitle = 'Cancelled Booking';
              subtext = 'This booking was cancelled.';
              hideTimer = true;
            }

            return (
              <RequestCard 
                key={mapped.id}
                data={mapped} 
                headerTitle={headerTitle}
                subtext={subtext}
                hideTimer={hideTimer}
                onAccept={activeTab === 'pending' ? () => handleAccept(mapped.id) : null}
                onDecline={activeTab === 'pending' ? () => handleDeclineClick(mapped.id) : null}
                onViewDetails={() => handleViewRequestDetails(mapped)}
              />
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Decline Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={declineModalVisible}
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Decline Request</Text>
            <Text style={styles.modalSub}>Please provide a reason for declining.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Not available, Too far..."
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setDeclineModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleDeclineSubmit}>
                <Text style={styles.modalBtnSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, 
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  activeTabText: {
    fontFamily: fonts.rubikBold,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 18,
    color: colors.primary,
    marginBottom: 8,
  },
  modalSub: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    padding: 12,
    fontFamily: fonts.rubik,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  modalBtnCancelText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: colors.description,
  },
  modalBtnSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.error || '#E53935',
  },
  modalBtnSubmitText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: '#fff',
  }
});
