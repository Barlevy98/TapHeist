import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';
import { formatNumber } from '../gameHelpers'; 

// יצירת קומפוננטת יהלום פנימית כדי שנוכל להשתמש בה לצד הטקסטים
const DiamondSvg = ({ color, size = 18 }: { color: string, size?: number }) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M6 5 L18 5 L22 10 L12 22 L2 10 Z" fill={color} />
    <Path d="M6 5 L12 10 L18 5 M2 10 L22 10 M12 10 L12 22" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    <Path d="M6 5 L12 10 L2 10 Z" fill="rgba(255,255,255,0.4)" />
  </Svg>
);

export default function GameHeader({
  activeWorld,
  activeSkin,
  bank,
  diamonds,
  gameState,
  score,
  lastRewardEarned,
  isDiamondTarget,
  multiplier,
  floatingScoreStyle,
  isShieldActive,
  shieldAnimStyle,
  isFrozen,
  freezeAnimStyle,
  focusTapsLeft,
  focusAnimStyle,
  combo,
  isDirectionWarning,
  nearMissText,
  runDiamondsEarned,
  currentRewardTier
}: any) {

  const displayColor = currentRewardTier?.color || '#00FFFF';

  return (
    <>
      <View style={styles.header}>
        <View style={styles.bankContainer}>
          <Text style={[styles.bankLabel, { color: activeWorld.textSecondary }]}>BANK</Text>
          <Text style={styles.bankText}>${formatNumber(bank)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
             <DiamondSvg color="#00FFFF" size={14} />
             <Text style={styles.diamondText}> {formatNumber(diamonds)}</Text>
          </View>
        </View>

        {(gameState === 'PLAYING' || gameState === 'RISK' || gameState === 'GAMEOVER' || gameState === 'REVIVE_OFFER') && (
          <View style={styles.scoreContainer}>
            <View>
              {activeWorld.id === 'diamond_world' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <DiamondSvg color={activeWorld.textPrimary} size={28} />
                  <Text style={[styles.scoreText, { color: activeWorld.textPrimary, textShadowColor: activeSkin.color }]}> {formatNumber(runDiamondsEarned)}</Text>
                </View>
              ) : (
                <Text style={[styles.scoreText, { color: activeWorld.textPrimary, textShadowColor: activeSkin.color }]}>${formatNumber(score)}</Text>
              )}
              
              {/* הטקסט הקופץ מציג עכשיו את הוקטור של היהלום בצבע המדויק! */}
              <Animated.View style={[styles.floatingScoreContainer, floatingScoreStyle]}>
                <Text style={[styles.floatingScoreText, { color: isDiamondTarget ? displayColor : '#00FF66' }]}>
                  +{formatNumber(lastRewardEarned)}{!isDiamondTarget && '$'}
                </Text>
                {isDiamondTarget && (
                  <View style={{ marginLeft: 3 }}>
                    <DiamondSvg color={displayColor} size={18} />
                  </View>
                )}
              </Animated.View>

            </View>
            {multiplier > 1 && <Text style={styles.multiplierText}>x{formatNumber(multiplier)} MULTIPLIER</Text>}
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
    </>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 20, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, zIndex: 10 },
  bankContainer: { alignItems: 'flex-start' },
  bankLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  bankText: { color: '#00FF66', fontSize: 24, fontWeight: '900' },
  diamondText: { color: '#00FFFF', fontSize: 18, fontWeight: 'bold' },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontSize: 40, fontWeight: '900', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  floatingScoreContainer: { position: 'absolute', right: 0, top: -30, flexDirection: 'row', alignItems: 'center' },
  floatingScoreText: { fontSize: 24, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 5 },
  multiplierText: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginTop: -5 },
  activeBoostsHud: { position: 'absolute', top: 110, right: 30, alignItems: 'flex-end', gap: 10, zIndex: 15 },
  miniBoostIcon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,15,0.85)', padding: 8, borderRadius: 12, borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  comboHeader: { position: 'absolute', top: 100, width: '100%', alignItems: 'center', zIndex: 10 },
  comboText: { fontSize: 28, fontWeight: '900', letterSpacing: 3, opacity: 0.8 },
  warningText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  nearMissText: { color: '#FFCC00', fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 2 },
});