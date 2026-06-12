import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/color';
import { fonts } from '../constants/font';
import { Ionicons } from '@expo/vector-icons';

export function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        let label;
        if (route.name === 'requests/index') {
          // Changed to alarm/notifications based on image ref
          iconName = isFocused ? 'notifications' : 'notifications-outline';
          label = 'New Jobs';
        } else if (route.name === 'upcoming/index') {
          // Keep upcoming as calendar if it exists in routes
          iconName = isFocused ? 'calendar' : 'calendar-outline';
          label = 'Schedule';
        } else if (route.name === 'ontheway/index') {
          iconName = isFocused ? 'map' : 'map-outline';
          label = 'Route';
        } else if (route.name === 'service/index') {
          iconName = isFocused ? 'play-circle' : 'play-circle-outline';
          label = 'Session';
        } else if (route.name === 'message/index') {
          iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
          label = 'Message';
        }

        if (!iconName) return null;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? colors.primary : colors.description} 
            />
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? colors.primary : colors.description,
                  fontFamily: isFocused ? fonts.rubikBold : fonts.rubik,
                }
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 16,
    paddingHorizontal: 8,
    // Add shadow specifically for the bottom bar popping up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Add a little extra height to padding to make tap area comfortable
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  }
});
