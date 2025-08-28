import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcon } from './components/Icon';
import AntsomiRnSDK, { LogLevel, } from '@antsomicorp/antsomirnsdk';
import HomeScreen from './screens/Home';
import SettingsScreen from './screens/Settings';
import Notification from './screens/Notification';
const Tab = createBottomTabNavigator();
AntsomiRnSDK.config('564892334', '565018498', 'fbdfb60d-7ff6-41cd-8203-3ce029c51764', 'group.khanhhv.test');
AntsomiRnSDK.setLogLevel(LogLevel.DEBUG);
AntsomiRnSDK.setCallbackNewMessage((messsage) => {
    console.log('Messsage', messsage);
});
AntsomiRnSDK.newMessageReceived();
AntsomiRnSDK.requestNotificationPermission();
export default function App() {
    return (React.createElement(NavigationContainer, null,
        React.createElement(Tab.Navigator, { initialRouteName: "home" },
            React.createElement(Tab.Screen, { options: {
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => (React.createElement(MaterialIcon, { name: "home", color: color, size: "medium" })),
                }, name: "Home", component: HomeScreen }),
            React.createElement(Tab.Screen, { options: {
                    tabBarLabel: 'Setting',
                    tabBarIcon: ({ color }) => (React.createElement(MaterialIcon, { name: "database-settings", color: color, size: "medium" })),
                }, name: "Setting", component: SettingsScreen }),
            React.createElement(Tab.Screen, { options: {
                    tabBarLabel: 'Notification',
                    tabBarIcon: ({ color }) => (React.createElement(MaterialIcon, { name: "bell", color: color, size: "medium" })),
                }, name: "Notification", component: Notification }))));
}
