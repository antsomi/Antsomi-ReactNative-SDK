import * as React from 'react';
import { Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcon } from './components/Icon';
import AntsomiRnSDK, { LogLevel } from '@antsomicorp/antsomirnsdk';
import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';
import Notification from './screens/Notification';
const Tab = createBottomTabNavigator();
const map = new Map();

AntsomiRnSDK.config(
  '564890637',
  '564993464',
  'fbdfb60d-7ff6-41cd-8203-3ce029c51764',
  'group.khanhhv.test'
);
AntsomiRnSDK.setLogLevel(LogLevel.DEBUG);
// AntsomiRnSDK.setCallbackNewMessage((messsage) => {
//   console.log('Messsage', messsage);
// });
// AntsomiRnSDK.newMessageReceived();
AntsomiRnSDK.requestNotificationPermission();

AntsomiRnSDK.onPendingLink((link) => {
  console.log('link from antsomi', link);
  setTimeout(() => {
    Linking.openURL(link).catch((err) => {
      console.error('Failed to open URL: ', err);
    });
  }, 500);
});

AntsomiRnSDK.onOpenedNotification(async (info) => {
  console.log('Opened notification info', info);
  // Try to open a deeplink/url from payload on both platforms
});

export default function App() {
  return React.createElement(
    NavigationContainer,
    null,
    React.createElement(
      Tab.Navigator,
      { initialRouteName: 'home' },
      React.createElement(Tab.Screen, {
        options: {
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) =>
            React.createElement(MaterialIcon, {
              name: 'home',
              color: color,
              size: 'medium',
            }),
        },
        name: 'Home',
        component: HomeScreen,
      }),
      React.createElement(Tab.Screen, {
        options: {
          tabBarLabel: 'Setting',
          tabBarIcon: ({ color }) =>
            React.createElement(MaterialIcon, {
              name: 'database-settings',
              color: color,
              size: 'medium',
            }),
        },
        name: 'Setting',
        component: SettingsScreen,
      }),
      React.createElement(Tab.Screen, {
        options: {
          tabBarLabel: 'Notification',
          tabBarIcon: ({ color }) =>
            React.createElement(MaterialIcon, {
              name: 'bell',
              color: color,
              size: 'medium',
            }),
        },
        name: 'Notification',
        component: Notification,
      })
    )
  );
}
