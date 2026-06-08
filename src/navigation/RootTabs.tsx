import React from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapScreen } from '../screens/MapScreen';
import { LightningScreen } from '../screens/LightningScreen';
import { CourseScreen } from '../screens/CourseScreen';
import { MessageScreen } from '../screens/MessageScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function RootTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        id="WalkFixRootTabs"
        screenOptions={{
          tabBarActiveTintColor: '#FF8C00',
          tabBarInactiveTintColor: '#A2A2A7',
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 24 : 16,
            left: 20,
            right: 20,
            height: 64,
            paddingBottom: 0,
            borderRadius: 20,
            borderTopWidth: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
            overflow: 'hidden',
          },
          headerShown: false,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: -0.2, marginBottom: 8 },
          tabBarIconStyle: { marginTop: 6 },
          swipeEnabled: true,
        } as any}
      >
        <Tab.Screen
          name="산책"
          component={MapScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🗺️</Text> }}
        />
        <Tab.Screen
          name="번개"
          component={LightningScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚡</Text> }}
        />
        <Tab.Screen
          name="코스"
          component={CourseScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🐾</Text> }}
        />
        <Tab.Screen
          name="채팅"
          component={MessageScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💬</Text> }}
        />
        <Tab.Screen
          name="프로필"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
