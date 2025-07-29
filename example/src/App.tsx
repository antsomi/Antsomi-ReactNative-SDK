import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcon } from './components/Icon';
import AntsomiRnSDK, {
  type AppInboxItem,
  LogLevel,
} from '@antsomicorp/antsomirnsdk';

import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';
import Notification from './screens/Notification';

const Tab = createBottomTabNavigator();

AntsomiRnSDK.config(
  '561236459',
  '565024989',
  'fbdfb60d-7ff6-41cd-8203-3ce029c51764',
  'group.khanhhv.test'
);

AntsomiRnSDK.setLogLevel(LogLevel.DEBUG);

AntsomiRnSDK.setCallbackNewMessage((messsage: AppInboxItem) => {
  console.log('Messsage', messsage);
});

AntsomiRnSDK.newMessageReceived();

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
