import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SKINS, WORLDS, Skin, World } from '../gamedata';
import { getNextUnlock } from '../gameHelpers';

const { width } = Dimensions.get('window');

export default function ShopScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'skins' | 'worlds'>('skins'); 
  
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['white']);
  const [equippedSkin, setEquippedSkin] = useState('white');
  
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>(['darknet']);
  const [equippedWorld, setEquippedWorld] = useState('darknet');

  const [errorModal, setErrorModal] = useState({ visible: false, missingAmount: 0, currency: '' });
  const [unlockCelebration, setUnlockCelebration] = useState<{ visible: boolean; name: string }>({
    visible: false,
    name: '',
  });

  const nextUnlock = getNextUnlock(bank, diamonds, unlockedSkins, unlockedWorlds);

  // שימוש ב-useFocusEffect לרענון הנתונים בכל פעם שחוזרים לחנות
  useFocusEffect(
    useCallback(() => {
      loadSavedData();
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync('vault_bank');
      const savedDiamonds = await SecureStore.getItemAsync('vault_diamonds');
      const savedUnlockedSkins = await SecureStore.getItemAsync('vault_unlocked_skins');
      const savedEquippedSkin = await SecureStore.getItemAsync('vault_equipped_skin');
      const savedUnlockedWorlds = await SecureStore.getItemAsync('vault_unlocked_worlds');
      const savedEquippedWorld = await SecureStore.getItemAsync('vault_equipped_world');

      if (savedBank !== null) setBank(parseInt(savedBank));
      if (savedDiamonds !== null) setDiamonds(parseInt(savedDiamonds));
      if (savedUnlockedSkins !== null) setUnlockedSkins(JSON.parse(savedUnlockedSkins));
      if (savedEquippedSkin !== null) setEquippedSkin(savedEquippedSkin);
      if (savedUnlockedWorlds !== null) setUnlockedWorlds(JSON.parse(savedUnlockedWorlds));
      if (savedEquippedWorld !== null) setEquippedWorld(savedEquippedWorld);
    } catch (e) { console.log('Error loading data', e); }
  };

  const handlePurchase = async (item: Skin | World, type: 'skin' | 'world') => {
    const isSkin = type === 'skin';
    const unlockedList = isSkin ? unlockedSkins : unlockedWorlds;
    
    if (unlockedList.includes(item.id)) {
      if (isSkin) {
        setEquippedSkin(item.id);
        await SecureStore.setItemAsync('vault_equipped_skin', item.id);
      } else {
        setEquippedWorld(item.id);
        await SecureStore.setItemAsync('vault_equipped_world', item.id);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } else {
      let canAfford = false;
      let newBank = bank;
      let newDiamonds = diamonds;

      if (item.currency === 'cash' && bank >= item.price) {
        canAfford = true;
        newBank = bank - item.price;
        setBank(newBank);
        SecureStore.setItemAsync('vault_bank', newBank.toString());
      } else if (item.currency === 'diamond' && diamonds >= item.price) {
        canAfford = true;
        newDiamonds = diamonds - item.price;
        setDiamonds(newDiamonds);
        SecureStore.setItemAsync('vault_diamonds', newDiamonds.toString());
      }

      if (canAfford) {
        if (isSkin) {
          const newUnlocked = [...unlockedSkins, item.id];
          setUnlockedSkins(newUnlocked);
          setEquippedSkin(item.id);
          SecureStore.setItemAsync('vault_unlocked_skins', JSON.stringify(newUnlocked));
          SecureStore.setItemAsync('vault_equipped_skin', item.id);
        } else {
          const newUnlocked = [...unlockedWorlds, item.id];
          setUnlockedWorlds(newUnlocked);
          setEquippedWorld(item.id);
          SecureStore.setItemAsync('vault_unlocked_worlds', JSON.stringify(newUnlocked));
          SecureStore.setItemAsync('vault_equipped_world', item.id);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlockCelebration({ visible: true, name: item.name });
        setTimeout(() => setUnlockCelebration({ visible: false, name: '' }), 2500);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const currentFunds = item.currency === 'cash' ? bank : diamonds;
        const missing = item.price - currentFunds;
        setErrorModal({ visible: true, missingAmount: missing, currency: item.currency });
      }
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

        <Text style={styles.shopTitle}>BLACK MARKET</Text>

        {nextUnlock && nextUnlock.missing > 0 && (
          <Text style={styles.nextUnlockHint}>
            Next: {nextUnlock.name} — need {nextUnlock.currency === 'diamond' ? '💎' : '$'}
            {nextUnlock.missing.toLocaleString()} more
          </Text>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'skins' && styles.tabButtonActive]}
            onPress={() => setActiveTab('skins')}
          >
            <Text style={[styles.tabText, activeTab === 'skins' && styles.tabTextActive]}>POINTERS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'worlds' && styles.tabButtonActive]}
            onPress={() => setActiveTab('worlds')}
          >
            <Text style={[styles.tabText, activeTab === 'worlds' && styles.tabTextActive]}>WORLDS</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ width: '100%', marginTop: 10 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>
          
          {activeTab === 'skins' && SKINS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.id;
            
            return (
              <TouchableOpacity key={skin.id} style={[styles.shopItem, isEquipped && { borderColor: skin.color, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handlePurchase(skin, 'skin')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.colorPreview, { backgroundColor: skin.color, shadowColor: skin.color, shadowRadius: skin.glow / 2 }]} />
                  <View>
                    <Text style={styles.itemName}>{skin.name}</Text>
                    <Text style={styles.itemSpecs}>Glow: {skin.glow} | Width: {skin.width}</Text>
                  </View>
                </View>
                <View>
                  {isEquipped ? <Text style={[styles.itemStatus, { color: skin.color }]}>EQUIPPED</Text> : 
                   isUnlocked ? <Text style={[styles.itemStatus, { color: '#FFF' }]}>EQUIP</Text> : 
                   <Text style={[styles.itemStatus, { color: skin.currency === 'diamond' ? '#00FFFF' : '#00FF66' }]}>{skin.currency === 'diamond' ? `💎 ${skin.price.toLocaleString()}` : `$${skin.price.toLocaleString()}`}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}

          {activeTab === 'worlds' && WORLDS.map((world) => {
            const isUnlocked = unlockedWorlds.includes(world.id);
            const isEquipped = equippedWorld === world.id;
            
            return (
              <TouchableOpacity key={world.id} style={[styles.shopItem, isEquipped && { borderColor: world.textPrimary, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handlePurchase(world, 'world')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.colorPreview, { backgroundColor: world.bg, borderColor: world.textPrimary, borderWidth: 1 }]} />
                  <View>
                    <Text style={styles.itemName}>{world.name}</Text>
                    <Text style={styles.itemSpecs}>Theme unlock</Text>
                  </View>
                </View>
                <View>
                  {isEquipped ? <Text style={[styles.itemStatus, { color: world.textPrimary }]}>EQUIPPED</Text> : 
                   isUnlocked ? <Text style={[styles.itemStatus, { color: '#FFF' }]}>EQUIP</Text> : 
                   <Text style={[styles.itemStatus, { color: world.currency === 'diamond' ? '#00FFFF' : '#00FF66' }]}>{world.currency === 'diamond' ? `💎 ${world.price.toLocaleString()}` : `$${world.price.toLocaleString()}`}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeShopButton}>
            <Text style={styles.closeShopText}>BACK TO MENU</Text>
          </TouchableOpacity>
        </View>

        {unlockCelebration.visible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: '#00FF66' }]}>
              <Text style={[styles.modalTitle, { color: '#00FF66' }]}>UNLOCKED</Text>
              <Text style={styles.modalText}>{unlockCelebration.name} is now in your arsenal.</Text>
              <TouchableOpacity
                onPress={() => setUnlockCelebration({ visible: false, name: '' })}
                style={[styles.modalButton, { backgroundColor: '#00FF66' }]}
              >
                <Text style={[styles.modalButtonText, { color: '#0A0A0A' }]}>EQUIP & HACK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {errorModal.visible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ACCESS DENIED</Text>
              <Text style={styles.modalText}>Insufficient Funds.</Text>
              <Text style={styles.modalSubText}>
                You need {errorModal.currency === 'diamond' ? '💎' : '$'}{errorModal.missingAmount.toLocaleString()} more to acquire this upgrade.
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
  header: { paddingHorizontal: 30, marginBottom: 20 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { color: '#666', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  shopTitle: { fontSize: 32, color: '#FFF', fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  nextUnlockHint: { color: '#FFCC00', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, paddingHorizontal: 24 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 10 },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  tabButtonActive: { backgroundColor: '#FFCC00', borderColor: '#FFCC00' },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#000', fontWeight: '900' },
  shopItem: { width: '90%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  colorPreview: { width: 20, height: 20, borderRadius: 10, marginRight: 15, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
  itemName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  itemSpecs: { color: '#666', fontSize: 11, marginTop: 3 },
  itemStatus: { fontWeight: '900', fontSize: 16 },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  closeShopButton: { backgroundColor: '#FFF', paddingVertical: 15, width: '90%', borderRadius: 30, alignItems: 'center', shadowColor: '#FFF', shadowOpacity: 0.2, shadowRadius: 10 },
  closeShopText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '80%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  modalText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  modalSubText: { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  modalButton: { backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  modalButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});