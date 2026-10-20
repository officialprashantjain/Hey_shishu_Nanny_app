import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomImage as Image } from '../../../src/components/common/CustomImage';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import meetingService from '../../../src/services/meetingService';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'webinar', label: 'Webinars' },
  { key: 'one_to_one', label: '1-to-1' },
  { key: 'group', label: 'Group' },
];

export default function NannyMeetingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const effectiveTopInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);

  const [activeTab, setActiveTab] = useState('all');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      console.log('[Nanny Meetings] 📡 Fetching nanny meetings from backend...');
      const res = await meetingService.listMyMeetings();
      const list = res?.data?.meetings || res?.meetings || [];
      console.log(`[Nanny Meetings] ✅ Loaded ${list.length} meetings`);
      setMeetings(list);
    } catch (err) {
      console.warn('[Nanny Meetings] ⚠️ Error loading meetings:', err?.response?.data || err?.message || err);
      setError('Could not load meetings. Please pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Filter meetings by tab
  const filteredMeetings = meetings.filter((m) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'webinar') return m.meetingType === 'webinar';
    if (activeTab === 'one_to_one') return m.meetingType === 'one_to_one';
    if (activeTab === 'group') return m.meetingType === 'group';
    return true;
  });

  const handleJoinMeeting = (meeting) => {
    console.log(`[Nanny Meetings] 🚀 Joining meeting: ${meeting._id} (${meeting.title})`);
    router.push({
      pathname: '/(main)/meeting/[meetingId]',
      params: { meetingId: meeting._id },
    });
  };

  const formatSchedule = (dateString, durationMinutes) => {
    if (!dateString) return { date: '—', time: '—' };
    const d = new Date(dateString);
    const date = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { date, time, duration: durationMinutes ? `${durationMinutes}m` : null };
  };

  const renderBadgeType = (type, pairType) => {
    if (type === 'webinar') {
      return (
        <View style={[styles.typeBadge, { backgroundColor: '#EDE9FE' }]}>
          <Text style={[styles.typeBadgeText, { color: '#6D28D9' }]}>Webinar</Text>
        </View>
      );
    }
    if (type === 'one_to_one') {
      const isParent = pairType === 'parent_nanny' || pairType === 'counselor_parent';
      return (
        <View style={[styles.typeBadge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.typeBadgeText, { color: '#047857' }]}>
            {isParent ? '1-to-1 Parent' : '1-to-1 Counselor'}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.typeBadge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.typeBadgeText, { color: '#B45309' }]}>Group Call</Text>
      </View>
    );
  };

  const renderMeetingCard = ({ item }) => {
    const isLive = item.status === 'live';
    const isEnded = item.status === 'ended';
    const isScheduled = item.status === 'scheduled';
    const schedule = formatSchedule(item.scheduledAt, item.durationMinutes);
    const hostName = item.counselorId?.name || (item.pairType === 'parent_nanny' ? 'Parent & Nanny' : 'Counselor');

    return (
      <View style={[styles.card, isLive && styles.liveCardBorder]}>
        {/* Top Badges Row */}
        <View style={styles.cardHeaderRow}>
          {renderBadgeType(item.meetingType, item.pairType)}

          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>LIVE NOW</Text>
            </View>
          ) : isEnded ? (
            <View style={styles.endedBadge}>
              <Text style={styles.endedBadgeText}>Ended</Text>
            </View>
          ) : (
            <View style={styles.scheduledBadge}>
              <Text style={styles.scheduledBadgeText}>Scheduled</Text>
            </View>
          )}
        </View>

        {/* Meeting Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Host / Participant Info */}
        <View style={styles.hostRow}>
          <Text style={styles.hostIcon}>👤</Text>
          <Text style={styles.hostText} numberOfLines={1}>
            Hosted by <Text style={styles.hostNameHighlight}>{hostName}</Text>
          </Text>
        </View>

        {/* Schedule & Duration Info */}
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleCol}>
            <Text style={styles.scheduleLabel}>Date</Text>
            <Text style={styles.scheduleVal}>{schedule.date}</Text>
          </View>
          <View style={styles.scheduleDivider} />
          <View style={styles.scheduleCol}>
            <Text style={styles.scheduleLabel}>Time</Text>
            <Text style={styles.scheduleVal}>{schedule.time}</Text>
          </View>
          {schedule.duration && (
            <>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleCol}>
                <Text style={styles.scheduleLabel}>Duration</Text>
                <Text style={styles.scheduleVal}>{schedule.duration}</Text>
              </View>
            </>
          )}
        </View>

        {/* Action Button */}
        {isLive ? (
          <TouchableOpacity
            style={styles.joinButtonLive}
            onPress={() => handleJoinMeeting(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.joinButtonIcon}>📹</Text>
            <Text style={styles.joinButtonText}>
              {item.meetingType === 'webinar' ? 'Join Webinar' : 'Join Call'}
            </Text>
          </TouchableOpacity>
        ) : isScheduled ? (
          <TouchableOpacity
            style={styles.joinButtonScheduled}
            onPress={() => handleJoinMeeting(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.joinButtonTextScheduled}>
              Starts at {schedule.time}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Meeting Completed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && insets.top === 0 && { paddingTop: effectiveTopInset },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../../assets/icons/left-arrow.svg')}
            style={styles.backIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meetings</Text>
        <TouchableOpacity
          onPress={() => fetchMeetings(true)}
          style={styles.refreshHeaderBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshIconText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Filter Bar */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading meetings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMeetings()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMeetings}
          keyExtractor={(item) => item._id}
          renderItem={renderMeetingCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMeetings(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Meetings Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'webinar'
                  ? 'There are no active or scheduled webinars for you at this moment.'
                  : activeTab === 'one_to_one'
                  ? 'There are no 1-to-1 meetings scheduled for you.'
                  : activeTab === 'group'
                  ? 'There are no group sessions scheduled.'
                  : 'You do not have any meetings scheduled at this moment.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.primary,
  },
  refreshHeaderBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIconText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.background,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(52, 105, 96, 0.15)',
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  tabButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
  },
  activeTabText: {
    fontFamily: fonts.rubikBold,
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 105, 96, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  liveCardBorder: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontFamily: fonts.rubikBold,
    fontSize: 11,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  liveBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontFamily: fonts.rubikBold,
  },
  scheduledBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduledBadgeText: {
    color: '#0369A1',
    fontSize: 11,
    fontFamily: fonts.rubik,
  },
  endedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  endedBadgeText: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: fonts.rubik,
  },
  cardTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 16,
    color: colors.description,
    lineHeight: 22,
    marginBottom: 8,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  hostText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: '#64748B',
  },
  hostNameHighlight: {
    fontFamily: fonts.rubikBold,
    color: colors.description,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  scheduleCol: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  scheduleLabel: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  scheduleVal: {
    fontFamily: fonts.rubikBold,
    fontSize: 12,
    color: colors.description,
  },
  joinButtonLive: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  joinButtonIcon: {
    fontSize: 15,
  },
  joinButtonText: {
    fontFamily: fonts.rubikBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  joinButtonScheduled: {
    backgroundColor: '#E6F0EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 105, 96, 0.2)',
  },
  joinButtonTextScheduled: {
    fontFamily: fonts.rubikBold,
    fontSize: 13,
    color: colors.primary,
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  disabledButtonText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: '#94A3B8',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.primary,
  },
  errorText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.rubikBold,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 17,
    color: colors.description,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
