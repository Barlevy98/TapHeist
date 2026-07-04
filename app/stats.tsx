import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { STORAGE_KEYS, getHackerRank, getNextRankDetails } from '../gameHelpers';

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    maxCombo: 0,
    maxMultiplier: 1,
    bestRunCash: 0,
    bestRunDiamonds: 0,
    totalHeists: 0,
    streak: 0,
  });

  const [rankModalVisible, setRankModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const [maxCombo, maxMult, bestCash, bestDiamonds, totalHeists, streak] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.maxCombo),
      SecureStore.getItemAsync(STORAGE_KEYS.maxMultiplier),
      SecureStore.getItemAsync(STORAGE_KEYS.bestRunCash),
      SecureStore.getItemAsync(STORAGE_KEYS.bestRunDiamonds),
      SecureStore.getItemAsync(STORAGE_KEYS.totalHeists),
      SecureStore.getItemAsync(STORAGE_KEYS.dailyStreak),
    ]);

    setStats({
      maxCombo: maxCombo ? Number(maxCombo) : 0,
      maxMultiplier: maxMult ? Number(maxMult) : 1,
      bestRunCash: bestCash ? Number(bestCash) : 0,
      bestRunDiamonds: bestDiamonds ? Number(bestDiamonds) : 0,
      totalHeists: totalHeists ? Number(totalHeists) : 0,
      streak: streak ? Number(streak) : 0,
    });
  };

  const currentRank = getHackerRank(stats.totalHeists, stats.maxCombo);
  const nextRankInfo = getNextRankDetails(stats.totalHeists, stats.maxCombo);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>HACKER STATS</Text>
        <Text style={styles.subtitle}>Lifetime records</Text>

        {/* --- כרטיסיית הראנק החדשה --- */}
        <View style={[styles.card, { borderColor: '#00FF66', backgroundColor: 'rgba(0,255,102,0.05)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.statLabel, { color: '#FFF' }]}>CURRENT RANK</Text>
            {nextRankInfo && (
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRankModalVisible(true);
                }} 
                style={styles.infoBtn}
              >
                <Text style={styles.infoBtnText}>i</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.valueContainer}>
            <Text style={[styles.statValue, { color: '#00FF66' }]} adjustsFontSizeToFit numberOfLines={1}>
              {currentRank}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.statLabel}>BEST COMBO</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.maxCombo.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>PEAK MULTIPLIER</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>x{stats.maxMultiplier.toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.statLabel}>BEST HEIST (CASH)</Text>
          <View style={styles.valueContainer}>
            <Text style={[styles.statValue, { color: '#00FF66' }]} adjustsFontSizeToFit numberOfLines={1}>${stats.bestRunCash.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>BEST HEIST (GEMS)</Text>
          <View style={styles.valueContainer}>
            <Text style={[styles.statValue, { color: '#00FFFF' }]} adjustsFontSizeToFit numberOfLines={1}>💎 {stats.bestRunDiamonds.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.statLabel}>TOTAL HEISTS</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>{stats.totalHeists.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>DAILY STREAK</Text>
          <View style={styles.valueContainer}>
            <Text style={[styles.statValue, { color: '#FFCC00' }]} adjustsFontSizeToFit numberOfLines={1}>{stats.streak} days</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>BACK TO MENU</Text>
        </TouchableOpacity>
      </View>

      {/* --- מודאל ה-Intel המיוחד --- */}
      {rankModalVisible && nextRankInfo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PROMOTION INTEL</Text>
            <Text style={styles.modalSub}>Next Target: {nextRankInfo.name}</Text>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>HEISTS: {stats.totalHeists.toLocaleString()} / {nextRankInfo.targetHeists.toLocaleString()}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${nextRankInfo.heistsProgress * 100}%` }]} />
              </View>

              <Text style={[styles.progressLabel, { marginTop: 15 }]}>OR MAX COMBO: {stats.maxCombo.toLocaleString()} / {nextRankInfo.targetCombo.toLocaleString()}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${nextRankInfo.comboProgress * 100}%`, backgroundColor: '#00FFFF' }]} />
              </View>
              <Text style={styles.orText}>(Achieve EITHER goal to rank up)</Text>
            </View>

            {nextRankInfo.reward && (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardTitle}>PROMOTION BONUS</Text>
                <Text style={[styles.rewardValue, { color: nextRankInfo.reward.type === 'diamond' ? '#00FFFF' : '#00FF66' }]}>
                  {nextRankInfo.reward.type === 'diamond' ? `💎 ${nextRankInfo.reward.amount.toLocaleString()}` : `$${nextRankInfo.reward.amount.toLocaleString()}`}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRankModalVisible(false);
              }} 
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>CLOSE INTEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 24, alignItems: 'center' },
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  card: {
    width: '100%',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: { color: '#AAA', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  valueContainer: { flex: 1, alignItems: 'flex-end', marginLeft: 10 },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'right', width: '100%' },
  
  infoBtn: {
    marginLeft: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#00FF66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: { color: '#00FF66', fontSize: 10, fontWeight: 'bold' },

  closeButton: {
    marginTop: 'auto',
    marginBottom: 40,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 30,
    alignItems: 'center',
  },
  closeButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  // עיצוב למודאל ה-Intel
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '85%', backgroundColor: '#111', borderWidth: 2, borderColor: '#00FF66', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#00FF66', fontWeight: '900', letterSpacing: 2, marginBottom: 5, textAlign: 'center' },
  modalSub: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  
  progressSection: { width: '100%', marginBottom: 20 },
  progressLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  progressBarBg: { width: '100%', height: 12, backgroundColor: '#222', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00FF66', borderRadius: 6 },
  orText: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 8, fontWeight: 'bold' },

  rewardBox: { backgroundColor: 'rgba(0,255,102,0.1)', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#00FF66', marginBottom: 20 },
  rewardTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  rewardValue: { fontSize: 22, fontWeight: '900' },

  modalButton: { backgroundColor: '#00FF66', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30, width: '100%', alignItems: 'center' },
  modalButtonText: { color: '#000', fontWeight: '900', fontSize: 14 },
});