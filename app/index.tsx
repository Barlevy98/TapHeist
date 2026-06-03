import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Share, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Polygon, Path, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// --- גרסה 1.3: ייבוא כלי דירוג חכם של אפל ---
import * as StoreReview from 'expo-store-review';

import { GradientPointer } from '../components/GradientPointer';

import { SKINS, WORLDS, Skin, World } from '../gamedata';
import {
  STORAGE_KEYS,
  CORE_TUTORIAL_STEPS,
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
  incrementWeeklyHeists
} from '../gameHelpers';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 25;
const ZONE_SIZE = 45;
const BASE_REWARD = 4;
const FAIL_REWARD_FRACTION = 0.25;
const DIAMOND_CHANCE = 0.20;
const NEAR_MISS_MULTIPLIER = 1.35;

// --- תיקון טכני אנדרואיד: החלפת מפתח הטסט במפתח האמיתי שלך ---
const adUnitId = __DEV__ 
  ? TestIds.REWARDED 
  : (Platform.OS === 'ios' ? 'ca-app-pub-9244809721385064/8775411934' : 'ca-app-pub-9244809721385064/5943204821');

const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: false,
});

export default function GameScreen() {
  const router = useRouter();

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

  // --- ליטוש UX: סטייט ליעד הבא במסך הראשי ---
  const [mainNextUnlock, setMainNextUnlock] = useState<any>(null);

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const inventoryProgress = useSharedValue(0);

  const currentZoneSize = focusTapsLeft > 0 ? ZONE_SIZE * 2 : ZONE_SIZE;

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

  const shieldScale = useSharedValue(1);
  const freezeScale = useSharedValue(1);
  const focusScale = useSharedValue(1);

  const floatAnim = useSharedValue(0);
  const floatOpacity = useSharedValue(0);
  const targetOpacity = useSharedValue(1); 

  const [lastRewardEarned, setLastRewardEarned] = useState(0);
  const rotation = useSharedValue(0);
  const hitFlash = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const successPulse = useSharedValue(1);
  const nearMissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSpeedDuration = (currentCombo: number, frozen: boolean = isFrozenRef.current) => {
    const isDiamondWorld = activeWorld.id === 'diamond_world';
    const isPoHWorld = activeWorld.id === 'poh_vault';
    
    let baseDuration = 2000;
    let speedStep = 60;
    let minDuration = 800;

    if (isDiamondWorld) {
      baseDuration = 1000; speedStep = 45; minDuration = 400;
    } else if (isPoHWorld) {
      baseDuration = 800; speedStep = 30; minDuration = 250;
    }

    let finalDuration = Math.max(minDuration, baseDuration - currentCombo * speedStep);
    
    if (frozen) {
      finalDuration *= 2.5; 
    }
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

      // --- חישוב היעד הבא למסך הבית ---
      const next = getNextUnlock(currentBank, currentDiamonds, uSkins, uWorlds);
      setMainNextUnlock(next);

      const inv = await getPowerUpInventory();
      setInventory(inv);
      const claimable = await countClaimableMissions();
      setMissionBadge(claimable);

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
    setBank((currentBank) => { return currentBank; }); // מונע קריסה מרוץ סטייט
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

  const flashHit = () => {
    hitFlash.value = 0.55;
    hitFlash.value = withTiming(0, { duration: 220 });
  };

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

  const pulseSuccess = () => {
    successPulse.value = withSequence(withTiming(1.08, { duration: 200 }), withTiming(1, { duration: 300 }));
  };

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

  const randomizeTarget = () => {
    const newAngle = Math.floor(Math.random() * (360 - currentZoneSize));
    setTargetAngle(newAngle);
    
    const isDiamond = activeWorld.id === 'diamond_world' ? true : (Math.random() < DIAMOND_CHANCE);
    setIsDiamondTarget(isDiamond);

    if (isDiamond && !hasSeenDiamondTutorial) {
      setGameState('TUTORIAL');
      SecureStore.setItemAsync(STORAGE_KEYS.diamondTutorial, 'true');
      setHasSeenDiamondTutorial(true);
    }

    if (activeWorld.id === 'zk_vault') {
      targetOpacity.value = 1;
      targetOpacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 250 })
      );
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

    closeInventory();
    targetOpacity.value = 1;

    setGameState('PLAYING');
    randomizeTarget();
    setTimeout(() => startRotation(getSpeedDuration(0), 1), 0);
  };

  const startRotation = (duration: number, dir: number) => {
    cancelAnimation(rotation);
    const currentVal = rotation.value;
    rotation.value = withRepeat(
      withTiming(currentVal + 360 * dir, { duration, easing: Easing.linear }),
      -1, false
    );
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
    await incrementTotalHeists();
    
    // --- גרסה 1.3: הוספת ספירה למשימות השבועיים ---
    await incrementWeeklyHeists();
    
    updateStatsRecord(STORAGE_KEYS.bestRunCash, score);
    updateStatsRecord(STORAGE_KEYS.bestRunDiamonds, runDiamondsEarned);
    
    // --- גרסה 1.3: הקפצת חלונית דירוג חכמה בשיא רגשי חיובי (מעל 50,000$) ---
    if (score >= 50000) {
      if (await StoreReview.hasAction()) {
        StoreReview.requestReview();
      }
    }
    
    setGameState('CASHED_OUT');
    const claimable = await countClaimableMissions();
    setMissionBadge(claimable);
  };

  const handleRiskIt = async () => {
    await dismissRiskTutorial();
    await hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    const newMult = multiplier * 2;
    setMultiplier(newMult);
    updateStatsRecord(STORAGE_KEYS.maxMultiplier, newMult);
    setGameState('PLAYING');
    randomizeTarget();
    setTimeout(() => {
      startRotation(getSpeedDuration(combo), direction);
    }, 0);
  };

  const handleShareResult = async () => {
    try { await Share.share({ message: `I just hacked $${score.toLocaleString()} into my vault on Tap Heist! x${multiplier} multiplier. Can you beat my heist?` }); } catch (_) {}
  };

  const processGameOver = async () => {
    const calculatedPrize = Math.floor(score * FAIL_REWARD_FRACTION);
    setConsolationPrize(calculatedPrize);
    updateAndPersistBank(calculatedPrize);
    await incrementTotalHeists();
    await incrementWeeklyHeists();
    
    updateStatsRecord(STORAGE_KEYS.bestRunCash, calculatedPrize);
    updateStatsRecord(STORAGE_KEYS.bestRunDiamonds, runDiamondsEarned);
    
    closeInventory();
    targetOpacity.value = 1; 
    setGameState('GAMEOVER');
    const claimable = await countClaimableMissions();
    setMissionBadge(claimable);
  };

  const handleTap = async () => {
    if (gameState === 'START' || gameState === 'CASHED_OUT') { await startGame(); return; }
    if (gameState === 'TUTORIAL') { setGameState('PLAYING'); startRotation(getSpeedDuration(combo), 1); return; }
    if (gameState !== 'PLAYING') return;
    if (isInventoryOpen) { closeInventory(); return; }

    const currentRawAngle = rotation.value;
    const normalizedCurrentAngle = ((currentRawAngle % 360) + 360) % 360;
    const targetCenter = targetAngle + currentZoneSize / 2;
    let angleDiff = Math.abs(normalizedCurrentAngle - targetCenter);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    const isHit = angleDiff <= currentZoneSize / 2;
    const isNearMiss = !isHit && angleDiff <= (currentZoneSize / 2) * NEAR_MISS_MULTIPLIER;

    if (isHit) {
      if (focusTapsLeft > 0) {
        setFocusTapsLeft(prev => prev - 1); 
        if (focusTapsLeft - 1 === 0) {
          cancelAnimation(focusScale); focusScale.value = 1;
        }
      }

      const newCombo = combo + 1;
      setCombo(newCombo);
      setRunMaxCombo((c) => Math.max(c, newCombo));
      updateStatsRecord(STORAGE_KEYS.maxCombo, newCombo);
      flashHit();

      if (isDiamondTarget) {
        await hapticNotification(Haptics.NotificationFeedbackType.Success);
        updateAndPersistDiamonds(1);
        setRunDiamondsEarned((d) => d + 1);
        playScoreAnimation(1);
      } else {
        await hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        const worldMultiplier = activeWorld.id === 'poh_vault' ? 5 : 1;
        const reward = BASE_REWARD * multiplier * worldMultiplier;
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
      cancelAnimation(rotation);

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

  const pointerAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const floatingScoreStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }], opacity: floatOpacity.value, position: 'absolute', right: 0, top: -30,
  }));
  const hitFlashStyle = useAnimatedStyle(() => ({ opacity: hitFlash.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const successPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: successPulse.value }] }));
  const targetOpacityStyle = useAnimatedStyle(() => ({ opacity: targetOpacity.value }));
  
  const shieldAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: shieldScale.value }] }));
  const freezeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: freezeScale.value }] }));
  const focusAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: focusScale.value }] }));

  const bagItem1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: -70 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }],
    opacity: inventoryProgress.value,
    position: 'absolute',
  }));
  const bagItem2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: -140 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }],
    opacity: inventoryProgress.value,
    position: 'absolute',
  }));
  const bagItem3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: -210 * inventoryProgress.value }, { scale: 0.5 + 0.5 * inventoryProgress.value }],
    opacity: inventoryProgress.value,
    position: 'absolute',
  }));

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(currentZoneSize / 360) * circumference} ${circumference}`;
  const strokeDashoffset = -(targetAngle / 360) * circumference;
  const isDirectionWarning = gameState === 'PLAYING' && combo > 0 && (combo + 1) % 5 === 0;
  const canTapVault = gameState === 'PLAYING' || gameState === 'START' || gameState === 'CASHED_OUT' || gameState === 'TUTORIAL';

  const renderRunStats = () => (
    <Text style={styles.runStatsText}>Run: {runMaxCombo} combo · x{multiplier} peak · 💎 {runDiamondsEarned} this heist</Text>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeWorld.bg }]}>
      <Animated.View style={[styles.mainWrap, shakeStyle]}>
        <View style={styles.header}>
          <View style={styles.bankContainer}>
            <Text style={[styles.bankLabel, { color: activeWorld.textSecondary }]}>BANK</Text>
            <Text style={styles.bankText}>${bank.toLocaleString()}</Text>
            <Text style={styles.diamondText}>💎 {diamonds.toLocaleString()}</Text>
          </View>

          {(gameState === 'PLAYING' || gameState === 'RISK' || gameState === 'GAMEOVER' || gameState === 'REVIVE_OFFER') && (
            <View style={styles.scoreContainer}>
              <View>
                <Text style={[styles.scoreText, { color: activeWorld.textPrimary, textShadowColor: activeSkin.color }]}>${score.toLocaleString()}</Text>
                <Animated.Text style={[styles.floatingScoreText, floatingScoreStyle, { color: isDiamondTarget ? '#00FFFF' : '#00FF66' }]}>
                  +{lastRewardEarned}{isDiamondTarget ? '💎' : '$'}
                </Animated.Text>
              </View>
              {multiplier > 1 && <Text style={styles.multiplierText}>x{multiplier} MULTIPLIER</Text>}
            </View>
          )}
        </View>

        {gameState === 'PLAYING' && (
          <View style={styles.activeBoostsHud}>
            {isShieldActive && (
              <Animated.View style={[styles.miniBoostIcon, { borderColor: '#00FF66', shadowColor: '#00FF66' }, shieldAnimStyle]}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
              </Animated.View>
            )}
            {isFrozen && (
              <Animated.View style={[styles.miniBoostIcon, { borderColor: '#00FFFF', shadowColor: '#00FFFF' }, freezeAnimStyle]}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
                  <Path d="M12 7v5l3 3" />
                </Svg>
              </Animated.View>
            )}
            {focusTapsLeft > 0 && (
              <Animated.View style={[styles.miniBoostIcon, { borderColor: '#FFCC00', shadowColor: '#FFCC00', flexDirection: 'row' }, focusAnimStyle]}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4M12 8v8M8 12h8" />
                </Svg>
                <Text style={{ color: '#FFCC00', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>{focusTapsLeft}</Text>
              </Animated.View>
            )}
          </View>
        )}

        {gameState === 'PLAYING' && combo > 0 && (
          <View style={styles.comboHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.comboText, { color: activeSkin.color }]}>{combo} COMBO</Text>
            </View>
            {isDirectionWarning && <Text style={styles.warningText}>⚠️ FLIP IMMINENT ⚠️</Text>}
            {nearMissText && <Text style={styles.nearMissText}>{nearMissText}</Text>}
          </View>
        )}

        <Pressable style={styles.touchArea} onPress={canTapVault ? handleTap : undefined} disabled={!canTapVault}>
          <View style={styles.vaultContainer}>
            
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
              <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={radius} stroke={activeWorld.vaultRing} strokeWidth={STROKE_WIDTH} fill="none" />
            </Svg>

            <Animated.View style={[styles.svg, targetOpacityStyle]} pointerEvents="none">
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                <Circle
                  cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={radius} stroke={isDiamondTarget ? '#00FFFF' : '#00FF66'}
                  strokeWidth={STROKE_WIDTH} fill="none" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                  origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`} rotation="-90"
                />
                {isDiamondTarget && gameState === 'PLAYING' && (
                  <SvgText x={CIRCLE_SIZE / 2} y={CIRCLE_SIZE / 2 - radius + 8} fill="#00FFFF" fontSize="22" fontWeight="bold" textAnchor="middle">💎</SvgText>
                )}
              </Svg>
            </Animated.View>

            <Animated.View pointerEvents="none" style={[styles.hitFlashOverlay, hitFlashStyle]} />

            <Animated.View style={[styles.pointerContainer, pointerAnimatedStyle]}>
              {activeSkin.shape === 'gradient' && (
                <GradientPointer size={CIRCLE_SIZE} primaryColor={activeSkin.primaryColor} secondaryColor={activeSkin.secondaryColor} rotation={0} />
              )}
              {activeSkin.shape === 'standard' && (
                <View style={[styles.pointer, { backgroundColor: activeSkin.color, shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, width: activeSkin.width }]} />
              )}
              {activeSkin.shape === 'spiked' && (
                <Svg width={activeSkin.width * 4} height={CIRCLE_SIZE / 2} style={{ shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1 }}>
                  <Polygon points={`${activeSkin.width * 2},0 0,${CIRCLE_SIZE / 2} ${activeSkin.width * 4},${CIRCLE_SIZE / 2}`} fill={activeSkin.color} />
                </Svg>
              )}
              {activeSkin.shape === 'lightning' && (
                <Svg width={activeSkin.width * 6} height={CIRCLE_SIZE / 2} style={{ shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1 }}>
                  <Path d={`M${activeSkin.width * 3},0 L0,${CIRCLE_SIZE / 3} L${activeSkin.width * 4},${CIRCLE_SIZE / 2.5} L${activeSkin.width},${CIRCLE_SIZE / 2} L${activeSkin.width * 6},${CIRCLE_SIZE / 1.5} L${activeSkin.width * 3},${CIRCLE_SIZE / 2}`} stroke={activeSkin.color} strokeWidth={activeSkin.width / 2} fill="none" />
                </Svg>
              )}
              
              {activeSkin.shape === 'binary' && (
                <Svg width={40} height={CIRCLE_SIZE / 2} style={{ shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1 }}>
                  <Defs>
                    <LinearGradient id="binaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={activeSkin.color} stopOpacity="0.0" />
                      <Stop offset="0.5" stopColor={activeSkin.color} stopOpacity="0.5" />
                      <Stop offset="1" stopColor={activeSkin.color} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Path d={`M18,0 L22,0 L22,${CIRCLE_SIZE/2 - 20} L18,${CIRCLE_SIZE/2 - 20} Z`} fill="url(#binaryGrad)" />
                  <Rect x="14" y="20" width="12" height="4" fill={activeSkin.color} opacity="0.4" />
                  <Rect x="16" y="45" width="8" height="4" fill={activeSkin.color} opacity="0.7" />
                  <Rect x="12" y="70" width="16" height="4" fill={activeSkin.color} opacity="0.9" />
                  <Polygon points={`10,${CIRCLE_SIZE/2 - 20} 30,${CIRCLE_SIZE/2 - 20} 20,${CIRCLE_SIZE/2}`} fill={activeSkin.color} />
                </Svg>
              )}
              
              {activeSkin.shape === 'chain' && (
                <Svg width={40} height={CIRCLE_SIZE / 2} style={{ shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1 }}>
                  <Polygon points="20,10 28,15 28,25 20,30 12,25 12,15" fill="none" stroke={activeSkin.color} strokeWidth="3" />
                  <Circle cx="20" cy="20" r="2" fill={activeSkin.color} />
                  <Path d="M20,30 L20,45" stroke={activeSkin.color} strokeWidth="3" strokeDasharray="3 3" />
                  <Polygon points="20,45 28,50 28,60 20,65 12,60 12,50" fill="none" stroke={activeSkin.color} strokeWidth="3" />
                  <Circle cx="20" cy="55" r="2" fill={activeSkin.color} />
                  <Path d="M20,65 L20,80" stroke={activeSkin.color} strokeWidth="3" strokeDasharray="3 3" />
                  <Polygon points="20,80 32,86 32,100 20,115 8,100 8,86" fill={activeSkin.color} />
                  <Polygon points="20,86 26,90 26,98 20,105 14,98 14,90" fill="#000" opacity="0.5" />
                </Svg>
              )}
            </Animated.View>
          </View>
        </Pressable>

        {gameState === 'PLAYING' && (
          <View style={styles.arsenalContainer} pointerEvents="box-none">
            <Animated.View style={[styles.tacticalBtnWrapper, bagItem3Style]} pointerEvents={isInventoryOpen ? "auto" : "none"}>
              <TouchableOpacity style={[styles.tacticalBtn, inventory.precision_focus === 0 && { opacity: 0.3 }]} onPress={activateFocus} disabled={inventory.precision_focus === 0 || focusTapsLeft > 0}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4M12 8v8M8 12h8" />
                </Svg>
                <Text style={[styles.powerCount, { color: '#FFCC00' }]}>{inventory.precision_focus}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.tacticalBtnWrapper, bagItem2Style]} pointerEvents={isInventoryOpen ? "auto" : "none"}>
              <TouchableOpacity style={[styles.tacticalBtn, inventory.time_freeze === 0 && { opacity: 0.3 }]} onPress={activateFreeze} disabled={inventory.time_freeze === 0 || isFrozen}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
                  <Path d="M12 7v5l3 3" />
                </Svg>
                <Text style={[styles.powerCount, { color: '#00FFFF' }]}>{inventory.time_freeze}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.tacticalBtnWrapper, bagItem1Style]} pointerEvents={isInventoryOpen ? "auto" : "none"}>
              <TouchableOpacity style={[styles.tacticalBtn, inventory.smart_shield === 0 && { opacity: 0.3 }]} onPress={activateShield} disabled={inventory.smart_shield === 0 || isShieldActive}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
                <Text style={[styles.powerCount, { color: '#00FF66' }]}>{inventory.smart_shield}</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={toggleInventory} style={[styles.bagButton, isInventoryOpen && { borderColor: '#00FF66', shadowColor: '#00FF66' }]}>
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isInventoryOpen ? "#00FF66" : "#FFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isInventoryOpen ? (
                  <>
                    <Path d="M18 6L6 18" />
                    <Path d="M6 6l12 12" />
                  </>
                ) : (
                  <>
                    <Rect x="3" y="8" width="18" height="12" rx="2" ry="2" />
                    <Path d="M16 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    <Path d="M12 12v4" />
                    <Path d="M10 14h4" />
                  </>
                )}
              </Svg>
              {!isInventoryOpen && <Text style={styles.bagText}>ARSENAL</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.uiContainer} pointerEvents="box-none">
          {gameState === 'START' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.actionText, { color: activeWorld.textPrimary }]}>TAP TO HACK</Text>
              <Text style={styles.hookText}>One tap to crack the vault. Cash out or lose it all.</Text>
              
              {/* --- גרסה 1.3: תצוגת היעד הבא מעוצבת ונקייה מתחת להסבר --- */}
              {mainNextUnlock && (
                <Text style={styles.mainNextUnlockText}>
                  NEXT OBJECTIVE: {mainNextUnlock.name} ({mainNextUnlock.currency === 'diamond' ? '💎' : '$'}{mainNextUnlock.missing.toLocaleString()} LEFT)
                </Text>
              )}

              <View style={styles.menuRow}>
                <TouchableOpacity onPress={() => router.push('/shop')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}><Text style={styles.menuButtonText}>SHOP</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/missions')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}><Text style={styles.menuButtonText}>MISSIONS</Text>{missionBadge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{missionBadge}</Text></View>}</TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/stats' as Parameters<typeof router.push>[0])} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}><Text style={styles.menuButtonText}>STATS</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}><Text style={styles.menuButtonText}>SETTINGS</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {gameState === 'TUTORIAL' && (
            <View style={styles.tutorialContainer}>
              <Text style={styles.tutorialTitle}>💎 PREMIUM TARGET DETECTED 💎</Text>
              <Text style={styles.tutorialText}>Cyan zones with 💎 award Diamonds to your vault, even if you fail later.</Text>
              <Text style={styles.tutorialTap}>TAP TO CONTINUE</Text>
            </View>
          )}

          {gameState === 'RISK' && (
            <View style={styles.riskContainer} pointerEvents="box-none">
              <Text style={styles.riskTitle}>RISK MODE</Text>
              <Text style={styles.riskSubtitle}>System Paused</Text>
              {showRiskTutorial && (
                <View style={styles.riskTutorialBox}>
                  <Text style={styles.riskTutorialText}>CASH OUT = keep run earnings. RISK IT = double multiplier but one miss ends the run.</Text>
                  <TouchableOpacity onPress={dismissRiskTutorial} style={styles.riskTutorialBtn}><Text style={styles.riskTutorialBtnText}>GOT IT</Text></TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={handleCashOut} style={styles.cashOutButton}><Text style={styles.cashOutText}>CASH OUT (${score.toLocaleString()})</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleRiskIt} style={styles.riskItButton}><Text style={styles.riskItText}>RISK IT (x{multiplier * 2})</Text></TouchableOpacity>
            </View>
          )}

          {gameState === 'REVIVE_OFFER' && (
            <View style={styles.gameOverContainer}>
              <Text style={[styles.gameOverText, { color: '#FFCC00' }]}>SYSTEM COMPROMISED</Text>
              <Text style={styles.scrappedText}>Inject backdoor to resume hack?</Text>
              <TouchableOpacity onPress={() => { rewardedAd.show(); }} style={[styles.retryButton, { backgroundColor: '#FFCC00', marginBottom: 12, paddingHorizontal: 30 }]}><Text style={[styles.retryButtonText, { color: '#000' }]}>WATCH AD TO REVIVE</Text></TouchableOpacity>
              <TouchableOpacity onPress={processGameOver} style={styles.secondaryActionButton}><Text style={styles.secondaryActionText}>GIVE UP (Take 25%)</Text></TouchableOpacity>
            </View>
          )}

          {gameState === 'CASHED_OUT' && (
            <Animated.View style={[styles.gameOverContainer, successPulseStyle]}>
              <Text style={styles.successText}>HACK SUCCESSFUL</Text>
              <Text style={[styles.finalScoreText, { color: activeWorld.textPrimary }]}>Transferred ${score.toLocaleString()} to Bank</Text>
              {renderRunStats()}
              <TouchableOpacity onPress={startGame} style={styles.retryButton}><Text style={styles.retryButtonText}>NEXT HEIST</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleShareResult} style={styles.shareButton}><Text style={styles.shareButtonText}>SHARE HEIST</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/shop')} style={styles.secondaryActionButton}><Text style={styles.secondaryActionText}>GO TO SHOP</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setGameState('START')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary, width: 180, marginTop: 12 }]}><Text style={styles.menuButtonText}>MAIN MENU</Text></TouchableOpacity>
            </Animated.View>
          )}

          {gameState === 'GAMEOVER' && (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverText}>SYSTEM LOCKED</Text>
              <Text style={styles.scrappedText}>Scrapped 25% of earnings: +${consolationPrize.toLocaleString()}</Text>
              {renderRunStats()}
              <TouchableOpacity onPress={startGame} style={styles.retryButton}><Text style={styles.retryButtonText}>RETRY</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/shop')} style={styles.secondaryActionButton}><Text style={styles.secondaryActionText}>GO TO SHOP</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setGameState('START')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary, width: 180, marginTop: 12 }]}><Text style={styles.menuButtonText}>MAIN MENU</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      {introStep !== null && introStep < 3 && gameState === 'START' && (
        <View style={styles.introOverlay}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{CORE_TUTORIAL_STEPS[introStep].title}</Text>
            <Text style={styles.introText}>{CORE_TUTORIAL_STEPS[introStep].text}</Text>
            <Text style={styles.introProgress}>{introStep + 1} / 3</Text>
            <TouchableOpacity onPress={advanceIntro} style={styles.introButton}><Text style={styles.introButtonText}>{introStep < 2 ? 'NEXT' : 'START HEIST'}</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {dailyModal.visible && gameState === 'START' && introStep !== null && introStep >= 3 && (
        <View style={styles.introOverlay}>
          <View style={[styles.introCard, { borderColor: '#FFCC00' }]}>
            <Text style={[styles.introTitle, { color: '#FFCC00' }]}>DAILY BONUS</Text>
            <Text style={styles.introText}>Day {dailyModal.streak} streak! Claim +${dailyModal.cash.toLocaleString()}{dailyModal.diamonds > 0 ? ` and 💎 ${dailyModal.diamonds}` : ''}.</Text>
            <TouchableOpacity onPress={handleClaimDaily} style={[styles.introButton, { backgroundColor: '#FFCC00' }]}><Text style={[styles.introButtonText, { color: '#000' }]}>CLAIM</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setDailyModal((m) => ({ ...m, visible: false }))} style={styles.introSkip}><Text style={styles.introSkipText}>Later</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  mainWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  touchArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  header: { position: 'absolute', top: 20, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, zIndex: 10 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontSize: 40, fontWeight: '900', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  floatingScoreText: { fontSize: 24, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 5 },
  multiplierText: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginTop: -5 },
  comboHeader: { position: 'absolute', top: 100, width: '100%', alignItems: 'center', zIndex: 10 },
  comboText: { fontSize: 28, fontWeight: '900', letterSpacing: 3, opacity: 0.8 },
  warningText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  nearMissText: { color: '#FFCC00', fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 2 },
  vaultContainer: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  hitFlashOverlay: { position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, backgroundColor: '#00FF66' },
  pointerContainer: { position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center' },
  pointer: { height: CIRCLE_SIZE / 2, borderTopLeftRadius: 5, borderTopRightRadius: 5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
  
  tacticalOverlay: { 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 15, 
    position: 'absolute', 
    right: 15,
    top: '40%',
    zIndex: 15,
  },
  arsenalContainer: { 
    position: 'absolute', 
    bottom: 30, 
    right: 30, 
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  bagButton: {
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: 'rgba(10,10,15,0.95)', 
    borderWidth: 1.5, 
    borderColor: '#444', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: 10,
  },
  bagText: { color: '#AAA', fontSize: 8, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  tacticalBtnWrapper: { alignItems: 'center', justifyContent: 'center' },
  tacticalBtn: { 
    backgroundColor: 'rgba(15,15,20,0.95)', 
    paddingVertical: 10, 
    paddingHorizontal: 8,
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    minWidth: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  powerCount: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  
  activeBoostsHud: {
    position: 'absolute',
    top: 110,
    right: 30,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 15,
  },
  miniBoostIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.85)',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  uiContainer: { position: 'absolute', bottom: 50, alignItems: 'center', width: '100%', zIndex: 20 },
  actionText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  hookText: { color: '#666', fontSize: 12, marginBottom: 5, textAlign: 'center', paddingHorizontal: 24 },
  mainNextUnlockText: { color: '#FFCC00', fontSize: 11, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' },
  menuRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 },
  menuButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', position: 'relative' },
  menuButtonText: { color: '#FFCC00', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF3B30', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  riskContainer: { alignItems: 'center', backgroundColor: 'rgba(5, 5, 5, 0.95)', padding: 25, borderRadius: 20, width: '90%', borderWidth: 1, borderColor: '#333' },
  riskTitle: { fontSize: 35, color: '#FFCC00', fontWeight: '900', letterSpacing: 2 },
  riskSubtitle: { fontSize: 16, color: '#FFF', marginBottom: 16, letterSpacing: 1 },
  riskTutorialBox: { backgroundColor: 'rgba(255,204,0,0.1)', borderWidth: 1, borderColor: '#FFCC00', borderRadius: 12, padding: 14, marginBottom: 16, width: '100%' },
  riskTutorialText: { color: '#FFF', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  riskTutorialBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#FFCC00', borderRadius: 16 },
  riskTutorialBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  cashOutButton: { backgroundColor: '#00FF66', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center', marginBottom: 15 },
  cashOutText: { color: '#0A0A0A', fontSize: 18, fontWeight: '900' },
  riskItButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center' },
  riskItText: { color: '#FF3B30', fontSize: 18, fontWeight: '900' },
  gameOverContainer: { alignItems: 'center', width: '100%' },
  gameOverText: { fontSize: 30, color: '#FF3B30', fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  successText: { fontSize: 30, color: '#00FF66', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  scrappedText: { fontSize: 16, color: '#FFCC00', marginTop: 5, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  runStatsText: { color: '#AAA', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  finalScoreText: { fontSize: 18, marginTop: 5, marginBottom: 8 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 30, width: 180, alignItems: 'center' },
  retryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  shareButton: { backgroundColor: '#FFCC00', paddingVertical: 12, borderRadius: 30, width: 180, alignItems: 'center', marginTop: 12 },
  shareButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '900' },
  secondaryActionButton: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#444', paddingVertical: 12, borderRadius: 30, width: 180, alignItems: 'center', marginTop: 12 },
  secondaryActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  tutorialContainer: { alignItems: 'center', backgroundColor: 'rgba(0, 255, 255, 0.1)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#00FFFF', width: '85%' },
  tutorialTitle: { fontSize: 18, color: '#00FFFF', fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  tutorialText: { color: '#FFF', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  tutorialTap: { color: '#FFCC00', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  introOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: 24 },
  introCard: { width: '100%', maxWidth: 340, backgroundColor: '#111', borderWidth: 2, borderColor: '#00FF66', borderRadius: 20, padding: 24, alignItems: 'center' },
  introTitle: { fontSize: 20, color: '#00FF66', fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: 1 },
  introText: { color: '#FFF', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  introProgress: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 16 },
  introButton: { backgroundColor: '#00FF66', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, width: '100%', alignItems: 'center' },
  introButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 16 },
  introSkip: { marginTop: 14 },
  introSkipText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
});