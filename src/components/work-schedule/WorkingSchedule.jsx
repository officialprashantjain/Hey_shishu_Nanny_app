import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Modal, ScrollView, SafeAreaView } from 'react-native';
import { getWorkingSchedule, updateWorkingSchedule } from '../../services/nannyService';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { useAlert } from '../../contexts/AlertContext';

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

// Generate simple hourly time slots for dropdown
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const hour = i < 10 ? `0${i}` : `${i}`;
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  slots.push('24:00');
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function WorkingSchedule() {
  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map(day => ({
      day,
      isAvailable: false,
      startTime: '09:00',
      endTime: '18:00',
    }))
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Time Picker Modal State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState(''); // 'start' or 'end'
  const [currentPickerDay, setCurrentPickerDay] = useState('');
  
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await getWorkingSchedule();
      if (response?.data?.workingSchedule?.schedule) {
        setSchedule(response.data.workingSchedule.schedule);
      }
    } catch (error) {
      console.log('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        timezone: 'Asia/Kolkata',
        schedule: schedule,
      };
      const response = await updateWorkingSchedule(payload);
      if (response.status === 'success') {
        showAlert('Success', 'Working schedule updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', error.message || 'An error occurred while saving the schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day) => {
    setSchedule(prev => prev.map(s => 
      s.day === day ? { ...s, isAvailable: !s.isAvailable } : s
    ));
  };

  const openTimePicker = (day, type) => {
    setCurrentPickerDay(day);
    setCurrentPickerType(type); // 'start' or 'end'
    setTimePickerVisible(true);
  };

  const saveTimeSelection = (time) => {
    setSchedule(prev => prev.map(s => {
      if (s.day === currentPickerDay) {
        if (currentPickerType === 'start') {
          return { ...s, startTime: time };
        } else {
          return { ...s, endTime: time };
        }
      }
      return s;
    }));
    setTimePickerVisible(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Working Schedule</Text>
        <Text style={styles.subtext}>Set your weekly availability (Asia/Kolkata).</Text>

        {schedule.map((item, index) => (
          <View key={item.day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>{item.day.charAt(0).toUpperCase() + item.day.slice(1)}</Text>
              <Switch
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.gray}
                onValueChange={() => toggleDay(item.day)}
                value={item.isAvailable}
              />
            </View>

            {item.isAvailable && (
              <View style={styles.timeSelectionContainer}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <TouchableOpacity style={styles.timeButton} onPress={() => openTimePicker(item.day, 'start')}>
                    <Text style={styles.timeButtonText}>{item.startTime || '09:00'}</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.toText}>to</Text>
                
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>End</Text>
                  <TouchableOpacity style={styles.timeButton} onPress={() => openTimePicker(item.day, 'end')}>
                    <Text style={styles.timeButtonText}>{item.endTime || '18:00'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Divider */}
            {index < schedule.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Time Picker Modal */}
      <Modal visible={timePickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {currentPickerType === 'start' ? 'Start' : 'End'} Time
            </Text>
            <ScrollView style={styles.timeList}>
              {TIME_SLOTS.map(time => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeOption}
                  onPress={() => saveTimeSelection(time)}
                >
                  <Text style={styles.timeOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTimePickerVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  headerTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 5,
  },
  subtext: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 25,
  },
  dayContainer: {
    marginBottom: 15,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontFamily: fonts.rubik,
    fontSize: 18,
    color: colors.description,
    fontWeight: '600',
  },
  timeSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    marginBottom: 5,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  toText: {
    marginHorizontal: 15,
    fontFamily: fonts.rubik,
    color: colors.description,
    alignSelf: 'center',
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray,
    marginVertical: 10,
    opacity: 0.5,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
    elevation: 3,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.rubik,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: fonts.rubik,
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timeList: {
    width: '100%',
  },
  timeOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    alignItems: 'center',
  },
  timeOptionText: {
    fontFamily: fonts.rubik,
    fontSize: 18,
    color: colors.description,
  },
  modalCancelBtn: {
    marginTop: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 10,
  },
  modalCancelText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    fontWeight: 'bold',
  },
});
