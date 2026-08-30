import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

import { BOSSES, Boss } from '../gamedata';
import { STORAGE_KEYS, formatNumber } from '../gameHelpers';

export default function BossesScreen() {
  const router = useRouter();
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [unlockedBosses, setUnlockedBosses] = useState<string[]>([]);
  const [defeatedBosses, setDefeatedBosses] = useState<string[]>([]);
  const [errorModal, setErrorModal] = useState({ visible: false, missingAmount: 0, currency: '' });

  useFocusEffect(
    useCallback(() => {
      loadSavedData();
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync(STORAGE_KEYS.bank);
      const savedDiamonds = await SecureStore.getItemAsync(STORAGE_KEYS.diamonds);
      const savedBosses = await SecureStore.getItemAsync(STORAGE_KEYS.unlockedBosses);
      const savedDefeated = await SecureStore.getItemAsync('vault_defeated_bosses');

      if (savedBank) setBank(Number(savedBank));
      if (savedDiamonds) setDiamonds(Number(savedDiamonds));
      if (savedBosses) setUnlockedBosses(JSON.parse(savedBosses));
      if (savedDefeated) setDefeatedBosses(JSON.parse(savedDefeated));
    } catch (e) { console.log('Error loading boss data', e); }
  };

  const handleUnlock = async (boss: Boss) => {
    let canAfford = false;
    let newBank = bank;
    let newDiamonds = diamonds;

    if (boss.unlockCurrency === 'cash' && bank >= boss.unlockCost) {
      canAfford = true;
      newBank = bank - boss.unlockCost;
      setBank(newBank);
      await SecureStore.setItemAsync(STORAGE_KEYS.bank, newBank.toString());
    } else if (boss.unlockCurrency === 'diamond' && diamonds >= boss.unlockCost) {
      canAfford = true;
      newDiamonds = diamonds - boss.unlockCost;
      setDiamonds(newDiamonds);
      await SecureStore.setItemAsync(STORAGE_KEYS.diamonds, newDiamonds.toString());
    }

    if (canAfford) {
      const newUnlocked = [...unlockedBosses, boss.id];
      setUnlockedBosses(newUnlocked);
      await SecureStore.setItemAsync(STORAGE_KEYS.unlockedBosses, JSON.stringify(newUnlocked));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const currentFunds = boss.unlockCurrency === 'cash' ? bank : diamonds;
      setErrorModal({ visible: true, missingAmount: boss.unlockCost - currentFunds, currency: boss.unlockCurrency });
    }
  };

  const handleStartBoss = async (boss: Boss) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await SecureStore.setItemAsync('pending_boss_battle', boss.id);
    router.replace('/'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.bankContainer}>
            <Text style={styles.bankLabel}>YOUR ASSETS</Text>
            <Text style={styles.bankText}>${formatNumber(bank)}</Text>
            <Text style={styles.diamondText}>💎 {formatNumber(diamonds)}</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>WANTED BOUNTIES</Text>
        <Text style={styles.subtitle}>Defeat targets to unlock classified threats.</Text>

        <ScrollView style={{ width: '100%', marginTop: 10 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>
          {BOSSES.map((boss, index) => {
            const isUnlocked = unlockedBosses.includes(boss.id);
            const isDefeated = defeatedBosses.includes(boss.id);
            // V2.0 Linear Progression Logic: A boss is only available if the PREVIOUS boss was defeated.
            const isAvailableToUnlock = index === 0 || defeatedBosses.includes(BOSSES[index - 1].id);
            
            if (!isAvailableToUnlock) {
              return (
                <View key={boss.id} style={[styles.bossCard, styles.lockedCard]}>
                  <Text style={styles.classifiedText}>CLASSIFIED THREAT</Text>
                  <Text style={styles.lockedDesc}>Requires elimination of previous target.</Text>
                </View>
              );
            }

            return (
              <View key={boss.id} style={[styles.bossCard, { borderColor: isDefeated ? '#00FF66' : boss.themeColor }]}>
                {isDefeated && <View style={styles.eliminatedBadge}><Text style={styles.eliminatedText}>ELIMINATED</Text></View>}
                
                <Text style={[styles.bossName, { color: boss.themeColor }]}>{boss.name}</Text>
                <Text style={styles.threatLevel}>THREAT LEVEL: {'💀'.repeat(Math.ceil(boss.targetHits / 15))}</Text>
                <Text style={styles.bossDesc}>{boss.desc}</Text>
                
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>HITS: {boss.targetHits}</Text>
                  <Text style={styles.statText}>BASE SPEED: {boss.speedModifier}x</Text>
                </View>

                <View style={[styles.rewardsBox, { borderColor: isDefeated ? '#444' : '#00FF66' }]}>
                  <Text style={[styles.rewardsLabel, { color: isDefeated ? '#888' : '#00FF66' }]}>BOUNTY REWARD:</Text>
                  <Text style={[styles.rewardValue, { color: isDefeated ? '#888' : '#FFF' }]}>${formatNumber(boss.rewardCash)}  |  💎 {formatNumber(boss.rewardDiamonds)}</Text>
                </View>

                {isUnlocked ? (
                  <TouchableOpacity onPress={() => handleStartBoss(boss)} style={[styles.actionButton, { backgroundColor: boss.themeColor }]}>
                    <Text style={styles.actionButtonText}>{isDefeated ? 'REPLAY HACK' : 'INITIATE HACK'}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => handleUnlock(boss)} style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: boss.themeColor }]}>
                    <Text style={[styles.actionButtonText, { color: boss.themeColor }]}>
                      DECRYPT ({boss.unlockCurrency === 'diamond' ? `💎 ${formatNumber(boss.unlockCost)}` : `$${formatNumber(boss.unlockCost)}`})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>BACK TO MENU</Text>
          </TouchableOpacity>
        </View>

        {errorModal.visible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ACCESS DENIED</Text>
              <Text style={styles.modalText}>Insufficient Funds.</Text>
              <Text style={styles.modalSubText}>
                You need {errorModal.currency === 'diamond' ? '💎' : '$'}{formatNumber(errorModal.missingAmount)} more to decrypt this target.
              </Text>
              <TouchableOpacity onPress={() => setErrorModal({ ...errorModal, visible: false })} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>ACKNOWLEDGE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingTop: 20 },
  header: { paddingHorizontal: 30, marginBottom: 10 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { color: '#666', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  screenTitle: { fontSize: 32, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { color: '#AAA', fontSize: 12, textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  
  bossCard: { width: '90%', backgroundColor: '#111', borderWidth: 2, padding: 20, borderRadius: 15, marginBottom: 20, position: 'relative', overflow: 'hidden' },
  lockedCard: { borderColor: '#333', backgroundColor: '#0A0A0A', opacity: 0.7, paddingVertical: 40, alignItems: 'center' },
  classifiedText: { color: '#FF3B30', fontSize: 22, fontWeight: '900', letterSpacing: 4, marginBottom: 10 },
  lockedDesc: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  eliminatedBadge: { position: 'absolute', top: 15, right: -30, backgroundColor: '#00FF66', paddingVertical: 5, paddingHorizontal: 30, transform: [{ rotate: '45deg' }], zIndex: 10 },
  eliminatedText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 2 },

  bossName: { fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  threatLevel: { fontSize: 12, color: '#FFF', marginBottom: 10, letterSpacing: 1 },
  bossDesc: { color: '#AAA', fontSize: 13, marginBottom: 15, lineHeight: 18 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8 },
  statText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  
  rewardsBox: { backgroundColor: 'rgba(0, 255, 102, 0.05)', borderWidth: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  rewardsLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  rewardValue: { fontSize: 16, fontWeight: '900' },

  actionButton: { paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  actionButtonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center', zIndex: 10 },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '90%', borderRadius: 30, alignItems: 'center' },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '80%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  modalText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  modalSubText: { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  modalButton: { backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  modalButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});