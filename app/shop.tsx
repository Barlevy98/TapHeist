import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, Path, Polygon } from 'react-native-svg';

import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

import { SKINS, WORLDS, POWER_UPS, Skin, World, PowerUp } from '../gamedata';
import { getNextUnlock, getPowerUpInventory, addPowerUp } from '../gameHelpers';

const { width } = Dimensions.get('window');

const adUnitId = __DEV__ 
  ? TestIds.REWARDED 
  : (Platform.OS === 'ios' ? 'ca-app-pub-9244809721385064/8775411934' : 'ca-app-pub-9244809721385064/5943204821'); 

const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: false,
});

export default function ShopScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'skins' | 'worlds' | 'powerups'>('skins'); 
  
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['white']);
  const [equippedSkin, setEquippedSkin] = useState('white');
  
  const [unlockedWorlds, setUnlockedWorlds] = useState<string[]>(['darknet']);
  const [equippedWorld, setEquippedWorld] = useState('darknet');

  const [inventory, setInventory] = useState<Record<string, number>>({
    smart_shield: 0, time_freeze: 0, precision_focus: 0
  });

  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  
  const [flashRedId, setFlashRedId] = useState<string | null>(null);

  const [errorModal, setErrorModal] = useState({ visible: false, missingAmount: 0, currency: '' });
  const [unlockCelebration, setUnlockCelebration] = useState<{ visible: boolean; name: string; type: string; id: string }>({
    visible: false, name: '', type: '', id: ''
  });

  const [powerUpTutorialVisible, setPowerUpTutorialVisible] = useState(false);

  const [adLoaded, setAdLoaded] = useState(rewardedAd.loaded);
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);

  useEffect(() => {
    setAdLoaded(rewardedAd.loaded);

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });
    
    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        if (pendingRewardId) {
          const powerUpName = POWER_UPS.find(p => p.id === pendingRewardId)?.name || '';
          const newVal = await addPowerUp(pendingRewardId, 1);
          setInventory(prev => ({ ...prev, [pendingRewardId]: newVal }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          checkPowerUpTutorial();

          setUnlockCelebration({ visible: true, name: powerUpName, type: 'powerup', id: pendingRewardId });
          setTimeout(() => {
            setUnlockCelebration(prev => prev.type === 'powerup' ? { ...prev, visible: false } : prev);
          }, 1500);
          
          setPendingRewardId(null);
        }
      }
    );

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      setPendingRewardId(null);
      rewardedAd.load(); 
    });

    if (!rewardedAd.loaded) {
      rewardedAd.load();
    }

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, [pendingRewardId]);

  const nextUnlock = getNextUnlock(bank, diamonds, unlockedSkins, unlockedWorlds);

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

      // הוחלף ל-Number
      if (savedBank !== null) setBank(Number(savedBank));
      if (savedDiamonds !== null) setDiamonds(Number(savedDiamonds));
      if (savedUnlockedSkins !== null) setUnlockedSkins(JSON.parse(savedUnlockedSkins));
      if (savedEquippedSkin !== null) setEquippedSkin(savedEquippedSkin);
      if (savedUnlockedWorlds !== null) setUnlockedWorlds(JSON.parse(savedUnlockedWorlds));
      if (savedEquippedWorld !== null) setEquippedWorld(savedEquippedWorld);

      const inv = await getPowerUpInventory();
      setInventory(inv);
    } catch (e) { console.log('Error loading data', e); }
  };

  const checkPowerUpTutorial = async () => {
    const hasSeen = await SecureStore.getItemAsync('has_seen_powerup_tutorial');
    if (hasSeen !== 'true') {
      setPowerUpTutorialVisible(true);
      await SecureStore.setItemAsync('has_seen_powerup_tutorial', 'true');
    }
  };

  const getQty = (id: string) => buyQuantities[id] || 1;
  
  const triggerFlash = (id: string) => {
    setFlashRedId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => setFlashRedId(null), 400);
  };

  const updateQty = (id: string, delta: number, price: number, currency: string) => {
    let q = getQty(id) + delta;
    if (q < 1) q = 1;
    const funds = currency === 'cash' ? bank : diamonds;
    const max = Math.floor(funds / price);
    
    if (max === 0) {
      if (delta > 0) triggerFlash(id);
      setBuyQuantities(prev => ({ ...prev, [id]: 1 }));
      return;
    }

    if (q > max) {
      triggerFlash(id);
      q = max;
    }
    setBuyQuantities(prev => ({ ...prev, [id]: q }));
  };

  const setMaxQty = (id: string, price: number, currency: string) => {
    const funds = currency === 'cash' ? bank : diamonds;
    const max = Math.max(1, Math.floor(funds / price));
    setBuyQuantities(prev => ({ ...prev, [id]: max }));
  };

  const handlePurchase = async (item: Skin | World | PowerUp, type: 'skin' | 'world' | 'powerup', qty: number = 1) => {
    const isSkin = type === 'skin';
    const isWorld = type === 'world';
    const isPowerUp = type === 'powerup';
    
    if (isSkin && unlockedSkins.includes(item.id)) {
      setEquippedSkin(item.id);
      await SecureStore.setItemAsync('vault_equipped_skin', item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (isWorld && unlockedWorlds.includes(item.id)) {
      setEquippedWorld(item.id);
      await SecureStore.setItemAsync('vault_equipped_world', item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    let canAfford = false;
    let newBank = bank;
    let newDiamonds = diamonds;
    const totalCost = item.price * qty;

    if (item.currency === 'cash' && bank >= totalCost) {
      canAfford = true;
      newBank = bank - totalCost;
      setBank(newBank);
      SecureStore.setItemAsync('vault_bank', newBank.toString());
    } else if (item.currency === 'diamond' && diamonds >= totalCost) {
      canAfford = true;
      newDiamonds = diamonds - totalCost;
      setDiamonds(newDiamonds);
      SecureStore.setItemAsync('vault_diamonds', newDiamonds.toString());
    }

    if (canAfford) {
      if (isSkin) {
        const newUnlocked = [...unlockedSkins, item.id];
        setUnlockedSkins(newUnlocked);
        SecureStore.setItemAsync('vault_unlocked_skins', JSON.stringify(newUnlocked));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlockCelebration({ visible: true, name: item.name, type: 'skin', id: item.id });
      } else if (isWorld) {
        const newUnlocked = [...unlockedWorlds, item.id];
        setUnlockedWorlds(newUnlocked);
        SecureStore.setItemAsync('vault_unlocked_worlds', JSON.stringify(newUnlocked));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlockCelebration({ visible: true, name: item.name, type: 'world', id: item.id });
      } else if (isPowerUp) {
        const newVal = await addPowerUp(item.id, qty);
        setInventory(prev => ({ ...prev, [item.id]: newVal }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        checkPowerUpTutorial();

        setUnlockCelebration({ visible: true, name: item.name, type: 'powerup', id: item.id });
        setTimeout(() => {
          setUnlockCelebration(prev => prev.type === 'powerup' ? { ...prev, visible: false } : prev);
        }, 1500);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const currentFunds = item.currency === 'cash' ? bank : diamonds;
      const missing = totalCost - currentFunds;
      setErrorModal({ visible: true, missingAmount: missing, currency: item.currency });
    }
  };

  const handleWatchAdForPowerUp = (powerUpId: string) => {
    if (adLoaded) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPendingRewardId(powerUpId);
      rewardedAd.show();
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

        {nextUnlock && nextUnlock.missing > 0 && activeTab !== 'powerups' && (
          <Text style={styles.nextUnlockHint}>
            Next: {nextUnlock.name} — need {nextUnlock.currency === 'diamond' ? '💎' : '$'}
            {nextUnlock.missing.toLocaleString()} more
          </Text>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'skins' && styles.tabButtonActive]} onPress={() => setActiveTab('skins')}>
            <Text style={[styles.tabText, activeTab === 'skins' && styles.tabTextActive]}>POINTERS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'worlds' && styles.tabButtonActive]} onPress={() => setActiveTab('worlds')}>
            <Text style={[styles.tabText, activeTab === 'worlds' && styles.tabTextActive]}>WORLDS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'powerups' && styles.tabButtonActive]} onPress={() => setActiveTab('powerups')}>
            <Text style={[styles.tabText, activeTab === 'powerups' && styles.tabTextActive]}>POWER-UPS</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ width: '100%', marginTop: 10 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }}>
          
          {activeTab === 'skins' && SKINS.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.id;
            
            return (
              <TouchableOpacity key={skin.id} style={[styles.shopItem, isEquipped && { borderColor: skin.color, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handlePurchase(skin, 'skin')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.colorPreviewContainer, { shadowColor: skin.color, shadowRadius: skin.glow / 2 }]}>
                    {skin.shape === 'gradient' && skin.primaryColor && skin.secondaryColor ? (
                      <Svg width="20" height="20">
                        <Defs>
                          <LinearGradient id={`grad-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={skin.primaryColor} stopOpacity="1" />
                            <Stop offset="100%" stopColor={skin.secondaryColor} stopOpacity="1" />
                          </LinearGradient>
                        </Defs>
                        <Circle cx="10" cy="10" r="10" fill={`url(#grad-${skin.id})`} />
                      </Svg>
                    ) : (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: skin.color }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.itemName} numberOfLines={1} adjustsFontSizeToFit>{skin.name}</Text>
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

          {activeTab === 'worlds' && (
            <>
              <Text style={styles.categoryDivider}>--- FIAT CURRENCY WORLDS ---</Text>
              
              {WORLDS.filter(w => w.currency === 'cash').map((world) => {
                const isUnlocked = unlockedWorlds.includes(world.id);
                const isEquipped = equippedWorld === world.id;
                
                return (
                  <TouchableOpacity key={world.id} style={[styles.shopItem, isEquipped && { borderColor: world.textPrimary, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handlePurchase(world, 'world')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.colorPreviewContainer, { shadowColor: world.textPrimary }]}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: world.bg, borderColor: world.textPrimary, borderWidth: 1 }} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.itemName} numberOfLines={1} adjustsFontSizeToFit>{world.name}</Text>
                        <Text style={styles.itemSpecs}>{world.trait}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                      {isEquipped ? <Text style={[styles.itemStatus, { color: world.textPrimary }]}>EQUIPPED</Text> : 
                       isUnlocked ? <Text style={[styles.itemStatus, { color: '#FFF' }]}>EQUIP</Text> : 
                       <Text style={[styles.itemStatus, { color: '#00FF66' }]}>${world.price.toLocaleString()}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={styles.categoryDivider}>--- PREMIUM DIAMOND WORLDS ---</Text>
              
              {WORLDS.filter(w => w.currency === 'diamond').map((world) => {
                const isUnlocked = unlockedWorlds.includes(world.id);
                const isEquipped = equippedWorld === world.id;
                
                return (
                  <TouchableOpacity key={world.id} style={[styles.shopItem, isEquipped && { borderColor: world.textPrimary, backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handlePurchase(world, 'world')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.colorPreviewContainer, { shadowColor: world.textPrimary }]}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: world.bg, borderColor: world.textPrimary, borderWidth: 1 }} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.itemName} numberOfLines={1} adjustsFontSizeToFit>{world.name}</Text>
                        <Text style={styles.itemSpecs}>{world.trait}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                      {isEquipped ? <Text style={[styles.itemStatus, { color: world.textPrimary }]}>EQUIPPED</Text> : 
                       isUnlocked ? <Text style={[styles.itemStatus, { color: '#FFF' }]}>EQUIP</Text> : 
                       <Text style={[styles.itemStatus, { color: '#00FFFF' }]}>💎 {world.price.toLocaleString()}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {activeTab === 'powerups' && POWER_UPS.map((power) => {
            const currentStock = inventory[power.id] || 0;
            const qty = getQty(power.id);
            const totalCost = power.price * qty;

            return (
              <View key={power.id} style={[styles.shopItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                    <View style={[styles.colorPreviewContainer, { shadowColor: power.color }]}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: power.color }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1} adjustsFontSizeToFit>{power.name}</Text>
                      <Text style={[styles.itemSpecs, { lineHeight: 14 }]}>{power.desc}</Text>
                      {currentStock > 0 && <Text style={{ color: '#00FF66', fontSize: 10, marginTop: 4, fontWeight: 'bold' }}>IN STOCK: {currentStock}</Text>}
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => updateQty(power.id, -1, power.price, power.currency)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyValue, flashRedId === power.id && { color: '#FF3B30' }]}>{qty}</Text>
                    <TouchableOpacity onPress={() => updateQty(power.id, 1, power.price, power.currency)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMaxQty(power.id, power.price, power.currency)} style={styles.maxBtn}>
                      <Text style={styles.maxBtnText}>MAX</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => handlePurchase(power, 'powerup', qty)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
                    <Text style={[styles.itemStatus, { color: power.currency === 'diamond' ? '#00FFFF' : '#00FF66', fontSize: 14 }]}>
                      BUY {qty} ({power.currency === 'diamond' ? `💎 ${totalCost.toLocaleString()}` : `$${totalCost.toLocaleString()}`})
                    </Text>
                  </TouchableOpacity>
                </View>

                {adLoaded && (
                  <TouchableOpacity 
                    onPress={() => handleWatchAdForPowerUp(power.id)} 
                    style={{ backgroundColor: '#FF007F', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 10 }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>WATCH AD FOR +1</Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          })}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeShopButton}>
            <Text style={styles.closeShopText}>BACK TO MENU</Text>
          </TouchableOpacity>
        </View>

        {powerUpTutorialVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: '#00FFFF', padding: 25 }]}>
              <View style={{ marginBottom: 15 }}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2">
                  <Rect x="3" y="8" width="18" height="12" rx="2" ry="2" />
                  <Path d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </Svg>
              </View>
              <Text style={[styles.modalTitle, { color: '#00FFFF', fontSize: 20 }]}>TACTICAL ARSENAL UNLOCKED</Text>
              <Text style={[styles.modalText, { lineHeight: 22, fontSize: 14, color: '#DDD' }]}>
                Your purchased items are stored in your tactical gear bag. During a live vault heist, tap the compact "ARSENAL" bag icon in the lower right corner to pop open your consumables instantly!
              </Text>
              <TouchableOpacity onPress={() => setPowerUpTutorialVisible(false)} style={[styles.modalButton, { backgroundColor: '#00FFFF', marginTop: 15 }]}>
                <Text style={[styles.modalButtonText, { color: '#000' }]}>UNDERSTOOD</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {unlockCelebration.visible && unlockCelebration.type !== 'powerup' && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: '#00FF66' }]}>
              <Text style={[styles.modalTitle, { color: '#00FF66' }]}>UNLOCKED</Text>
              <Text style={styles.modalText}>{unlockCelebration.name} is now in your arsenal.</Text>
              <TouchableOpacity
                onPress={() => {
                  if (unlockCelebration.type === 'skin') {
                    setEquippedSkin(unlockCelebration.id);
                    SecureStore.setItemAsync('vault_equipped_skin', unlockCelebration.id);
                  } else {
                    setEquippedWorld(unlockCelebration.id);
                    SecureStore.setItemAsync('vault_equipped_world', unlockCelebration.id);
                  }
                  setUnlockCelebration({ visible: false, name: '', type: '', id: '' });
                }}
                style={[styles.modalButton, { backgroundColor: '#00FF66', marginTop: 15 }]}
              >
                <Text style={[styles.modalButtonText, { color: '#0A0A0A' }]}>EQUIP & HACK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {unlockCelebration.visible && unlockCelebration.type === 'powerup' && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: '#00FF66', padding: 20 }]}>
              <Text style={[styles.modalTitle, { color: '#00FF66', fontSize: 20, marginBottom: 5 }]}>ACQUIRED</Text>
              <Text style={styles.modalText}>{unlockCelebration.name} added to inventory.</Text>
            </View>
          </View>
        )}

        {errorModal.visible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ACCESS DENIED</Text>
              <Text style={styles.modalText}>Insufficient Funds.</Text>
              <Text style={styles.modalSubText}>
                You need {errorModal.currency === 'diamond' ? '💎' : '$'}{errorModal.missingAmount.toLocaleString()} more to acquire this.
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
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  tabButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  tabButtonActive: { backgroundColor: '#FFCC00', borderColor: '#FFCC00' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#000', fontWeight: '900' },
  categoryDivider: { color: '#666', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginVertical: 15, letterSpacing: 2 },
  shopItem: { width: '90%', backgroundColor: '#111', borderWidth: 1, borderColor: '#222', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  colorPreviewContainer: { marginRight: 15, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
  itemName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  itemSpecs: { color: '#666', fontSize: 11, marginTop: 3 },
  itemStatus: { fontWeight: '900', fontSize: 16 },
  qtyBtn: { backgroundColor: '#333', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  qtyValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  maxBtn: { backgroundColor: '#FFCC00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  maxBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center', zIndex: 10 },
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