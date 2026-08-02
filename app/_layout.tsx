import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

export default function RootLayout() {
  useEffect(() => {
    // הגדרת תצורה גלובלית המותאמת לילדים ולחוקי COPPA
    mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
      })
      .then(() => {
        mobileAds()
          .initialize()
          .then(adapterStatuses => {
            console.log('AdMob SDK Initialized for Children (COPPA Compliant)');
          });
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