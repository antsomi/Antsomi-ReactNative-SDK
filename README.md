# @antsomicorp/antsomirnsdk

Antsomi Reat Native SDK

## Installation

```sh
npm install @antsomicorp/antsomirnsdk
```

## Usage

```js
import AntsomiRnSDK from '@antsomicorp/antsomirnsdk';

// ...
//Init SDK
const portalId = '564890750';
const androidPropsId = '564998054';
const iosPropsId = '564998055';
const appId = 'b046ec06-0f2e-4459-b2d3-0e6d43ebaccc';
const appGroupId = 'group.antsomi.fmcg'; // Required for iOS, using sharing data to target

switch (Platform.OS) {
    case 'android': {
        AntsomiRnSDK.config(portalId, androidPropsId, appId, appGroupId);
        break;
    }
    case 'ios': {
        AntsomiRnSDK.config(portalId, iosPropsId, appId, appGroupId);
        break;
    }
}

//Track screen view
AntsomiRnSDK.trackScreen('Coupons');
//

//Tracking an event
await AntsomiRnSDK.track({
  en: "view_product",
  customerProps: {
      customer_id: "kkkakakk22123",
      name: "kakakak",
      phone: "221231232"
  },
  userProps: {
      user_id: "22kksks",
      another_attribute_here: "something"
  },
  eventProps: {
      page_name: "2222",
      page_cate: "lalalala"
  },
  objectProps: {
      article: {
          id: "21232",
          name: "latest new in south asia",
          attribute: "something here"
      },
      transaction: {
          id: "929182",
          name: "Transaction 929182",
          price: 2000,
          quantity: 10,
          currency: "USD"
      }
  },
  items: [
      {
          type: "product",
          id: response.data.id,
          name: response.data.name,
          date_created: response.data.date_created,
          image_url: response.data.images[0].src,
          page_url: response.data.permalink,
          status: response.data.status,
          sku: response.data.sku,
          price: response.data.price,
      }
  ]
});

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
