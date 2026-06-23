import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as StoreReview from 'expo-store-review';
import { useRouter, useFocusEffect } from 'expo-router';
import { STORAGE_KEYS, loadHapticsEnabled, setHapticsEnabledCache, hapticImpact } from '../gameHelpers';
import * as Haptics from 'expo-haptics';

const SUPPORT_EMAIL = 'fixra.partners@gmail.com';
const IOS_APP_ID = ''; // Set your App Store ID after listing goes live

export default function SettingsScreen() {
  const router = useRouter();
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHapticsEnabled().then(setHapticsOn);
    }, [])
  );

  const toggleHaptics = async (value: boolean) => {
    setHapticsOn(value);
    setHapticsEnabledCache(value);
    await SecureStore.setItemAsync(STORAGE_KEYS.hapticsEnabled, value ? 'true' : 'false');
    if (value) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleHardReset = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      await SecureStore.deleteItemAsync(key);
    }
    setShowResetWarning(false);
    router.replace('/');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(
      'https://quirky-match-61c.notion.site/Tap-Heist-Privacy-Policy-36a45f65405f80a199b4d838b9373056?source=copy_link'
    );
  };

  const requestReview = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    } else if (IOS_APP_ID) {
      Linking.openURL(`https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`);
    } else {
      Linking.openURL('https://apps.apple.com/');
    }
  };

  const openSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Tap%20Heist%20Support`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SYSTEM CONFIG</Text>
        <Text style={styles.subtitle}>Version 1.4</Text>

        <View style={styles.menuContainer}>
          <View style={styles.toggleRow}>
            <Text style={styles.actionButtonText}>HAPTIC FEEDBACK</Text>
            <Switch value={hapticsOn} onValueChange={toggleHaptics} trackColor={{ false: '#333', true: '#00FF66' }} />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={requestReview}>
            <Text style={styles.actionButtonText}>RATE OUR APP ⭐️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={openSupport}>
            <Text style={styles.actionButtonText}>CONTACT SUPPORT ✉️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={openPrivacyPolicy}>
            <Text style={styles.actionButtonText}>PRIVACY POLICY 📄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: '#FF3B30', marginTop: 12 }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              setShowResetWarning(true);
            }}
          >
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>FACTORY RESET (WIPE DATA)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>BACK TO MENU</Text>
          </TouchableOpacity>
        </View>

        {showResetWarning && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>CRITICAL WARNING</Text>
              <Text style={styles.modalText}>You are about to RESET all your data, money, diamonds, and hardware.</Text>
              <Text style={styles.modalSubText}>This action cannot be undone.</Text>

              <View style={{ width: '100%', gap: 15, marginTop: 20 }}>
                <TouchableOpacity onPress={handleHardReset} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>CONFIRM RESET</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowResetWarning(false)} style={styles.safeButton}>
                  <Text style={styles.safeButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingTop: 40, alignItems: 'center' },
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  menuContainer: { width: '85%', gap: 15 },
  toggleRow: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '85%', borderRadius: 30, alignItems: 'center' },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '85%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 15, textAlign: 'center' },
  modalText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  modalSubText: { color: '#666', fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  dangerButton: { backgroundColor: '#FF3B30', paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  dangerButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  safeButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center' },
  safeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
