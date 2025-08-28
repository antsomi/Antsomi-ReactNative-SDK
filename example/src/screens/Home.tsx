import * as React from 'react';

import { View, Text } from 'react-native';
import AntsomiRnSDK, { type CDPEvent } from '@antsomicorp/antsomirnsdk';

export default function HomeScreen() {
  React.useEffect(() => {
    exampleEvent();
  }, []);

  const exampleEvent = async () => {
    console.log('Example event triggered');
    const eventJson: CDPEvent = {
      en: 'view_pageview',
      eventProps: {
        location_url: 'https://example.com?demojson',
      },
    };

    const json = await AntsomiRnSDK.getMediaJson(eventJson, '');
    const { status, webContents } = json as {
      status: boolean;
      webContents?: any;
    };

    if (status) {
      const products = webContents?.contents?.products || [];

      const globalTracking = webContents?.contents?.globalTracking || [];

      // tracking event viewable and impression
      const { view, impression } = globalTracking;

      for (const product of products) {
        console.log('Product ID:', product.id);
        console.log('Product Name:', product.name);
        console.log('Product Price:', product.price);
        console.log('Original Price:', product.original_price);
      }

      if (view && impression) {
        await AntsomiRnSDK.handleTrackingUrl(view);
        await AntsomiRnSDK.handleTrackingUrl(impression);
      }

      AntsomiRnSDK.handleDeeplinkURL('https://antsomi.com?utm_search=abc');

      console.log('pushId', await AntsomiRnSDK.getPushUid());

      // handle click
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}
