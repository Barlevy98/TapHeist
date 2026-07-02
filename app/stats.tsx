import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { STORAGE_KEYS } from '../gameHelpers';

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
      // הוחלף ל-Number
      maxCombo: maxCombo ? Number(maxCombo) : 0,
      maxMultiplier: maxMult ? Number(maxMult) : 1,
      bestRunCash: bestCash ? Number(bestCash) : 0,
      bestRunDiamonds: bestDiamonds ? Number(bestDiamonds) : 0,
      totalHeists: totalHeists ? Number(totalHeists) : 0,
      streak: streak ? Number(streak) : 0,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>HACKER STATS</Text>
        <Text style={styles.subtitle}>Lifetime records</Text>

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
  statLabel: { color: '#AAA', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, flex: 1 },
  valueContainer: { flex: 1, alignItems: 'flex-end' },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'right', width: '100%' },
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
});