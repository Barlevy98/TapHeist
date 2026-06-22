import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MISSIONS, Mission, WEEKLY_MISSIONS, WeeklyMission } from '../gamedata';
import { updateMaxBank, loadWeeklyMissionsData, STORAGE_KEYS } from '../gameHelpers';

export default function MissionsScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'core' | 'weekly'>('core');
  
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>([]);
  
  const [stats, setStats] = useState({ combo: 0, multiplier: 1, bank: 0 });
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);

  // סטייט נתונים שבועיים
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>([]);
  const [weeklyClaimed, setWeeklyClaimed] = useState<string[]>([]);
  const [weeklyHeistsCount, setWeeklyHeistsCount] = useState(0);
  
  // --- V1.4: הוספת משתנים למעקב אחר שיאים שבועיים ---
  const [weeklyMaxCombo, setWeeklyMaxCombo] = useState(0);
  const [weeklyMaxMultiplier, setWeeklyMaxMultiplier] = useState(1);
  
  const [weeklyCountdown, setWeeklyCountdown] = useState('');

  const [notification, setNotification] = useState({ visible: false, title: '', subtitle: '' });

  useFocusEffect(
    useCallback(() => {
      loadMissionsData();
    }, [])
  );

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

      // משיכת הנתונים השבועיים ועדכון הסטייט החדש
      const wData = await loadWeeklyMissionsData();
      setWeeklyMissions(wData.missions);
      setWeeklyClaimed(wData.claimed);
      setWeeklyHeistsCount(wData.weeklyHeists);
      setWeeklyMaxCombo(wData.weeklyMaxCombo);
      setWeeklyMaxMultiplier(wData.weeklyMaxMultiplier);
      setWeeklyCountdown(wData.countdown);

    } catch (e) { console.log('Error loading data', e); }
  };

  const handleClaim = async (mission: Mission | WeeklyMission, isWeekly = false) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (isWeekly) {
      const newWeeklyClaimed = [...weeklyClaimed, mission.id];
      setWeeklyClaimed(newWeeklyClaimed);
      await SecureStore.setItemAsync(STORAGE_KEYS.weeklyClaimed, JSON.stringify(newWeeklyClaimed));
    } else {
      const newClaimed = [...claimedMissions, mission.id];
      setClaimedMissions(newClaimed);
      await SecureStore.setItemAsync('vault_claimed_missions', JSON.stringify(newClaimed));
    }

    let notifTitle = '';
    let notifSubtitle = '';

    if (mission.rewardType === 'diamond') {
      const newDiamonds = diamonds + mission.rewardValue;
      setDiamonds(newDiamonds);
      await SecureStore.setItemAsync('vault_diamonds', newDiamonds.toString());
      notifTitle = 'DIAMONDS ACQUIRED';
      notifSubtitle = `+${mission.rewardValue.toLocaleString()} 💎 added to your vault`;
      
    } else if (mission.rewardType === 'cash') {
      const newBank = bank + mission.rewardValue;
      setBank(newBank);
      await SecureStore.setItemAsync('vault_bank', newBank.toString());
      await updateMaxBank(newBank);
      notifTitle = 'FUNDS TRANSFERRED';
      notifSubtitle = `+$${mission.rewardValue.toLocaleString()} added to your bank`;
      
    } else if (mission.rewardType === 'skin') {
      const skinVal = (mission as Mission).rewardValue;
      if (!unlockedSkins.includes(skinVal)) {
        const newUnlocked = [...unlockedSkins, skinVal];
        setUnlockedSkins(newUnlocked);
        await SecureStore.setItemAsync('vault_unlocked_skins', JSON.stringify(newUnlocked));
      }
      notifTitle = 'HARDWARE UNLOCKED';
      notifSubtitle = `New pointer skin added to shop!`;
    }

    setNotification({ visible: true, title: notifTitle, subtitle: notifSubtitle });
    
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

  // --- V1.4: תיקון בדיקת ההתקדמות השבועית שתשאב מהמשתנים השבועיים ---
  const checkWeeklyProgress = (mission: WeeklyMission) => {
    let current = 0;
    if (mission.type === 'combo') current = weeklyMaxCombo;
    if (mission.type === 'multiplier') current = weeklyMaxMultiplier;
    if (mission.type === 'weekly_heists') current = weeklyHeistsCount;
    return { current, target: mission.target, isCompleted: current >= mission.target };
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
        
        <Text style={styles.title}>OBJECTIVES</Text>
        <Text style={styles.subtitle}>Complete hacks to earn rewards</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'core' && styles.tabButtonActive]} onPress={() => setActiveTab('core')}>
            <Text style={[styles.tabText, activeTab === 'core' && styles.tabTextActive]}>CORE MISSIONS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]} onPress={() => setActiveTab('weekly')}>
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>WEEKLY CHALLENGES</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'weekly' && (
          <Text style={styles.countdownText}>🔒 CYCLES RESET IN: {weeklyCountdown.toUpperCase()}</Text>
        )}
        
        <ScrollView style={{ width: '100%', marginTop: 10 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>
          
          {activeTab === 'core' && MISSIONS.map((mission) => {
            const progress = checkProgress(mission);
            const isClaimed = claimedMissions.includes(mission.id);
            const canClaim = progress.isCompleted && !isClaimed;
            
            return (
              <View key={mission.id} style={[styles.missionCard, canClaim && styles.missionCardReady]}>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionDesc}>{mission.desc}</Text>
                  <Text style={styles.progressText}>Progress: {Math.min(progress.current, progress.target).toLocaleString()} / {progress.target.toLocaleString()}</Text>
                </View>
                <View style={styles.rewardSection}>
                  {isClaimed ? (
                    <Text style={styles.claimedText}>CLAIMED</Text>
                  ) : canClaim ? (
                    <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim(mission, false)}>
                      <Text style={styles.claimButtonText}>CLAIM</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.lockedReward}>
                      <Text style={styles.rewardLabel}>REWARD</Text>
                      <Text style={[styles.rewardValue, { color: mission.rewardType === 'diamond' ? '#00FFFF' : '#00FF66' }]}>
                        {mission.rewardType === 'skin' ? 'SKIN' : mission.rewardType === 'diamond' ? `💎 ${mission.rewardValue.toLocaleString()}` : `$${mission.rewardValue.toLocaleString()}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {activeTab === 'weekly' && weeklyMissions.map((mission) => {
            const progress = checkWeeklyProgress(mission);
            const isClaimed = weeklyClaimed.includes(mission.id);
            const canClaim = progress.isCompleted && !isClaimed;
            
            return (
              <View key={mission.id} style={[styles.missionCard, { borderColor: '#FF007F' }, canClaim && styles.missionCardReady]}>
                <View style={styles.missionInfo}>
                  <Text style={[styles.missionTitle, { color: '#FF007F' }]}>{mission.title}</Text>
                  <Text style={styles.missionDesc}>{mission.desc}</Text>
                  <Text style={styles.progressText}>Weekly Progress: {Math.min(progress.current, progress.target).toLocaleString()} / {progress.target.toLocaleString()}</Text>
                </View>
                <View style={styles.rewardSection}>
                  {isClaimed ? (
                    <Text style={styles.claimedText}>CLAIMED</Text>
                  ) : canClaim ? (
                    <TouchableOpacity style={[styles.claimButton, { backgroundColor: '#FF007F', shadowColor: '#FF007F' }]} onPress={() => handleClaim(mission, true)}>
                      <Text style={[styles.claimButtonText, { color: '#FFF' }]}>CLAIM</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.lockedReward}>
                      <Text style={styles.rewardLabel}>REWARD</Text>
                      <Text style={[styles.rewardValue, { color: mission.rewardType === 'diamond' ? '#00FFFF' : '#00FF66' }]}>
                        {mission.rewardType === 'diamond' ? `💎 ${mission.rewardValue.toLocaleString()}` : `$${mission.rewardValue.toLocaleString()}`}
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

        {notification.visible && (
          <View style={styles.notificationOverlay}>
            <View style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationSub}>{notification.subtitle}</Text>
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
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  tabButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#222', backgroundColor: '#111' },
  tabButtonActive: { backgroundColor: '#FFCC00', borderColor: '#FFCC00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 11 },
  tabTextActive: { color: '#000', fontWeight: '900' },
  countdownText: { color: '#FF007F', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 },

  missionCard: { width: '90%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionCardReady: { borderColor: '#00FF66', backgroundColor: 'rgba(0, 255, 102, 0.03)' },
  missionInfo: { flex: 1, paddingRight: 15 },
  missionTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  missionDesc: { color: '#AAA', fontSize: 12, marginBottom: 10, lineHeight: 16 },
  progressText: { color: '#555', fontSize: 11, fontWeight: 'bold' },
  rewardSection: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  lockedReward: { alignItems: 'center' },
  rewardLabel: { color: '#444', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 3 },
  rewardValue: { fontSize: 15, fontWeight: '900' },
  claimButton: { backgroundColor: '#00FF66', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, shadowColor: '#00FF66', shadowOpacity: 0.4, shadowRadius: 8 },
  claimButtonText: { color: '#000', fontWeight: '900', fontSize: 13 },
  claimedText: { color: '#222', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  closeButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '90%', borderRadius: 30, alignItems: 'center', shadowColor: '#FFF', shadowOpacity: 0.2, shadowRadius: 10 },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  notificationOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  notificationCard: { backgroundColor: '#111', borderWidth: 2, borderColor: '#00FF66', padding: 25, borderRadius: 20, alignItems: 'center', width: '80%', shadowColor: '#00FF66', shadowOpacity: 0.3, shadowRadius: 20 },
  notificationTitle: { color: '#00FF66', fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  notificationSub: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});