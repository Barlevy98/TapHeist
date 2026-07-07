import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob SDK Initialized');
      });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      {/* הוספת contentStyle עם רקע שחור שמונעת מהחלון הלבן של המכשיר לבצבץ */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050505' } }} />
    </>
  );
}