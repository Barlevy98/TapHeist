import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const handleHardReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const keys = [
      'vault_bank', 'vault_diamonds', 'vault_unlocked_skins', 
      'vault_equipped_skin', 'vault_unlocked_worlds', 'vault_equipped_world', 
      'vault_claimed_missions', 'stat_maxCombo', 'stat_maxMultiplier', 'stat_maxBank'
    ];
    
    for (const key of keys) {
      await SecureStore.deleteItemAsync(key);
    }
    
    setShowResetWarning(false);
    router.replace('/'); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SYSTEM CONFIG</Text>
      <Text style={styles.subtitle}>Manage your hacker profile</Text>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowRateModal(true);
          }}
        >
          <Text style={styles.actionButtonText}>RATE OUR APP ⭐️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: '#FF3B30' }]} 
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setShowResetWarning(true);
          }}
        >
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>RESET GAME</Text>
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

      {showRateModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#00FF66' }]}>
            <Text style={[styles.modalTitle, { color: '#00FF66' }]}>ENJOYING THE HACK?</Text>
            <Text style={styles.modalText}>Leave us a 5-star review on the App Store to support future updates!</Text>
            
            <View style={{ width: '100%', gap: 15, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setShowRateModal(false)} style={[styles.dangerButton, { backgroundColor: '#00FF66' }]}>
                <Text style={[styles.dangerButtonText, { color: '#0A0A0A' }]}>RATE NOW</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRateModal(false)} style={styles.safeButton}>
                <Text style={styles.safeButtonText}>MAYBE LATER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', paddingTop: 80, alignItems: 'center' },
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  menuContainer: { width: '85%', gap: 20 },
  actionButton: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', paddingVertical: 20, borderRadius: 15, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '85%', borderRadius: 30, alignItems: 'center', shadowColor: '#FFF', shadowOpacity: 0.2, shadowRadius: 10 },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '85%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 15, textAlign: 'center' },
  modalText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  modalSubText: { color: '#666', fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  dangerButton: { backgroundColor: '#FF3B30', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  dangerButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  safeButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  safeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});