import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Share, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import * as StoreReview from 'expo-store-review';

import GameHeader from '../components/GameHeader';
import TacticalArsenal from '../components/TacticalArsenal';
import GameUI from '../components/GameUI';
import VaultRing from '../components/VaultRing';

import { SKINS, WORLDS, Skin, World } from '../gamedata';
import {
  STORAGE_KEYS,
  countClaimableMissions,
  getDailyRewardInfo,
  claimDailyReward,
  updateMaxBank,
  incrementTotalHeists,
  hapticImpact,
  hapticNotification,
  loadHapticsEnabled,
  getPowerUpInventory,
  addPowerUp,
  getNextUnlock,
  incrementWeeklyHeists,
  getPrestigeOffer,
  getHackerRank
} from '../gameHelpers';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 25;
const ZONE_SIZE = 45;
const BASE_REWARD = 4;
const FAIL_REWARD_FRACTION = 0.25;
const DIAMOND_CHANCE = 0.20;
const NEAR_MISS_MULTIPLIER = 1.35;

const adUnitId = __DEV__ 
  ? TestIds.REWARDED 
  : (Platform.OS === 'ios' ? 'ca-app-pub-9244809721385064/8775411934' : 'ca-app-pub-9244809721385064/5943204821');

const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: false,
});

export default function GameScreen() {
  // === L O G I C   &   S T A T E ===

  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [bank, setBank] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [consolationPrize, setConsolationPrize] = useState(0);

  const [activeSkin, setActiveSkin] = useState<any>(SKINS[0]);
  const [activeWorld, setActiveWorld] = useState<World>(WORLDS[0]);

  const [inventory, setInventory] = useState<Record<string, number>>({ smart_shield: 0, time_freeze: 0, precision_focus: 0 });
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [focusTapsLeft, setFocusTapsLeft] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const isFrozenRef = useRef(false);

  const [mainNextUnlock, setMainNextUnlock] = useState<any>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const inventoryProgress = useSharedValue(0);

  const [targetAngle, setTargetAngle] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isDiamondTarget, setIsDiamondTarget] = useState(false);
  const [hasSeenDiamondTutorial, setHasSeenDiamondTutorial] = useState(true);

  const [introStep, setIntroStep] = useState<number | null>(null);
  const [showRiskTutorial, setShowRiskTutorial] = useState(false);
  const [nearMissText, setNearMissText] = useState<string | null>(null);
  const [missionBadge, setMissionBadge] = useState(0);
  const [dailyModal, setDailyModal] = useState<{ visible: boolean; streak: number; cash: number; diamonds: number }>({
    visible: false, streak: 0, cash: 0, diamonds: 0,
  });

  const [runMaxCombo, setRunMaxCombo] = useState(0);
  const [runDiamondsEarned, setRunDiamondsEarned] = useState(0);
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasRevivedThisRun, setHasRevivedThisRun] = useState(false);
  const [pendingRevive, setPendingRevive] = useState(false);

  // === V1.4: NEW STATES ===
  const [lifetimeMaxCombo, setLifetimeMaxCombo] = useState(0);
  const [totalHeists, setTotalHeists] = useState(0);
  const [prestigeMult, setPrestigeMult] = useState(1);
  const [gamesSinceFirewall, setGamesSinceFirewall] = useState(0);
  const [isFirewallActive, setIsFirewallActive] = useState(false);

  // אזור המטרה משתנה דינאמית אם אנחנו במצב פוקוס או במצב פריצת חומת אש
  const activeZoneSize = isFirewallActive 
    ? Math.max(15, ZONE_SIZE * 0.5) 
    : (focusTapsLeft > 0 ? ZONE_SIZE * 2 : ZONE_SIZE);

  // === A N I M A T I O N S ===
  const shieldScale = useSharedValue(1);
  const freezeScale = useSharedValue(1);
  const focusScale = useSharedValue(1);
  const floatAnim = useSharedValue(0);
  const floatOpacity = useSharedValue(0);
  const targetOpacity = useSharedValue(1); 
  const rotation = useSharedValue(0);
  const hitFlash = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const successPulse = useSharedValue(1);
  
  const [lastRewardEarned, setLastRewardEarned] = useState(0);
  const nearMissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointerAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const floatingScoreStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatAnim.value }], opacity: floatOpacity.value, position: 'absolute', right: 0, top: -30 }));
  const hitFlashStyle = useAnimatedStyle(() => ({ opacity: hitFlash.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const successPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: successPulse.value }] }));
  const targetOpacityStyle = useAnimatedStyle(() => ({ opacity: targetOpacity.value }));
  const shieldAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: shieldScale.value }] }));
  const freezeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: freezeScale.value }] }));
  const focusAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: focusScale.value }] }));

  const bagItem1Style = useAnimatedStyle(() => ({ transform: [{ translateY: -70 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }], opacity: inventoryProgress.value, position: 'absolute' }));
  const bagItem2Style = useAnimatedStyle(() => ({ transform: [{ translateY: -140 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }], opacity: inventoryProgress.value, position: 'absolute' }));
  const bagItem3Style = useAnimatedStyle(() => ({ transform: [{ translateY: -210 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }], opacity: inventoryProgress.value, position: 'absolute' }));

  // === G A M E P L A Y   F U N C T I O N S ===

  const getSpeedDuration = (currentCombo: number, frozen: boolean = isFrozenRef.current) => {
    const isDiamondWorld = activeWorld.id === 'diamond_world';
    const isPoHWorld = activeWorld.id === 'poh_vault';
    let baseDuration = 2000;
    let speedStep = 60;
    let minDuration = 800;

    if (isDiamondWorld) { baseDuration = 1000; speedStep = 45; minDuration = 400; } 
    else if (isPoHWorld) { baseDuration = 800; speedStep = 30; minDuration = 250; }

    let finalDuration = Math.max(minDuration, baseDuration - currentCombo * speedStep);
    
    // מודיפיקציות מהירות מיוחדות
    if (isFirewallActive) finalDuration *= 0.65; // חומת אש משמעותית מהירה יותר
    if (frozen) finalDuration *= 2.5; 
    
    return finalDuration;
  };

  useEffect(() => {
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => setAdLoaded(true));
    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => setPendingRevive(true));
    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      rewardedAd.load(); 
    });

    rewardedAd.load();
    return () => { unsubscribeLoaded(); unsubscribeEarned(); unsubscribeClosed(); };
  }, []);

  useEffect(() => {
    if (pendingRevive) {
      setGameState('PLAYING');
      setHasRevivedThisRun(true);
      setPendingRevive(false);
      randomizeTarget();
      startRotation(getSpeedDuration(combo), direction);
    }
  }, [pendingRevive]);

  useFocusEffect(
    useCallback(() => {
      loadSavedData();
      loadHapticsEnabled();
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync(STORAGE_KEYS.bank);
      const savedDiamonds = await SecureStore.getItemAsync(STORAGE_KEYS.diamonds);
      const savedSkinId = await SecureStore.getItemAsync(STORAGE_KEYS.equippedSkin);
      const savedWorldId = await SecureStore.getItemAsync(STORAGE_KEYS.equippedWorld);
      const tutSeen = await SecureStore.getItemAsync(STORAGE_KEYS.diamondTutorial);
      const coreSeen = await SecureStore.getItemAsync(STORAGE_KEYS.coreTutorial);
      const unlockedSkinsRaw = await SecureStore.getItemAsync(STORAGE_KEYS.unlockedSkins);
      const unlockedWorldsRaw = await SecureStore.getItemAsync(STORAGE_KEYS.unlockedWorlds);
      
      // V1.4 Data
      const savedMaxCombo = await SecureStore.getItemAsync(STORAGE_KEYS.maxCombo);
      const savedTotalHeists = await SecureStore.getItemAsync(STORAGE_KEYS.totalHeists);
      const savedPrestigeMult = await SecureStore.getItemAsync(STORAGE_KEYS.prestigeMultiplier);
      const savedFirewallGames = await SecureStore.getItemAsync(STORAGE_KEYS.gamesSinceFirewall);

      const currentBank = savedBank ? parseInt(savedBank, 10) : 0;
      const currentDiamonds = savedDiamonds ? parseInt(savedDiamonds, 10) : 0;
      const uSkins = unlockedSkinsRaw ? JSON.parse(unlockedSkinsRaw) : ['white'];
      const uWorlds = unlockedWorldsRaw ? JSON.parse(unlockedWorldsRaw) : ['darknet'];

      if (savedBank) setBank(currentBank);
      if (savedDiamonds) setDiamonds(currentDiamonds);
      if (!tutSeen) setHasSeenDiamondTutorial(false);
      setIntroStep(coreSeen === 'true' ? 3 : 0);

      if (savedSkinId) {
        const foundSkin = SKINS.find((s) => s.id === savedSkinId);
        if (foundSkin) setActiveSkin(foundSkin);
      }
      if (savedWorldId) {
        const foundWorld = WORLDS.find((w) => w.id === savedWorldId);
        if (foundWorld) setActiveWorld(foundWorld);
      }

      if (savedMaxCombo) setLifetimeMaxCombo(parseInt(savedMaxCombo, 10));
      if (savedTotalHeists) setTotalHeists(parseInt(savedTotalHeists, 10));
      if (savedPrestigeMult) setPrestigeMult(parseInt(savedPrestigeMult, 10));
      if (savedFirewallGames) setGamesSinceFirewall(parseInt(savedFirewallGames, 10));

      setMainNextUnlock(getNextUnlock(currentBank, currentDiamonds, uSkins, uWorlds));
      setInventory(await getPowerUpInventory());
      setMissionBadge(await countClaimableMissions());

      const daily = await getDailyRewardInfo();
      if (daily.canClaim) {
        setDailyModal({ visible: true, streak: daily.streak, cash: daily.cashReward, diamonds: daily.diamondReward });
      }
    } catch (e) { console.log('Error loading data', e); }
  };

  const updateAndPersistBank = async (amountToAdd: number) => {
    setBank((currentBank) => {
      const finalBankValue = currentBank + amountToAdd;
      SecureStore.setItemAsync(STORAGE_KEYS.bank, finalBankValue.toString());
      updateMaxBank(finalBankValue);
      return finalBankValue;
    });
  };

  const updateAndPersistDiamonds = async (amountToAdd: number) => {
    setBank((currentBank) => currentBank); 
    setDiamonds((currentDiamonds) => {
      const finalDiamondsValue = currentDiamonds + amountToAdd;
      SecureStore.setItemAsync(STORAGE_KEYS.diamonds, finalDiamondsValue.toString());
      return finalDiamondsValue;
    });
  };

  const updateStatsRecord = async (key: string, currentValue: number) => {
    const saved = await SecureStore.getItemAsync(key);
    if (!saved || currentValue > parseInt(saved, 10)) {
      await SecureStore.setItemAsync(key, currentValue.toString());
    }
  };

  const playScoreAnimation = (amount: number) => {
    setLastRewardEarned(amount);
    floatAnim.value = 0;
    floatOpacity.value = 1;
    floatAnim.value = withTiming(-60, { duration: 600, easing: Easing.out(Easing.quad) });
    floatOpacity.value = withTiming(0, { duration: 600 });
  };

  const flashHit = () => { hitFlash.value = 0.55; hitFlash.value = withTiming(0, { duration: 220 }); };

  const flashMiss = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 40 }), withTiming(12, { duration: 40 }),
      withTiming(-8, { duration: 40 }), withTiming(8, { duration: 40 }), withTiming(0, { duration: 40 })
    );
  };

  const showNearMiss = (customText = 'CLOSE!') => {
    setNearMissText(customText);
    if (nearMissTimer.current) clearTimeout(nearMissTimer.current);
    nearMissTimer.current = setTimeout(() => setNearMissText(null), 1000);
  };

  const pulseSuccess = () => { successPulse.value = withSequence(withTiming(1.08, { duration: 200 }), withTiming(1, { duration: 300 })); };

  const advanceIntro = async () => {
    await hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    if (introStep === null || introStep >= 2) {
      await SecureStore.setItemAsync(STORAGE_KEYS.coreTutorial, 'true');
      setIntroStep(3);
      return;
    }
    setIntroStep(introStep + 1);
  };

  const dismissRiskTutorial = async () => {
    await SecureStore.setItemAsync(STORAGE_KEYS.riskTutorial, 'true');
    setShowRiskTutorial(false);
  };

  const handleClaimDaily = async () => {
    await hapticNotification(Haptics.NotificationFeedbackType.Success);
    const result = await claimDailyReward();
    if (result.cashReward > 0) setBank((b) => b + result.cashReward);
    if (result.diamondReward > 0) setDiamonds((d) => d + result.diamondReward);
    setDailyModal((m) => ({ ...m, visible: false }));
    loadSavedData();
  };

  const handlePrestige = async () => {
    const offer = getPrestigeOffer(bank, prestigeMult);
    if (!offer) return;
    
    await hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
    
    setBank(0);
    await SecureStore.setItemAsync(STORAGE_KEYS.bank, '0');
    
    setPrestigeMult(offer.mult);
    await SecureStore.setItemAsync(STORAGE_KEYS.prestigeMultiplier, offer.mult.toString());
    
    pulseSuccess();
  };

  const randomizeTarget = () => {
    const newAngle = Math.floor(Math.random() * (360 - activeZoneSize));
    setTargetAngle(newAngle);
    
    // אם זו פריצת חומת אש - זה תמיד שווה יהלומים (ונצבע בציאן)
    const isDiamond = isFirewallActive || (activeWorld.id === 'diamond_world' ? true : (Math.random() < DIAMOND_CHANCE));
    setIsDiamondTarget(isDiamond);

    if (isDiamond && !hasSeenDiamondTutorial) {
      setGameState('TUTORIAL');
      SecureStore.setItemAsync(STORAGE_KEYS.diamondTutorial, 'true');
      setHasSeenDiamondTutorial(true);
    }

    if (activeWorld.id === 'zk_vault' || isFirewallActive) {
      targetOpacity.value = 1;
      targetOpacity.value = withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 250 }));
    } else {
      targetOpacity.value = 1;
    }
  };

  const toggleInventory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextState = !isInventoryOpen;
    setIsInventoryOpen(nextState);
    inventoryProgress.value = withTiming(nextState ? 1 : 0, { duration: 350, easing: Easing.out(Easing.exp) });
  };

  const closeInventory = () => {
    if (isInventoryOpen) {
      setIsInventoryOpen(false);
      inventoryProgress.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.exp) });
    }
  };

  const startGame = async () => {
    if (introStep !== null && introStep < 3) return;
    cancelAnimation(rotation);
    rotation.value = 0;
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setDirection(1);
    setConsolationPrize(0);
    setRunMaxCombo(0);
    setRunDiamondsEarned(0);
    setHasRevivedThisRun(false); 
    
    setIsShieldActive(false);
    setFocusTapsLeft(0);
    setIsFrozen(false);
    isFrozenRef.current = false;
    
    cancelAnimation(shieldScale); shieldScale.value = 1;
    cancelAnimation(freezeScale); freezeScale.value = 1;
    cancelAnimation(focusScale); focusScale.value = 1;

    // --- מערכת חומת האש (Firewall Breach) ---
    let currentFirewallCount = gamesSinceFirewall + 1;
    let triggerFirewall = false;
    
    // סיכוי של 10% לפרוץ חומת אש אחרי לפחות 10 משחקים ללא אירוע
    if (currentFirewallCount >= 10 && Math.random() < 0.10) {
      triggerFirewall = true;
      currentFirewallCount = 0;
    }
    
    setGamesSinceFirewall(currentFirewallCount);
    SecureStore.setItemAsync(STORAGE_KEYS.gamesSinceFirewall, currentFirewallCount.toString());
    setIsFirewallActive(triggerFirewall);

    closeInventory();
    targetOpacity.value = 1;
    setGameState('PLAYING');
    
    // קוראים ל-randomizeTarget כדי שיקלוט את ה-activeZoneSize החדש (כולל הפיירוול)
    setTimeout(() => {
      randomizeTarget();
      startRotation(getSpeedDuration(0), 1);
    }, 0);
  };

  const startRotation = (duration: number, dir: number) => {
    cancelAnimation(rotation);
    const currentAngle = rotation.value % 360;
    rotation.value = currentAngle;
    requestAnimationFrame(() => {
      rotation.value = withRepeat(
        withTiming(currentAngle + 360 * dir, { duration, easing: Easing.linear }),
        -1, false
      );
    });
  };

  const activateShield = async () => {
    if (inventory.smart_shield > 0 && !isShieldActive && gameState === 'PLAYING') {
      await hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
      setInventory(prev => ({ ...prev, smart_shield: prev.smart_shield - 1 }));
      await addPowerUp('smart_shield', -1);
      setIsShieldActive(true);
      closeInventory();
      shieldScale.value = withRepeat(withSequence(withTiming(1.15, {duration: 500}), withTiming(1, {duration: 500})), -1, true);
    }
  };

  const activateFreeze = async () => {
    if (inventory.time_freeze > 0 && !isFrozenRef.current && gameState === 'PLAYING') {
      await hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
      setInventory(prev => ({ ...prev, time_freeze: prev.time_freeze - 1 }));
      await addPowerUp('time_freeze', -1);
      
      setIsFrozen(true);
      isFrozenRef.current = true;
      closeInventory();
      freezeScale.value = withRepeat(withSequence(withTiming(1.15, {duration: 500}), withTiming(1, {duration: 500})), -1, true);

      startRotation(getSpeedDuration(combo, true), direction);

      setTimeout(() => {
        isFrozenRef.current = false;
        setIsFrozen(false);
        cancelAnimation(freezeScale); freezeScale.value = 1;
      }, 3000); 
    }
  };

  const activateFocus = async () => {
    if (inventory.precision_focus > 0 && focusTapsLeft === 0 && gameState === 'PLAYING') {
      await hapticImpact(Haptics.ImpactFeedbackStyle.Light);
      setInventory(prev => ({ ...prev, precision_focus: prev.precision_focus - 1 }));
      await addPowerUp('precision_focus', -1);
      setFocusTapsLeft(5); 
      closeInventory();
      focusScale.value = withRepeat(withSequence(withTiming(1.15, {duration: 500}), withTiming(1, {duration: 500})), -1, true);
    }
  };

  const enterRiskMode = async () => {
    cancelAnimation(rotation);
    closeInventory();
    const riskSeen = await SecureStore.getItemAsync(STORAGE_KEYS.riskTutorial);
    setShowRiskTutorial(riskSeen !== 'true');
    setGameState('RISK');
  };

  const handleCashOut = async () => {
    await dismissRiskTutorial();
    await hapticNotification(Haptics.NotificationFeedbackType.Success);
    pulseSuccess();
    updateAndPersistBank(score);
    const newHeists = await incrementTotalHeists();
    setTotalHeists(newHeists);
    await incrementWeeklyHeists();
    
    updateStatsRecord(STORAGE_KEYS.bestRunCash, score);
    updateStatsRecord(STORAGE_KEYS.bestRunDiamonds, runDiamondsEarned);
    
    if (score >= 50000) {
      if (await StoreReview.hasAction()) {
        StoreReview.requestReview();
      }
    }
    
    setGameState('CASHED_OUT');
    setMissionBadge(await countClaimableMissions());
  };

  const handleRiskIt = async () => {
    await dismissRiskTutorial();
    await hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    const newMult = multiplier * 2;
    setMultiplier(newMult);
    updateStatsRecord(STORAGE_KEYS.maxMultiplier, newMult);
    setGameState('PLAYING');
    randomizeTarget();
    setTimeout(() => { startRotation(getSpeedDuration(combo), direction); }, 0);
  };

  const handleShareResult = async () => {
    try { await Share.share({ message: `I just hacked $${score.toLocaleString()} into my vault on Tap Heist! x${multiplier} multiplier. Can you beat my heist?` }); } catch (_) {}
  };

  const processGameOver = async () => {
    const calculatedPrize = Math.floor(score * FAIL_REWARD_FRACTION);
    setConsolationPrize(calculatedPrize);
    updateAndPersistBank(calculatedPrize);
    const newHeists = await incrementTotalHeists();
    setTotalHeists(newHeists);
    await incrementWeeklyHeists();
    
    updateStatsRecord(STORAGE_KEYS.bestRunCash, calculatedPrize);
    updateStatsRecord(STORAGE_KEYS.bestRunDiamonds, runDiamondsEarned);
    
    closeInventory();
    targetOpacity.value = 1; 
    setGameState('GAMEOVER');
    setMissionBadge(await countClaimableMissions());
  };

  const handleTap = async () => {
    if (gameState === 'START' || gameState === 'CASHED_OUT') { await startGame(); return; }
    if (gameState === 'TUTORIAL') { setGameState('PLAYING'); startRotation(getSpeedDuration(combo), 1); return; }
    if (gameState !== 'PLAYING') return;
    if (isInventoryOpen) { closeInventory(); return; }

    const currentRawAngle = rotation.value;
    cancelAnimation(rotation);
    rotation.value = currentRawAngle;

    const normalizedCurrentAngle = ((currentRawAngle % 360) + 360) % 360;
    const targetCenter = targetAngle + activeZoneSize / 2;
    let angleDiff = Math.abs(normalizedCurrentAngle - targetCenter);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    const isHit = angleDiff <= activeZoneSize / 2;
    const isNearMiss = !isHit && angleDiff <= (activeZoneSize / 2) * NEAR_MISS_MULTIPLIER;

    if (isHit) {
      if (focusTapsLeft > 0) {
        setFocusTapsLeft(prev => prev - 1); 
        if (focusTapsLeft - 1 === 0) { cancelAnimation(focusScale); focusScale.value = 1; }
      }

      const newCombo = combo + 1;
      setCombo(newCombo);
      setRunMaxCombo((c) => Math.max(c, newCombo));
      setLifetimeMaxCombo((c) => Math.max(c, newCombo));
      updateStatsRecord(STORAGE_KEYS.maxCombo, newCombo);
      flashHit();

      if (isFirewallActive) {
        // פרס מיוחד לחומת אש
        await hapticNotification(Haptics.NotificationFeedbackType.Success);
        updateAndPersistDiamonds(3);
        setRunDiamondsEarned((d) => d + 3);
        playScoreAnimation(3);
      } else if (isDiamondTarget) {
        await hapticNotification(Haptics.NotificationFeedbackType.Success);
        updateAndPersistDiamonds(1);
        setRunDiamondsEarned((d) => d + 1);
        playScoreAnimation(1);
      } else {
        await hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        const worldMultiplier = activeWorld.id === 'poh_vault' ? 5 : 1;
        // הכפלת נקודות גם לפי כוח ה-Prestige!
        const reward = BASE_REWARD * multiplier * worldMultiplier * prestigeMult;
        setScore((s) => s + reward);
        playScoreAnimation(reward);
      }

      let nextDirection = direction;
      if (newCombo % 5 === 0) {
        nextDirection = direction === 1 ? -1 : 1;
        setDirection(nextDirection);
      }

      if (newCombo % 10 === 0 && activeWorld.id !== 'diamond_world') { 
        await enterRiskMode(); 
        return; 
      }

      randomizeTarget();
      startRotation(getSpeedDuration(newCombo), nextDirection);
    } else {
      await hapticNotification(Haptics.NotificationFeedbackType.Error);

      if (isShieldActive) {
        setIsShieldActive(false);
        cancelAnimation(shieldScale); shieldScale.value = 1;
        flashMiss();
        showNearMiss('🛡️ SHIELD BROKEN!');
        const nextDirection = direction === 1 ? -1 : 1;
        setDirection(nextDirection);
        randomizeTarget();
        startRotation(getSpeedDuration(combo), nextDirection);
        return;
      }

      flashMiss();
      if (isNearMiss) showNearMiss();
      
      if (!hasRevivedThisRun && adLoaded && combo >= 10) {
        setGameState('REVIVE_OFFER');
      } else {
        await processGameOver();
      }
    }
  };

  // === R E N D E R ===

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(activeZoneSize / 360) * circumference} ${circumference}`;
  const strokeDashoffset = -(targetAngle / 360) * circumference;
  const isDirectionWarning = gameState === 'PLAYING' && combo > 0 && (combo + 1) % 5 === 0;
  const canTapVault = gameState === 'PLAYING' || gameState === 'START' || gameState === 'CASHED_OUT' || gameState === 'TUTORIAL';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeWorld.bg }]}>
      <Animated.View style={[styles.mainWrap, shakeStyle]}>
        
        <GameHeader 
          activeWorld={activeWorld}
          activeSkin={activeSkin}
          bank={bank}
          diamonds={diamonds}
          gameState={gameState}
          score={score}
          lastRewardEarned={lastRewardEarned}
          isDiamondTarget={isDiamondTarget}
          multiplier={multiplier}
          floatingScoreStyle={floatingScoreStyle}
          isShieldActive={isShieldActive}
          shieldAnimStyle={shieldAnimStyle}
          isFrozen={isFrozen}
          freezeAnimStyle={freezeAnimStyle}
          focusTapsLeft={focusTapsLeft}
          focusAnimStyle={focusAnimStyle}
          combo={combo}
          isDirectionWarning={isDirectionWarning}
          nearMissText={nearMissText}
        />

        <Pressable style={styles.touchArea} onPress={canTapVault ? handleTap : undefined} disabled={!canTapVault}>
          <VaultRing 
            CIRCLE_SIZE={CIRCLE_SIZE}
            STROKE_WIDTH={STROKE_WIDTH}
            radius={radius}
            activeWorld={activeWorld}
            targetOpacityStyle={targetOpacityStyle}
            isDiamondTarget={isDiamondTarget}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            gameState={gameState}
            hitFlashStyle={hitFlashStyle}
            pointerAnimatedStyle={pointerAnimatedStyle}
            activeSkin={activeSkin}
          />
        </Pressable>

        <TacticalArsenal 
          gameState={gameState}
          inventory={inventory}
          isInventoryOpen={isInventoryOpen}
          toggleInventory={toggleInventory}
          activateShield={activateShield}
          activateFreeze={activateFreeze}
          activateFocus={activateFocus}
          isShieldActive={isShieldActive}
          isFrozen={isFrozen}
          focusTapsLeft={focusTapsLeft}
          bagItem1Style={bagItem1Style}
          bagItem2Style={bagItem2Style}
          bagItem3Style={bagItem3Style}
        />

        <GameUI 
          gameState={gameState}
          setGameState={setGameState}
          activeWorld={activeWorld}
          mainNextUnlock={mainNextUnlock}
          missionBadge={missionBadge}
          score={score}
          multiplier={multiplier}
          consolationPrize={consolationPrize}
          runMaxCombo={runMaxCombo}
          runDiamondsEarned={runDiamondsEarned}
          showRiskTutorial={showRiskTutorial}
          dismissRiskTutorial={dismissRiskTutorial}
          handleCashOut={handleCashOut}
          handleRiskIt={handleRiskIt}
          processGameOver={processGameOver}
          startGame={startGame}
          handleShareResult={handleShareResult}
          onRevive={() => rewardedAd.show()}
          successPulseStyle={successPulseStyle}
          introStep={introStep}
          advanceIntro={advanceIntro}
          dailyModal={dailyModal}
          setDailyModal={setDailyModal}
          handleClaimDaily={handleClaimDaily}
          
          hackerRank={getHackerRank(totalHeists, lifetimeMaxCombo)}
          prestigeMult={prestigeMult}
          prestigeOffer={getPrestigeOffer(bank, prestigeMult)}
          handlePrestige={handlePrestige}
          isFirewallActive={isFirewallActive}
        />

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  touchArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
});