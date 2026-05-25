import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
  useEffect(() => {
    // אתחול רשמי של מערכת הפרסומות של גוגל ברגע שהמשחק נפתח
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob SDK Initialized');
      });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}