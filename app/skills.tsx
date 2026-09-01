import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { SKILLS, Skill } from '../gamedata';
import { STORAGE_KEYS, getPlayerSkills, upgradeSkillLevel } from '../gameHelpers';

const { width } = Dimensions.get('window');

export default function SkillsScreen() {
  const router = useRouter();
  
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [errorModal, setErrorModal] = useState({ visible: false, missingAmount: 0, currency: '' });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync(STORAGE_KEYS.bank);
      const savedDiamonds = await SecureStore.getItemAsync(STORAGE_KEYS.diamonds);
      if (savedBank) setBank(Number(savedBank));
      if (savedDiamonds) setDiamonds(Number(savedDiamonds));
      
      const loadedSkills = await getPlayerSkills();
      setSkills(loadedSkills);
    } catch (e) { 
      console.log('Error loading skills data', e); 
    }
  };

  const handleUpgrade = async (skill: Skill) => {
    const currentLevel = skills[skill.id] || 0;
    if (currentLevel >= skill.maxLevel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    const nextLevelDef = skill.levels.find(l => l.level === currentLevel + 1);
    if (!nextLevelDef) return;

    const cost = nextLevelDef.cost;
    const isCash = nextLevelDef.currency === 'cash';

    let canAfford = false;
    let newBank = bank;
    let newDiamonds = diamonds;

    if (isCash && bank >= cost) {
      canAfford = true;
      newBank = bank - cost;
      setBank(newBank);
      SecureStore.setItemAsync(STORAGE_KEYS.bank, newBank.toString());
    } else if (!isCash && diamonds >= cost) {
      canAfford = true;
      newDiamonds = diamonds - cost;
      setDiamonds(newDiamonds);
      SecureStore.setItemAsync(STORAGE_KEYS.diamonds, newDiamonds.toString());
    }

    if (canAfford) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newLevel = await upgradeSkillLevel(skill.id);
      setSkills(prev => ({ ...prev, [skill.id]: newLevel }));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const currentFunds = isCash ? bank : diamonds;
      setErrorModal({ visible: true, missingAmount: cost - currentFunds, currency: nextLevelDef.currency });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.bankContainer}>
            <Text style={styles.bankLabel}>YOUR ASSETS</Text>
            <Text style={styles.bankText}>${bank.toLocaleString()}</Text>
            <Text style={styles.diamondText}>💎 {diamonds.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>CYBER CORE</Text>
        <Text style={styles.screenSubtitle}>PERMANENT SYSTEM UPGRADES</Text>

        <ScrollView 
          style={styles.scrollArea} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SKILLS.map((skill) => {
            const currentLevel = skills[skill.id] || 0;
            const isMaxed = currentLevel >= skill.maxLevel;
            const currentLevelDef = skill.levels.find(l => l.level === currentLevel);
            const nextLevelDef = skill.levels.find(l => l.level === currentLevel + 1);
            
            const currentValue = currentLevelDef ? currentLevelDef.value : 0;
            const nextValue = nextLevelDef ? nextLevelDef.value : 0;

            return (
              <View key={skill.id} style={styles.skillCard}>
                
                <View style={styles.skillHeader}>
                  <Text style={styles.skillIcon}>{skill.icon}</Text>
                  <View style={styles.skillTitleContainer}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillLevelText}>LVL {currentLevel} / {skill.maxLevel}</Text>
                  </View>
                </View>
                
                <Text style={styles.skillDesc}>{skill.desc}</Text>

                <View style={styles.progressContainer}>
                  {Array.from({ length: skill.maxLevel }).map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.progressBlock, 
                        index < currentLevel ? styles.progressBlockActive : null
                      ]} 
                    />
                  ))}
                </View>

                <View style={styles.actionRow}>
                  <View style={styles.statsContainer}>
                    <Text style={styles.statCurrent}>
                      BONUS: <Text style={styles.statValue}>+{currentValue}</Text>
                    </Text>
                    {!isMaxed && (
                      <Text style={styles.statNext}>
                        NEXT: +{nextValue}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={[styles.upgradeBtn, isMaxed ? styles.upgradeBtnMax : null]} 
                    onPress={() => handleUpgrade(skill)}
                    disabled={isMaxed}
                  >
                    {isMaxed ? (
                      <Text style={styles.upgradeBtnTextMax}>MAXED</Text>
                    ) : (
                      <Text style={styles.upgradeBtnText}>
                        UPGRADE ({nextLevelDef?.currency === 'diamond' ? `💎 ${nextLevelDef?.cost.toLocaleString()}` : `$${nextLevelDef?.cost.toLocaleString()}`})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
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
              <Text style={styles.modalTitle}>SYSTEM REJECTED</Text>
              <Text style={styles.modalText}>Insufficient Funds.</Text>
              <Text style={styles.modalSubText}>
                You need {errorModal.currency === 'diamond' ? '💎' : '$'}{errorModal.missingAmount.toLocaleString()} more to run this upgrade.
              </Text>
              <TouchableOpacity 
                onPress={() => setErrorModal({ ...errorModal, visible: false })} 
                style={styles.modalButton}
              >
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
  header: { paddingHorizontal: 30, marginBottom: 15 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { color: '#666', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  
  screenTitle: { fontSize: 32, color: '#00FFFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  screenSubtitle: { color: '#666', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  
  scrollArea: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, alignItems: 'center' },
  
  skillCard: { 
    width: '100%', 
    backgroundColor: '#111', 
    borderWidth: 1, 
    borderColor: '#333', 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 20 
  },
  skillHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  skillIcon: { fontSize: 30, marginRight: 15 },
  skillTitleContainer: { flex: 1 },
  skillName: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  skillLevelText: { color: '#00FFFF', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  
  skillDesc: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 15 },
  
  progressContainer: { flexDirection: 'row', gap: 5, marginBottom: 20 },
  progressBlock: { flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4 },
  progressBlockActive: { backgroundColor: '#00FFFF', shadowColor: '#00FFFF', shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statsContainer: { flex: 1, paddingRight: 10 },
  statCurrent: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  statValue: { color: '#00FF66', fontSize: 16, fontWeight: '900' },
  statNext: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  
  upgradeBtn: { backgroundColor: '#00FFFF', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnMax: { backgroundColor: '#333' },
  upgradeBtnText: { color: '#000', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  upgradeBtnTextMax: { color: '#666', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center', zIndex: 10 },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '90%', borderRadius: 30, alignItems: 'center', shadowColor: '#FFF', shadowOpacity: 0.2, shadowRadius: 10 },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '80%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  modalText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  modalSubText: { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  modalButton: { backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  modalButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});