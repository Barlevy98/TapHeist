import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

export default function TacticalArsenal({
  gameState,
  inventory,
  isInventoryOpen,
  toggleInventory,
  activateShield,
  activateFreeze,
  activateFocus,
  isShieldActive,
  isFrozen,
  focusTapsLeft,
  bagItem1Style,
  bagItem2Style,
  bagItem3Style
}: any) {
  if (gameState !== 'PLAYING') return null;

  return (
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
  );
}

const styles = StyleSheet.create({
  arsenalContainer: { position: 'absolute', bottom: 30, right: 30, alignItems: 'center', justifyContent: 'flex-end', zIndex: 100 },
  bagButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(10,10,15,0.95)', borderWidth: 1.5, borderColor: '#444', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, zIndex: 10 },
  bagText: { color: '#AAA', fontSize: 8, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  tacticalBtnWrapper: { alignItems: 'center', justifyContent: 'center' },
  tacticalBtn: { backgroundColor: 'rgba(15,15,20,0.95)', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', minWidth: 55, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 6 },
  powerCount: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
});