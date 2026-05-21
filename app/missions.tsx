import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MISSIONS, Mission } from '../gamedata';

export default function MissionsScreen() {
  const router = useRouter();
  
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>([]);
  
  const [stats, setStats] = useState({ combo: 0, multiplier: 1, bank: 0 });
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);

  // סטייט חדש למערכת ההתראות (פידבק קבלת פרס)
  const [notification, setNotification] = useState({ visible: false, title: '', subtitle: '' });

  useEffect(() => { loadMissionsData(); }, []);

  const loadMissionsData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync('vault_bank');
      const savedDiamonds = await SecureStore.getItemAsync('vault_diamonds');
      const savedUnlocked = await SecureStore.getItemAsync('vault_unlocked_skins');
      const savedClaimed = await SecureStore.getItemAsync('vault_claimed_missions');
      
      const maxCombo = await SecureStore.getItemAsync('stat_maxCombo');
      const maxMult = await SecureStore.getItemAsync('stat_maxMultiplier');
      const maxBank = await SecureStore.getItemAsync('stat_maxBank');

      if (savedBank) setBank(parseInt(savedBank));
      if (savedDiamonds) setDiamonds(parseInt(savedDiamonds));
      if (savedUnlocked) setUnlockedSkins(JSON.parse(savedUnlocked));
      if (savedClaimed) setClaimedMissions(JSON.parse(savedClaimed));

      setStats({
        combo: maxCombo ? parseInt(maxCombo) : 0,
        multiplier: maxMult ? parseInt(maxMult) : 1,
        bank: maxBank ? parseInt(maxBank) : 0,
      });
    } catch (e) { console.log('Error loading data', e); }
  };

  const handleClaim = async (mission: Mission) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const newClaimed = [...claimedMissions, mission.id];
    setClaimedMissions(newClaimed);
    await SecureStore.setItemAsync('vault_claimed_missions', JSON.stringify(newClaimed));

    let notifTitle = '';
    let notifSubtitle = '';

    if (mission.rewardType === 'diamond') {
      const newDiamonds = diamonds + mission.rewardValue;
      setDiamonds(newDiamonds);
      await SecureStore.setItemAsync('vault_diamonds', newDiamonds.toString());
      notifTitle = 'DIAMONDS ACQUIRED';
      notifSubtitle = `+${mission.rewardValue} 💎 added to your vault`;
      
    } else if (mission.rewardType === 'cash') {
      const newBank = bank + mission.rewardValue;
      setBank(newBank);
      await SecureStore.setItemAsync('vault_bank', newBank.toString());
      notifTitle = 'FUNDS TRANSFERRED';
      notifSubtitle = `+$${mission.rewardValue} added to your bank`;
      
    } else if (mission.rewardType === 'skin') {
      if (!unlockedSkins.includes(mission.rewardValue)) {
        const newUnlocked = [...unlockedSkins, mission.rewardValue];
        setUnlockedSkins(newUnlocked);
        await SecureStore.setItemAsync('vault_unlocked_skins', JSON.stringify(newUnlocked));
      }
      notifTitle = 'HARDWARE UNLOCKED';
      notifSubtitle = `New pointer skin added to shop!`;
    }

    // הפעלת ההתראה
    setNotification({ visible: true, title: notifTitle, subtitle: notifSubtitle });
    
    // העלמת ההתראה אחרי 2.5 שניות
    setTimeout(() => {
      setNotification({ visible: false, title: '', subtitle: '' });
    }, 2500);
  };

  const checkProgress = (mission: Mission) => {
    let current = 0;
    if (mission.type === 'combo') current = stats.combo;
    if (mission.type === 'multiplier') current = stats.multiplier;
    if (mission.type === 'bank') current = stats.bank;
    return { current, target: mission.target, isCompleted: current >= mission.target };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.bankContainer}>
          <Text style={styles.bankLabel}>YOUR ASSETS</Text>
          <Text style={styles.bankText}>${bank}</Text>
          <Text style={styles.diamondText}>💎 {diamonds}</Text>
        </View>
      </View>
      <Text style={styles.title}>OBJECTIVES</Text>
      <Text style={styles.subtitle}>Complete hacks to earn rewards</Text>
      
      <ScrollView style={{ width: '100%', marginTop: 10 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>
        {MISSIONS.map((mission) => {
          const progress = checkProgress(mission);
          const isClaimed = claimedMissions.includes(mission.id);
          const canClaim = progress.isCompleted && !isClaimed;
          
          return (
            <View key={mission.id} style={[styles.missionCard, canClaim && styles.missionCardReady]}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDesc}>{mission.desc}</Text>
                <Text style={styles.progressText}>Progress: {Math.min(progress.current, progress.target)} / {progress.target}</Text>
              </View>
              <View style={styles.rewardSection}>
                {isClaimed ? (
                  <Text style={styles.claimedText}>CLAIMED</Text>
                ) : canClaim ? (
                  <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim(mission)}>
                    <Text style={styles.claimButtonText}>CLAIM</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedReward}>
                    <Text style={styles.rewardLabel}>REWARD</Text>
                    <Text style={[styles.rewardValue, { color: mission.rewardType === 'diamond' ? '#00FFFF' : '#00FF66' }]}>
                      {mission.rewardType === 'skin' ? 'SKIN' : mission.rewardType === 'diamond' ? `💎 ${mission.rewardValue}` : `$${mission.rewardValue}`}
                    </Text>
                  </View>
                )}
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

      {/* שכבת ההתראה שקופצת כשאוספים פרס! */}
      {notification.visible && (
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationSub}>{notification.subtitle}</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', paddingTop: 60 },
  header: { paddingHorizontal: 30, marginBottom: 15 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { color: '#666', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  missionCard: { width: '90%', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 15, padding: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionCardReady: { borderColor: '#FFCC00', backgroundColor: 'rgba(255, 204, 0, 0.05)' },
  missionInfo: { flex: 1, paddingRight: 15 },
  missionTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  missionDesc: { color: '#AAA', fontSize: 13, marginBottom: 10 },
  progressText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  rewardSection: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  lockedReward: { alignItems: 'center' },
  rewardLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 3 },
  rewardValue: { fontSize: 16, fontWeight: '900' },
  claimButton: { backgroundColor: '#FFCC00', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, shadowColor: '#FFCC00', shadowOpacity: 0.4, shadowRadius: 8 },
  claimButtonText: { color: '#000', fontWeight: '900', fontSize: 14 },
  claimedText: { color: '#333', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '90%', borderRadius: 30, alignItems: 'center', shadowColor: '#FFF', shadowOpacity: 0.2, shadowRadius: 10 },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  // עיצוב למודל ה-Reward
  notificationOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  notificationCard: { backgroundColor: '#111', borderWidth: 2, borderColor: '#00FF66', padding: 25, borderRadius: 20, alignItems: 'center', width: '80%', shadowColor: '#00FF66', shadowOpacity: 0.3, shadowRadius: 20 },
  notificationTitle: { color: '#00FF66', fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  notificationSub: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});