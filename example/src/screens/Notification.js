import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Image } from 'react-native';
import AntsomiRnSDK, { MessageStatus, } from '@antsomicorp/antsomirnsdk';
const NotificationItem = ({ title, message, image, read, }) => {
    return (React.createElement(View, { style: styles.listItem },
        React.createElement(Image, { style: styles.thumbnailView, source: { uri: image } }),
        React.createElement(View, null,
            React.createElement(Text, { style: read ? styles.readTitle : styles.unreadTitle }, title),
            React.createElement(Text, { style: read ? styles.readSummary : styles.unreadSummary }, message))));
};
const NotificationScreen = () => {
    const [notificationsData, setNotificationsData] = useState([]);
    const [lables, setLabels] = useState([]);
    const handleTabChange = (tab) => {
        console.log(tab);
        // Filter notifications based on tab (implement this logic)
    };
    const handleNotificationPress = (item) => {
        console.log(item);
    };
    const handleRefresh = async () => {
        // Refresh data from API (replace with your actual API call)
        const messages = await AntsomiRnSDK.getListMessage([], 1);
        setNotificationsData(messages);
    };
    useEffect(() => {
        console.log('init app inbox');
        initAppInbox();
    }, []);
    const initAppInbox = async () => {
        await AntsomiRnSDK.appInboxInit('8317604', 'visitor');
        await AntsomiRnSDK.setPageLimit(10);
        const messages = await AntsomiRnSDK.getListMessage([], 1);
        setNotificationsData(messages);
        await AntsomiRnSDK.getAllLabels((listLabels) => {
            setLabels(listLabels);
        });
        await AntsomiRnSDK.modifyAction(['ksksks'], MessageStatus.READ);
        const event = {
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
        console.log('track');
        await AntsomiRnSDK.track(event);
        await AntsomiRnSDK.trackScreen('templateSpinTheWheel');
    };
    return (React.createElement(View, { style: styles.container },
        React.createElement(View, { style: styles.header },
            React.createElement(View, { style: styles.tabs }, lables.map((item) => {
                return (React.createElement(Button, { key: item.catalogId, title: item.catalogName, onPress: () => handleTabChange(item.catalogId) }));
            }))),
        React.createElement(View, { style: { height: '100%' } },
            React.createElement(FlatList, { data: notificationsData, renderItem: ({ item }) => (React.createElement(NotificationItem, { title: item.heading, message: item.content, image: item.image_url, read: +item.status === 2, onPress: () => handleNotificationPress(item) })), keyExtractor: (item) => item.item_id.toString(), onRefresh: handleRefresh, refreshing: false }))));
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    newMessagesText: {
        fontSize: 14,
        color: '#a7a7a7',
    },
    tabs: {
        flexDirection: 'row',
        gap: 15,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    notificationItem: {
        backgroundColor: '#f5f5f5',
        minHeight: 400,
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
    },
    notificationImage: {
        width: '100%',
        height: 500,
        borderRadius: 5,
    },
    notificationContent: {
        flex: 1,
        marginLeft: 15,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#a7a7a7',
    },
    listItem: {
        borderBottomWidth: 3,
        padding: 2,
        height: '100%',
        borderColor: '#ddd',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        flex: 1,
        marginBottom: 8,
    },
    thumbnailView: {
        width: '100%',
        height: 200,
        marginRight: 10,
    },
    unreadTitle: {
        fontSize: 18,
        marginBottom: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    readTitle: {
        marginBottom: 20,
        fontSize: 18,
        color: 'gray',
    },
    unreadSummary: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 10,
    },
    readSummary: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 10,
    },
});
export default NotificationScreen;
