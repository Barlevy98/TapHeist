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
    maxBank: 0,
    totalHeists: 0,
    streak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const [maxCombo, maxMult, maxBank, totalHeists, streak] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.maxCombo),
      SecureStore.getItemAsync(STORAGE_KEYS.maxMultiplier),
      SecureStore.getItemAsync(STORAGE_KEYS.maxBank),
      SecureStore.getItemAsync(STORAGE_KEYS.totalHeists),
      SecureStore.getItemAsync(STORAGE_KEYS.dailyStreak),
    ]);

    setStats({
      maxCombo: maxCombo ? parseInt(maxCombo, 10) : 0,
      maxMultiplier: maxMult ? parseInt(maxMult, 10) : 1,
      maxBank: maxBank ? parseInt(maxBank, 10) : 0,
      totalHeists: totalHeists ? parseInt(totalHeists, 10) : 0,
      streak: streak ? parseInt(streak, 10) : 0,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>HACKER STATS</Text>
        <Text style={styles.subtitle}>Lifetime records</Text>

        <View style={styles.card}>
          <Text style={styles.statLabel}>BEST COMBO</Text>
          <Text style={styles.statValue}>{stats.maxCombo}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>PEAK MULTIPLIER</Text>
          <Text style={styles.statValue}>x{stats.maxMultiplier}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>HIGHEST BANK</Text>
          <Text style={[styles.statValue, { color: '#00FF66' }]}>${stats.maxBank.toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>TOTAL HEISTS</Text>
          <Text style={styles.statValue}>{stats.totalHeists.toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statLabel}>DAILY STREAK</Text>
          <Text style={[styles.statValue, { color: '#FFCC00' }]}>{stats.streak} days</Text>
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
  statLabel: { color: '#AAA', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
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
