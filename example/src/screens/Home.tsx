import * as React from 'react';

import { View, Text } from 'react-native';
import AntsomiRnSDK, { type CDPEvent } from '@antsomicorp/antsomirnsdk';

export default function HomeScreen() {
  React.useEffect(() => {
    exampleEvent();
  }, []);

  const exampleEvent = async () => {
    await AntsomiRnSDK.trackScreen('Home', 'Home', 'home');

    await AntsomiRnSDK.requestNotificationPermission();

    const pushId = await AntsomiRnSDK.getPushUid();
    const uid = await AntsomiRnSDK.getUid();
    const customer_id = await AntsomiRnSDK.getCustomerId();

    console.log('pushId', pushId);
    console.log('uid', uid);
    console.log('customer_id', customer_id);

    await AntsomiRnSDK.resetCustomer();

    const customer_id_after = await AntsomiRnSDK.getCustomerId();
    console.log('customer_id_after', customer_id_after);

    const event: CDPEvent = {
      en: 'screen_view',
      customerProps: {
        customer_id: 'kkkakakk22123',
        name: 'kakakak',
        phone: '221231232',
      },
      eventProps: {
        page_name: 'home',
      },
    };

    const json = await AntsomiRnSDK.getMediaJson(event, '');
    console.log('json', json);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}
