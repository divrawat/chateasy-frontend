import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { BACKEND } from '@/config';
import { Platform } from 'react-native';




export async function registerForPushNotificationsAsync(userId) {
    if (!Device.isDevice) {
        alert('Must use physical device for Push Notifications');
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        alert('Failed to get push token!');
        return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;
    console.log('Expo Token:', expoPushToken);


    await fetch(`${BACKEND}/api/update-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, expoPushToken })
    });

    return expoPushToken;
}
