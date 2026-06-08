import React, { useState } from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapScreen } from '../screens/MapScreen';
import { LightningScreen } from '../screens/LightningScreen';
import { CourseScreen } from '../screens/CourseScreen';
import { MessageScreen } from '../screens/MessageScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
type TabName = '산책' | '번개' | '코스' | '채팅' | '프로필';

export function RootTabs() {
  const [refreshKeys, setRefreshKeys] = useState<Record<TabName, number>>({
    산책: 0,
    번개: 0,
    코스: 0,
    채팅: 0,
    프로필: 0,
  });

  const refreshFocusedTab = (name: TabName, navigation: any) => ({
    tabPress: () => {
      if (navigation.isFocused()) {
        setRefreshKeys((prev) => ({ ...prev, [name]: prev[name] + 1 }));
      }
    },
  });

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
          listeners={({ navigation }) => refreshFocusedTab('산책', navigation)}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🗺️</Text> }}
        >
          {(props) => <MapScreen key={`map-${refreshKeys.산책}`} {...props} />}
        </Tab.Screen>
        <Tab.Screen
          name="번개"
          listeners={({ navigation }) => refreshFocusedTab('번개', navigation)}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚡</Text> }}
        >
          {(props) => <LightningScreen key={`lightning-${refreshKeys.번개}`} {...props} />}
        </Tab.Screen>
        <Tab.Screen
          name="코스"
          listeners={({ navigation }) => refreshFocusedTab('코스', navigation)}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🐾</Text> }}
        >
          {(props) => <CourseScreen key={`course-${refreshKeys.코스}`} {...props} />}
        </Tab.Screen>
        <Tab.Screen
          name="채팅"
          listeners={({ navigation }) => refreshFocusedTab('채팅', navigation)}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💬</Text> }}
        >
          {(props) => <MessageScreen key={`message-${refreshKeys.채팅}`} {...props} />}
        </Tab.Screen>
        <Tab.Screen
          name="프로필"
          listeners={({ navigation }) => refreshFocusedTab('프로필', navigation)}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text> }}
        >
          {(props) => <ProfileScreen key={`profile-${refreshKeys.프로필}`} {...props} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
