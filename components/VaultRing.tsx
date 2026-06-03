import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Polygon, Path, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { GradientPointer } from './GradientPointer';

export default function VaultRing({
  CIRCLE_SIZE,
  STROKE_WIDTH,
  radius,
  activeWorld,
  targetOpacityStyle,
  isDiamondTarget,
  strokeDasharray,
  strokeDashoffset,
  gameState,
  hitFlashStyle,
  pointerAnimatedStyle,
  activeSkin,
}: any) {
  return (
    <View style={[styles.vaultContainer, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
      
      {/* טבעת הכספת הבסיסית */}
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={radius} stroke={activeWorld.vaultRing} strokeWidth={STROKE_WIDTH} fill="none" />
      </Svg>

      {/* אזור המטרה (הירוק/תכלת) */}
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

      {/* הבזק פגיעה מוצלחת */}
      <Animated.View pointerEvents="none" style={[styles.hitFlashOverlay, hitFlashStyle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]} />

      {/* המחוג המסתובב והסקינים */}
      <Animated.View style={[styles.pointerContainer, pointerAnimatedStyle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}>
        {activeSkin.shape === 'gradient' && (
          <GradientPointer size={CIRCLE_SIZE} primaryColor={activeSkin.primaryColor} secondaryColor={activeSkin.secondaryColor} rotation={0} />
        )}
        {activeSkin.shape === 'standard' && (
          <View style={[styles.pointer, { backgroundColor: activeSkin.color, shadowColor: activeSkin.color, shadowRadius: activeSkin.glow, width: activeSkin.width, height: CIRCLE_SIZE / 2 }]} />
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
  );
}

const styles = StyleSheet.create({
  vaultContainer: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  hitFlashOverlay: { position: 'absolute', backgroundColor: '#00FF66' },
  pointerContainer: { position: 'absolute', alignItems: 'center' },
  pointer: { borderTopLeftRadius: 5, borderTopRightRadius: 5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1 },
});