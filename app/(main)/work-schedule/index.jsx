import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
import { Header } from '../../../src/components/layout/Header';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import ServiceArea from '../../../src/components/work-schedule/ServiceArea';
import WorkingSchedule from '../../../src/components/work-schedule/WorkingSchedule';
import Leave from '../../../src/components/work-schedule/Leave';
import AvailabilityCalendar from '../../../src/components/work-schedule/AvailabilityCalendar';

export default function WorkScheduleScreen() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { key: 0, title: 'Service Area' },
    { key: 1, title: 'Schedule' },
    { key: 2, title: 'Leave' },
    { key: 3, title: 'Calendar' },
  ];

  return (
    <AutocompleteDropdownContextProvider>
      <SafeAreaView style={styles.container}>
        <Header title="Work Schedule" showBack />
        
        {/* Top Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {activeTab === 0 && <ServiceArea />}
          {activeTab === 1 && <WorkingSchedule />}
          {activeTab === 2 && <Leave />}
          {activeTab === 3 && <AvailabilityCalendar />}
        </View>
      </SafeAreaView>
    </AutocompleteDropdownContextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
  },
});
