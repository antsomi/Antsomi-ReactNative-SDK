import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcon } from './components/Icon';
import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';
import Notification from './screens/Notification';
import GamificationScreen from './screens/Gamification';
import AntsomiRnSDK, { LogLevel } from '@antsomicorp/antsomirnsdk';

AntsomiRnSDK.config(
  '564890637',
  '564993464',
  'fbdfb60d-7ff6-41cd-8203-3ce029c51764',
  'group.khanhhv.test'
);
AntsomiRnSDK.setLogLevel(LogLevel.DEBUG);

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="home">
        <Tab.Screen
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <MaterialIcon name="home" color={color} size="medium" />
            ),
          }}
          name="Home"
          component={HomeScreen}
        />
        <Tab.Screen
          options={{
            tabBarLabel: 'Games',
            tabBarIcon: ({ color }) => (
              <MaterialIcon name="gamepad-variant" color={color} size="medium" />
            ),
          }}
          name="Games"
          component={GamificationScreen}
        />
        <Tab.Screen
          options={{
            tabBarLabel: 'Setting',
            tabBarIcon: ({ color }) => (
              <MaterialIcon
                name="database-settings"
                color={color}
                size="medium"
              />
            ),
          }}
          name="Setting"
          component={SettingsScreen}
        />
        <Tab.Screen
          options={{
            tabBarLabel: 'Notification',
            tabBarIcon: ({ color }) => (
              <MaterialIcon name="bell" color={color} size="medium" />
            ),
          }}
          name="Notification"
          component={Notification}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

