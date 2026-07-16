import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { getWorkingSchedule, getLeaves } from '../../services/nannyService';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';

// JS Date.getDay() → 0=Sun,1=Mon,...,6=Sat
// Backend schedule uses these exact string keys:
const DAY_NAMES_BY_JS_INDEX = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const WEEK_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip time → midnight local */
function midnight(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Return true if dateObj falls within a leave range (inclusive) */
function isOnLeave(dateObj, leaves) {
  const t = dateObj.getTime();
  return leaves.some((lv) => {
    const start = midnight(new Date(lv.startDateTime)).getTime();
    const end   = midnight(new Date(lv.endDateTime)).getTime();
    return t >= start && t <= end;
  });
}

/** Return true if this weekday is NOT available in the schedule */
function isOffDay(dateObj, scheduleMap) {
  const dayName = DAY_NAMES_BY_JS_INDEX[dateObj.getDay()];
  return !scheduleMap[dayName];
}

/** Build a schedule lookup map: { monday: true, sunday: false, … } */
function buildScheduleMap(schedule) {
  const map = {};
  (schedule || []).forEach((s) => {
    map[s.day] = !!s.isAvailable;
  });
  return map;
}

// ─── Single month grid ───────────────────────────────────────────────────────

function MonthGrid({ year, month, today, scheduleMap, leaves }) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Make Mon=0 ... Sun=6 grid alignment
  let startOffset = firstDay.getDay() - 1; // Mon=0
  if (startOffset === -1) startOffset = 6; // Sunday edge case

  const cells = [];

  // Empty leading cells
  for (let i = 0; i < startOffset; i++) {
    cells.push(<View key={`e-${i}`} style={styles.cell} />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const isPast  = dateObj < today;
    const offDay  = !isPast && isOffDay(dateObj, scheduleMap);
    const onLeave = !isPast && !offDay && isOnLeave(dateObj, leaves);
    const available = !isPast && !offDay && !onLeave;

    let cellStyle  = styles.cell;
    let textStyle  = styles.dayText;
    let dotColor   = null;

    if (isPast) {
      textStyle = [styles.dayText, styles.pastText];
    } else if (offDay) {
      cellStyle = [styles.cell, styles.offDayCell];
      textStyle = [styles.dayText, styles.offDayText];
      dotColor  = '#AAAAAA';
    } else if (onLeave) {
      cellStyle = [styles.cell, styles.leaveCell];
      textStyle = [styles.dayText, styles.leaveText];
      dotColor  = colors.warning;
    } else if (available) {
      cellStyle = [styles.cell, styles.availableCell];
      textStyle = [styles.dayText, styles.availableText];
      dotColor  = colors.primary;
    }

    // Highlight today
    const isToday =
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();

    cells.push(
      <View key={`d-${day}`} style={[cellStyle, isToday && styles.todayCell]}>
        <Text style={[textStyle, isToday && styles.todayText]}>
          {day < 10 ? `0${day}` : day}
        </Text>
        {dotColor && !isToday && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.monthBlock}>
      {/* Month + Year Header */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month].toUpperCase()} {year}
        </Text>
      </View>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEK_HEADER.map((d) => (
          <Text key={d} style={styles.weekLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>{cells}</View>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AvailabilityCalendar() {
  const [scheduleMap, setScheduleMap] = useState({});
  const [leaves, setLeaves]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  const today = midnight(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [schedRes, leaveRes] = await Promise.all([
        getWorkingSchedule(),
        getLeaves(),
      ]);

      if (schedRes?.data?.workingSchedule?.schedule) {
        setScheduleMap(buildScheduleMap(schedRes.data.workingSchedule.schedule));
      }

      const rawLeaves =
        leaveRes?.data?.leaves || leaveRes?.data?.data || [];
      setLeaves(rawLeaves);
    } catch (e) {
      console.error('AvailabilityCalendar error:', e);
      setError('Could not load calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate 12 months starting from the current month
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading calendar…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.headerTitle}>Availability Calendar</Text>
      <Text style={styles.subtext}>
        Showing your availability for the next 12 months.
      </Text>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Available" bg="#E8F5F3" />
        <LegendItem color="#AAAAAA"        label="Off Day"   bg="#F0F0F0" />
        <LegendItem color={colors.warning} label="On Leave"  bg="#FFF3E0" />
        <LegendItem color="#BBBBBB"       label="Past"       bg="transparent" />
      </View>

      {/* Calendar months */}
      {months.map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          today={today}
          scheduleMap={scheduleMap}
          leaves={leaves}
        />
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────
function LegendItem({ color, label, bg }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderRadius: 4 }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: fonts.rubik,
    color: colors.description,
    fontSize: 14,
  },
  errorText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontFamily: fonts.rubik,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
    marginBottom: 16,
    opacity: 0.7,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 5,
  },
  legendLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
  },

  // Month block
  monthBlock: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
  },

  // Weekday row
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    fontWeight: '600',
    opacity: 0.6,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
  },

  // Available
  availableCell: {
    backgroundColor: '#E8F5F3',
    borderRadius: 8,
  },
  availableText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Off day
  offDayCell: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  offDayText: {
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },

  // Leave
  leaveCell: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  leaveText: {
    color: colors.warning,
    fontWeight: '600',
  },

  // Past
  pastText: {
    color: '#CCCCCC',
  },

  // Today
  todayCell: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  todayText: {
    color: colors.white,
    fontWeight: '700',
  },

  // Dot indicator
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
