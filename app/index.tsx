import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { SKINS, WORLDS, Skin, World } from '../gamedata';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 25;
const ZONE_SIZE = 45; 
const BASE_REWARD = 2; // כלכלת ההארדקור - רק 2 דולר למכה!
const FAIL_REWARD_FRACTION = 0.25; 
const DIAMOND_CHANCE = 0.20; 

export default function GameScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState('START'); 
  const [score, setScore] = useState(0); 
  const [bank, setBank] = useState(0); 
  const [diamonds, setDiamonds] = useState(0); 
  const [combo, setCombo] = useState(0); 
  const [multiplier, setMultiplier] = useState(1); 
  const [consolationPrize, setConsolationPrize] = useState(0); 
  
  const [activeSkin, setActiveSkin] = useState<Skin>(SKINS[0]);
  const [activeWorld, setActiveWorld] = useState<World>(WORLDS[0]); 

  const [targetAngle, setTargetAngle] = useState(0); 
  const [direction, setDirection] = useState(1); 
  const [isDiamondTarget, setIsDiamondTarget] = useState(false); 
  
  const rotation = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      loadSavedData();
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const savedBank = await SecureStore.getItemAsync('vault_bank');
      const savedDiamonds = await SecureStore.getItemAsync('vault_diamonds');
      const savedSkinId = await SecureStore.getItemAsync('vault_equipped_skin');
      const savedWorldId = await SecureStore.getItemAsync('vault_equipped_world');

      if (savedBank) setBank(parseInt(savedBank));
      if (savedDiamonds) setDiamonds(parseInt(savedDiamonds));
      
      if (savedSkinId) {
        const foundSkin = SKINS.find(s => s.id === savedSkinId);
        if (foundSkin) setActiveSkin(foundSkin);
      }
      if (savedWorldId) {
        const foundWorld = WORLDS.find(w => w.id === savedWorldId);
        if (foundWorld) setActiveWorld(foundWorld);
      }
    } catch (e) { console.log('Error loading data', e); }
  };

  const updateAndPersistBank = async (amountToAdd: number) => {
    setBank((currentBank) => {
      const finalBankValue = currentBank + amountToAdd;
      SecureStore.setItemAsync('vault_bank', finalBankValue.toString());
      SecureStore.setItemAsync('stat_maxBank', finalBankValue.toString()); 
      return finalBankValue;
    });
  };

  const updateAndPersistDiamonds = async (amountToAdd: number) => {
    setDiamonds((currentDiamonds) => {
      const finalDiamondsValue = currentDiamonds + amountToAdd;
      SecureStore.setItemAsync('vault_diamonds', finalDiamondsValue.toString());
      return finalDiamondsValue;
    });
  };

  const updateStatsRecord = async (key: string, currentValue: number) => {
    const saved = await SecureStore.getItemAsync(key);
    if (!saved || currentValue > parseInt(saved)) {
      await SecureStore.setItemAsync(key, currentValue.toString());
    }
  };

  const randomizeTarget = () => {
    const newAngle = Math.floor(Math.random() * (360 - ZONE_SIZE));
    setTargetAngle(newAngle);
    setIsDiamondTarget(Math.random() < DIAMOND_CHANCE);
  };

  const startGame = () => {
    cancelAnimation(rotation); 
    rotation.value = 0; 
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setDirection(1); 
    setConsolationPrize(0);
    setGameState('PLAYING');
    randomizeTarget();
    setTimeout(() => { startRotation(2000, 1); }, 0);
  };

  const startRotation = (duration: number, dir: number) => {
    const currentVal = rotation.value;
    rotation.value = withRepeat(
      withTiming(currentVal + (360 * dir), { duration, easing: Easing.linear }), 
      -1, false 
    );
  };

  const handleCashOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateAndPersistBank(score); 
    setGameState('CASHED_OUT');
  };

  const handleRiskIt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMult = multiplier * 2;
    setMultiplier(newMult);
    updateStatsRecord('stat_maxMultiplier', newMult); 
    setGameState('PLAYING');
    randomizeTarget();
    setTimeout(() => {
      const newDuration = Math.max(800, 2000 - (combo * 60));
      startRotation(newDuration, direction);
    }, 0);
  };

  const handleTap = () => {
    if (gameState === 'START' || gameState === 'CASHED_OUT') {
      startGame(); return;
    }
    if (gameState !== 'PLAYING') return;

    const currentRawAngle = rotation.value;
    const normalizedCurrentAngle = ((currentRawAngle % 360) + 360) % 360;
    const targetCenter = targetAngle + (ZONE_SIZE / 2);
    let angleDiff = Math.abs(normalizedCurrentAngle - targetCenter);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    const isHit = angleDiff <= (ZONE_SIZE / 2);

    if (isHit) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      updateStatsRecord('stat_maxCombo', newCombo); 
      
      if (isDiamondTarget) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateAndPersistDiamonds(1); 
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); 
        setScore(score + (BASE_REWARD * multiplier)); 
      }
      
      let nextDirection = direction;
      if (newCombo % 5 === 0) {
        nextDirection = direction === 1 ? -1 : 1;
        setDirection(nextDirection);
      }

      if (newCombo % 10 === 0) {
        cancelAnimation(rotation);
        setGameState('RISK');
        return;
      }

      randomizeTarget();
      const newDuration = Math.max(800, 2000 - (newCombo * 60));
      startRotation(newDuration, nextDirection);
      
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      cancelAnimation(rotation); 
      const calculatedPrize = Math.floor(score * FAIL_REWARD_FRACTION); 
      setConsolationPrize(calculatedPrize);
      updateAndPersistBank(calculatedPrize); 
      setGameState('GAMEOVER'); 
    }
  };

  const pointerAnimatedStyle = useAnimatedStyle(() => {
    return { transform: [{ rotate: `${rotation.value}deg` }] };
  });

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(ZONE_SIZE / 360) * circumference} ${circumference}`;
  const strokeDashoffset = -(targetAngle / 360) * circumference;

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: activeWorld.bg }]} activeOpacity={1} onPress={handleTap}>
      
      <View style={styles.header}>
        <View style={styles.bankContainer}>
          <Text style={[styles.bankLabel, { color: activeWorld.textSecondary }]}>BANK</Text>
          <Text style={styles.bankText}>${bank}</Text>
          <Text style={styles.diamondText}>💎 {diamonds}</Text>
        </View>
        
        {(gameState === 'PLAYING' || gameState === 'RISK' || gameState === 'GAMEOVER') && (
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: activeWorld.textPrimary, textShadowColor: activeSkin.color }]}>
              ${score}
            </Text>
            {multiplier > 1 && (
              <Text style={styles.multiplierText}>x{multiplier} MULTIPLIER</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.vaultContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
          <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={radius} stroke={activeWorld.vaultRing} strokeWidth={STROKE_WIDTH} fill="none" />
          <Circle
            cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={radius}
            stroke={isDiamondTarget ? "#00FFFF" : "#00FF66"} 
            strokeWidth={STROKE_WIDTH} fill="none"
            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
            origin={`${CIRCLE_SIZE/2}, ${CIRCLE_SIZE/2}`} rotation="-90" 
          />
        </Svg>

        <Animated.View style={[styles.pointerContainer, pointerAnimatedStyle]}>
          {activeSkin.shape === 'standard' && (
            <View style={[
              styles.pointer, 
              { 
                backgroundColor: activeSkin.color, 
                shadowColor: activeSkin.color,
                shadowRadius: activeSkin.glow,
                width: activeSkin.width
              }
            ]} />
          )}

          {activeSkin.shape === 'spiked' && (
            <Svg width={activeSkin.width * 4} height={CIRCLE_SIZE / 2} style={{shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1}}>
              <Polygon points={`${activeSkin.width * 2},0 0,${CIRCLE_SIZE / 2} ${activeSkin.width * 4},${CIRCLE_SIZE / 2}`} fill={activeSkin.color} />
            </Svg>
          )}

          {activeSkin.shape === 'lightning' && (
            <Svg width={activeSkin.width * 6} height={CIRCLE_SIZE / 2} style={{shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, shadowOpacity: 1}}>
              <Path 
                d={`M${activeSkin.width*3},0 L0,${CIRCLE_SIZE/3} L${activeSkin.width*4},${CIRCLE_SIZE/2.5} L${activeSkin.width},${CIRCLE_SIZE/2} L${activeSkin.width*6},${CIRCLE_SIZE/1.5} L${activeSkin.width*3},${CIRCLE_SIZE/2}`} 
                stroke={activeSkin.color} 
                strokeWidth={activeSkin.width / 2} 
                fill="none" 
              />
            </Svg>
          )}
        </Animated.View>
      </View>

      <View style={styles.uiContainer}>
        {gameState === 'START' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.actionText, { color: activeWorld.textPrimary }]}>TAP TO HACK</Text>
            
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 }}>
              <TouchableOpacity onPress={() => router.push('/shop')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>SHOP</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/missions')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>MISSIONS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>SETTINGS</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {gameState === 'RISK' && (
          <View style={styles.riskContainer}>
            <Text style={styles.riskTitle}>RISK MODE</Text>
            <Text style={styles.riskSubtitle}>System Paused</Text>
            <TouchableOpacity onPress={handleCashOut} style={styles.cashOutButton}>
              <Text style={styles.cashOutText}>CASH OUT (${score})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRiskIt} style={styles.riskItButton}>
              <Text style={styles.riskItText}>RISK IT (x{multiplier * 2})</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'CASHED_OUT' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.successText}>HACK SUCCESSFUL</Text>
            <Text style={[styles.finalScoreText, { color: activeWorld.textPrimary }]}>Transferred ${score} to Bank</Text>
            
            <TouchableOpacity onPress={startGame} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>NEXT HEIST</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/shop')} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionText}>GO TO SHOP</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setGameState('START')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary, width: 180, marginTop: 12 }]}>
              <Text style={styles.menuButtonText}>MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {gameState === 'GAMEOVER' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>SYSTEM LOCKED</Text>
            <Text style={styles.scrappedText}>Scrapped 25% of money: +${consolationPrize}</Text>
            
            <TouchableOpacity onPress={startGame} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>RETRY</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/shop')} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionText}>GO TO SHOP</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setGameState('START')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary, width: 180, marginTop: 12 }]}>
              <Text style={styles.menuButtonText}>MAIN MENU</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, 
  header: { position: 'absolute', top: 60, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, zIndex: 10 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontSize: 40, fontWeight: '900', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 }, 
  multiplierText: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginTop: -5 },
  vaultContainer: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  pointerContainer: { position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center' }, 
  pointer: { height: CIRCLE_SIZE / 2, borderTopLeftRadius: 5, borderTopRightRadius: 5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
  uiContainer: { position: 'absolute', bottom: 50, alignItems: 'center', width: '100%' },
  actionText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
  menuButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center' },
  menuButtonText: { color: '#FFCC00', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  riskContainer: { alignItems: 'center', backgroundColor: 'rgba(5, 5, 5, 0.95)', padding: 25, borderRadius: 20, width: '90%', borderWidth: 1, borderColor: '#333' },
  riskTitle: { fontSize: 35, color: '#FFCC00', fontWeight: '900', letterSpacing: 2 },
  riskSubtitle: { fontSize: 16, color: '#FFF', marginBottom: 30, letterSpacing: 1 },
  cashOutButton: { backgroundColor: '#00FF66', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center', marginBottom: 15 },
  cashOutText: { color: '#0A0A0A', fontSize: 18, fontWeight: '900' },
  riskItButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center' },
  riskItText: { color: '#FF3B30', fontSize: 18, fontWeight: '900' },
  gameOverContainer: { alignItems: 'center', width: '100%' },
  gameOverText: { fontSize: 30, color: '#FF3B30', fontWeight: '900', letterSpacing: 3 },
  successText: { fontSize: 30, color: '#00FF66', fontWeight: '900', letterSpacing: 2 },
  scrappedText: { fontSize: 16, color: '#FFCC00', marginTop: 5, marginBottom: 20, fontWeight: 'bold' },
  finalScoreText: { fontSize: 18, marginTop: 5, marginBottom: 20 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, width: 180, alignItems: 'center' },
  retryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  secondaryActionButton: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#444', paddingVertical: 12, borderRadius: 30, width: 180, alignItems: 'center', marginTop: 12 },
  secondaryActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});