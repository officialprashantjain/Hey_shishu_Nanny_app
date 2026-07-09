import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal, Platform } from 'react-native';
import { getLeaves, addLeave, deleteLeave } from '../../services/nannyService';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { useAlert } from '../../contexts/AlertContext';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const { showAlert } = useAlert();

  // Form State
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reason, setReason] = useState('');

  // Calendar Modal State
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState('start');
  const [calendarMonth, setCalendarMonth] = useState(new Date()); // Tracks the month shown

  useEffect(() => {
    fetchLeaves();
    // Initialize start and end date to today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    setStartDate(formatDateObj(today));
    setEndDate(formatDateObj(tomorrow));
  }, []);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await getLeaves();
      if (response?.data?.leaves) {
        setLeaves(response.data.leaves);
      } else if (response?.data?.data) {
        setLeaves(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching leaves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate) return showAlert('Error', 'Please select dates');
    if (new Date(startDate.value) > new Date(endDate.value)) {
      return showAlert('Error', 'End date cannot be before start date');
    }
    if (!reason.trim()) return showAlert('Error', 'Please provide a reason');

    setIsApplying(true);
    try {
      const payload = {
        startDateTime: `${startDate.value}T00:00:00+05:30`,
        endDateTime: `${endDate.value}T23:59:59+05:30`,
        reason: reason.trim()
      };

      const response = await addLeave(payload);
      if (response.status === 'success') {
        showAlert('Success', 'Leave applied successfully!');
        setReason('');
        fetchLeaves(); 
      } else {
        throw new Error(response.message || 'Failed to apply leave');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', error.message || 'Error applying leave');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancelLeave = (leaveId) => {
    showAlert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave application?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await deleteLeave(leaveId);
              if (response.status === 'success') {
                showAlert('Success', 'Leave cancelled successfully!');
                fetchLeaves();
              } else {
                throw new Error(response.message || 'Failed to cancel leave');
              }
            } catch (error) {
              console.error(error);
              showAlert('Error', error.message || 'Error cancelling leave');
              setIsLoading(false); // only disable loader on error, fetchLeaves handles success
            }
          }
        }
      ]
    );
  };

  //------------------- Calendar Logic -------------------//
  const formatDateObj = (dateInstance) => {
    const isoDate = dateInstance.toISOString().split('T')[0];
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const displayDate = dateInstance.toLocaleDateString('en-US', options);
    return { value: isoDate, label: displayDate };
  };

  const openCalendar = (type) => {
    setCurrentPickerType(type);
    setCalendarMonth(new Date()); 
    setCalendarVisible(true);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(calendarMonth.getMonth() + offset);
    setCalendarMonth(newDate);
  };

  const isPastDate = (dateInstance) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateInstance.setHours(0, 0, 0, 0);
    return dateInstance < today;
  };

  const handleDateSelect = (dateInstance) => {
    if (isPastDate(dateInstance)) return; 

    const dateObj = formatDateObj(dateInstance);
    if (currentPickerType === 'start') {
      setStartDate(dateObj);
      if (endDate && new Date(dateObj.value) > new Date(endDate.value)) {
        setEndDate(dateObj); // Auto adjust end date
      }
    } else {
      setEndDate(dateObj);
    }
    setCalendarVisible(false);
  };

  // Generate Calendar Grid
  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // Get first day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    // Adjust so Mon = 0, Sun = 6
    let firstDayIdx = new Date(year, month, 1).getDay() - 1;
    if (firstDayIdx === -1) firstDayIdx = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const currentSelectedDateStr = currentPickerType === 'start' ? startDate?.value : endDate?.value;
    const days = [];

    // Previous month filler days
    for (let i = 0; i < firstDayIdx; i++) {
       const dayNum = daysInPrevMonth - firstDayIdx + i + 1;
       days.push(
         <View key={`prev-${i}`} style={styles.calendarDayCell}>
           <Text style={styles.otherMonthText}>{dayNum}</Text>
         </View>
       );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
       const dateInstance = new Date(year, month, i);
       // Check if past
       const isPast = isPastDate(dateInstance);
       // Check if selected
       const dateStr = dateInstance.toISOString().split('T')[0];
       const isSelected = currentSelectedDateStr === dateStr;

       days.push(
         <TouchableOpacity 
           key={`curr-${i}`} 
           style={[styles.calendarDayCell, isSelected && styles.selectedDayCell]}
           onPress={() => handleDateSelect(dateInstance)}
           disabled={isPast}
         >
           <Text style={[
             styles.calendarDayText,
             isPast && styles.pastDayText,
             isSelected && styles.selectedDayText
           ]}>{i < 10 ? `0${i}` : i}</Text>
         </TouchableOpacity>
       );
    }

    // Next month filler days (to complete the grid, optionally)
    const remainingCells = 42 - days.length; // max 6 rows of 7
    for (let i = 1; i <= remainingCells; i++) {
        days.push(
         <View key={`next-${i}`} style={styles.calendarDayCell}>
           <Text style={styles.otherMonthText}>{i < 10 ? `0${i}` : i}</Text>
         </View>
       );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* APPLY LEAVE CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apply for Leave</Text>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => openCalendar('start')}>
                <Text style={styles.dateBtnText}>{startDate?.label || 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.spacer} />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => openCalendar('end')}>
                <Text style={styles.dateBtnText}>{endDate?.label || 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reasonGroup}>
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="E.g. Family Function"
              placeholderTextColor={colors.gray}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleApplyLeave} disabled={isApplying}>
            {isApplying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Apply</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* APPLIED LEAVES LIST */}
        <Text style={styles.listTitle}>Applied Leaves</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : leaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leaves found.</Text>
          </View>
        ) : (
          leaves.map((leave, index) => {
            const startDateStr = new Date(leave.startDateTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const endDateStr = new Date(leave.endDateTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            
            return (
              <View key={leave._id || index} style={styles.leaveCard}>
                <View style={styles.leaveHeaderRow}>
                   <Text style={styles.leaveDates}>{startDateStr} - {endDateStr}</Text>
                   <View style={styles.statusRow}>
                     <Text style={[styles.statusBadge, { color: leave.status === 'Approved' ? colors.success : colors.warning }]}>
                        {leave.status || 'Pending'}
                     </Text>
                   </View>
                </View>
                <View style={styles.leaveFooterRow}>
                   <Text style={styles.leaveReason}>{leave.reason}</Text>
                   {/* Provide cancel option if not already rejected, or just allow any */}
                   <TouchableOpacity onPress={() => handleCancelLeave(leave._id)}>
                     <Text style={styles.cancelText}>Cancel</Text>
                   </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdropClose} onPress={() => setCalendarVisible(false)} />
          
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrowBtn}>
                 <Text style={styles.monthArrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.monthArrowBtn, styles.monthArrowBtnRight]}>
                 <Text style={[styles.monthArrow, styles.monthArrowWhite]}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            {/* Calendar Weekdays */}
            <View style={styles.calendarDaysRow}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={i} style={styles.calendarWeekday}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  cardTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
  },
  spacer: {
    width: 15,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 8,
    fontWeight: '600',
  },
  dateBtn: {
    backgroundColor: colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  dateBtnText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  reasonGroup: {
    marginBottom: 20,
  },
  reasonInput: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 80,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
  },
  listTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 22,
    color: colors.primary,
    marginBottom: 15,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  emptyText: {
    fontFamily: fonts.rubik,
    color: colors.gray,
    fontSize: 16,
  },
  leaveCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  leaveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  leaveDates: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: 'bold',
  },
  statusBadge: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusRow: {
    alignItems: 'center',
  },
  leaveFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  leaveReason: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    flex: 1,
  },
  cancelText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.error,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdropClose: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
  },
  calendarContainer: {
    backgroundColor: '#FAF5ED', // Match screenshot background
    borderRadius: 20,
    width: '100%',
    padding: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EAE0D6',
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginBottom: 20,
  },
  monthArrowBtn: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  monthArrowBtnRight: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginLeft: 10,
  },
  monthArrow: {
    fontSize: 16,
    color: colors.description,
    fontWeight: 'bold',
  },
  monthArrowWhite: {
    color: colors.white,
  },
  calendarMonthText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: 'bold',
    minWidth: 100,
    textAlign: 'center',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  calendarWeekday: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  calendarDayText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
  otherMonthText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: '#D4C9BD',
  },
  pastDayText: {
    color: '#D4C9BD',
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
