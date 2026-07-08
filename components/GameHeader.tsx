import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';
import { formatNumber } from '../gameHelpers'; 

// פונקציית כיווץ ידנית - מונעת לחלוטין את הריבועים של iOS
const getDynFontSize = (textLength: number, baseSize: number) => {
  if (textLength >= 15) return Math.floor(baseSize * 0.6);
  if (textLength >= 11) return Math.floor(baseSize * 0.8);
  return baseSize;
};

const DiamondSvg = ({ color, size = 18 }: { color: string, size?: number }) => (
  <Svg viewBox="0 0 24 24" width={size} height={size}>
    <Path d="M 5 5 L 19 5 L 24 11 L 12 23 L 0 11 Z" fill={color} />
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

  const bankStr = `$${formatNumber(bank)}`;
  const diamondsStr = ` ${formatNumber(diamonds)}`;
  const scoreStr = `$${formatNumber(score)}`;
  const diamondScoreStr = ` ${formatNumber(runDiamondsEarned)}`;
  const multStr = `x${formatNumber(multiplier)} MULTIPLIER`;
  const comboStr = `${combo} COMBO`;

  return (
    <>
      <View style={styles.header} pointerEvents="box-none">
        <View style={styles.bankContainer}>
          <Text style={[styles.bankLabel, { color: activeWorld.textSecondary }]}>BANK</Text>
          <Text style={[styles.bankText, { fontSize: getDynFontSize(bankStr.length, 24) }]} numberOfLines={1}>{bankStr}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
             <DiamondSvg color="#00FFFF" size={14} />
             <Text style={[styles.diamondText, { fontSize: getDynFontSize(diamondsStr.length, 18) }]} numberOfLines={1}>{diamondsStr}</Text>
          </View>
        </View>

        {(gameState === 'PLAYING' || gameState === 'RISK' || gameState === 'GAMEOVER' || gameState === 'REVIVE_OFFER') && (
          <View style={styles.scoreContainer}>
            <View>
              {activeWorld.id === 'diamond_world' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <DiamondSvg color={activeWorld.textPrimary} size={28} />
                  <Text style={[styles.scoreText, { color: activeWorld.textPrimary, textShadowColor: activeSkin.color, fontSize: getDynFontSize(diamondScoreStr.length, 32) }]} numberOfLines={1}>{diamondScoreStr}</Text>
                </View>
              ) : (
                <Text style={[styles.scoreText, { color: activeSkin.color, fontSize: getDynFontSize(scoreStr.length, 32) }]} numberOfLines={1}>{scoreStr}</Text>
              )}
              
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
            {multiplier > 1 && <Text style={[styles.multiplierText, { fontSize: getDynFontSize(multStr.length, 14) }]} numberOfLines={1}>{multStr}</Text>}
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

      {(gameState === 'PLAYING' || gameState === 'RISK') && combo > 0 && (
        <View style={styles.comboHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.comboText, { color: activeSkin.color, fontSize: getDynFontSize(comboStr.length, 28) }]} numberOfLines={1}>{comboStr}</Text>
          </View>
          {gameState === 'PLAYING' && isDirectionWarning && <Text style={styles.warningText}>⚠️ FLIP IMMINENT ⚠️</Text>}
          {gameState === 'PLAYING' && nearMissText && <Text style={styles.nearMissText}>{nearMissText}</Text>}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 20, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, zIndex: 10 },
  bankContainer: { alignItems: 'flex-start', flex: 1, paddingRight: 10 },
  bankLabel: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  // נעילת הגובה שמונעת קפיצות 
  bankText: { color: '#00FF66', fontWeight: '900', height: 32, lineHeight: 32 },
  diamondText: { color: '#00FFFF', fontWeight: 'bold', height: 26, lineHeight: 26 },
  
  scoreContainer: { alignItems: 'flex-end', flex: 1, paddingLeft: 10 },
  
  // נעילת הגובה למספרים הגדולים
  scoreText: { fontWeight: '900', textAlign: 'right', height: 42, lineHeight: 42 },
  floatingScoreContainer: { position: 'absolute', right: 0, top: -30, flexDirection: 'row', alignItems: 'center', height: 32 },
  floatingScoreText: { fontSize: 24, fontWeight: '900' },
  multiplierText: { color: '#FFCC00', fontWeight: 'bold', letterSpacing: 1, marginTop: -5, height: 20, lineHeight: 20 },
  
  activeBoostsHud: { position: 'absolute', top: 110, right: 30, alignItems: 'flex-end', gap: 10, zIndex: 15 },
  miniBoostIcon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,15,0.85)', padding: 8, borderRadius: 12, borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  comboHeader: { position: 'absolute', top: 100, width: '100%', alignItems: 'center', zIndex: 10 },
  comboText: { fontWeight: '900', letterSpacing: 3, opacity: 0.8, height: 40, lineHeight: 40 },
  warningText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  nearMissText: { color: '#FFCC00', fontSize: 18, fontWeight: '900', marginTop: 8, letterSpacing: 2 },
});