import React, { useEffect } from 'react';
import AntsomiRnSDK, { type CDPEvent } from '@antsomicorp/antsomirnsdk';
import { Text } from 'react-native';

export const Example = () => {
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // await AntsomiRnSDK.config('564890637','564993464','fbdfb60d-7ff6-41cd-8203-3ce029c51764');

    // await AntsomiRnSDK.setLogLevel(1);

    await AntsomiRnSDK.appInboxInit('8317604', 'visitor');

    await AntsomiRnSDK.getListMessage([], 1);

    const event: CDPEvent = {
      en: 'view_product',
      customerProps: {
        customer_id: 'kkkakakk22123',
        name: 'kakakak',
        phone: '221231232',
      },
      userProps: {
        user_id: '22kksks',
        another_attribute_here: 'something',
      },
      eventProps: {
        page_name: '2222',
        page_cate: 'lalalala',
      },
      objectProps: {
        article: {
          id: '21232',
          name: 'latest new in south asia',
          attribute: 'something here',
        },
        transaction: {
          id: '929182',
          name: 'Transaction 929182',
          price: 2000,
          quantity: 10,
          currency: 'USD',
        },
      },
      items: [
        {
          id: '213123',
          name: 'main object',
          type: 'product',
        },
      ],
    };

    await AntsomiRnSDK.track(event);

    await AntsomiRnSDK.trackScreen('khanhhv', 'Example', 'example');

    await AntsomiRnSDK.getAllLabels((labels: any) => {
      console.log(labels);
    });
  };

  return <Text>Example</Text>;
};
