import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CORE_TUTORIAL_STEPS, formatNumber } from '../gameHelpers';

export default function GameUI({
  gameState,
  setGameState,
  activeWorld,
  mainNextUnlock,
  missionBadge,
  score,
  multiplier,
  consolationPrize,
  runMaxCombo,
  runDiamondsEarned,
  showRiskTutorial,
  dismissRiskTutorial,
  handleCashOut,
  handleRiskIt,
  processGameOver,
  startGame,
  handleShareResult,
  onRevive,
  successPulseStyle,
  introStep,
  advanceIntro,
  dailyModal,
  setDailyModal,
  handleClaimDaily,
  hackerRank,
  prestigeMult,
  prestigeOffer,
  handlePrestige,
  isFirewallActive,
  bank,
  rankUpModal,
  setRankUpModal
}: any) {
  const router = useRouter();

  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);

  const renderRunStats = () => (
    <Text style={styles.runStatsText} numberOfLines={1}>
      Run: {runMaxCombo} combo · x{formatNumber(multiplier)} peak · 💎 {runDiamondsEarned} this heist
    </Text>
  );

  return (
    <>
      <View style={styles.uiContainer} pointerEvents="box-none">
        {gameState === 'START' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.actionText, { color: activeWorld.textPrimary }]}>TAP TO HACK</Text>
            
            <Text style={styles.rankText}>
              RANK: {hackerRank} {prestigeMult > 1 ? `| GHOST x${prestigeMult}` : ''}
            </Text>
            
            {prestigeOffer && (
              <TouchableOpacity onPress={() => setShowPrestigeConfirm(true)} style={styles.prestigeButton}>
                <Text style={styles.prestigeTitle}>💀 GHOST PROTOCOL 💀</Text>
                <Text style={styles.prestigeDesc}>Burn ${formatNumber(prestigeOffer.cost)} for permanent x{prestigeOffer.mult} multiplier!</Text>
              </TouchableOpacity>
            )}

            {isFirewallActive && !prestigeOffer && (
              <View style={styles.firewallAlert}>
                <Text style={styles.firewallAlertText}>🔥 FIREWALL BREACH IMMINENT 🔥</Text>
                <Text style={styles.firewallAlertSub}>Extreme difficulty. Diamonds guaranteed.</Text>
              </View>
            )}

            {mainNextUnlock && !prestigeOffer && !isFirewallActive && (
              <Text style={styles.mainNextUnlockText}>
                NEXT OBJECTIVE: {mainNextUnlock.name} ({mainNextUnlock.currency === 'diamond' ? '💎' : '$'}{formatNumber(mainNextUnlock.missing)} LEFT)
              </Text>
            )}

            <View style={styles.menuRow}>
              <TouchableOpacity onPress={() => router.push('/shop')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>SHOP</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/missions')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>MISSIONS</Text>
                {missionBadge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{missionBadge}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/stats' as any)} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>STATS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary }]}>
                <Text style={styles.menuButtonText}>SETTINGS</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {gameState === 'FIREWALL_TUTORIAL' && (
          <View style={styles.tutorialContainer}>
            <Text style={[styles.tutorialTitle, { color: '#FFCC00' }]}>🔥 FIREWALL ENCOUNTERED 🔥</Text>
            <Text style={styles.tutorialText}>The system has detected your intrusion! The zone is shrinking and rotating faster. Every hit guarantees 3 Diamonds.</Text>
            <Text style={[styles.tutorialTap, { color: '#FF3B30' }]}>TAP TO START BREACH</Text>
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
            
            <TouchableOpacity onPress={handleCashOut} style={styles.cashOutButton}>
              <Text style={styles.cashOutText} numberOfLines={1}>CASH OUT (${formatNumber(score)})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRiskIt} style={styles.riskItButton}>
              <Text style={styles.riskItText} numberOfLines={1}>RISK IT (x{formatNumber(multiplier * 2)})</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'REVIVE_OFFER' && (
          <View style={styles.gameOverContainer}>
            <Text style={[styles.gameOverText, { color: '#FFCC00' }]}>SYSTEM COMPROMISED</Text>
            <Text style={styles.scrappedText}>Inject backdoor to resume hack?</Text>
            <TouchableOpacity onPress={onRevive} style={[styles.retryButton, { backgroundColor: '#FFCC00', marginBottom: 12, paddingHorizontal: 30 }]}><Text style={[styles.retryButtonText, { color: '#000' }]}>WATCH AD TO REVIVE</Text></TouchableOpacity>
            <TouchableOpacity onPress={processGameOver} style={styles.secondaryActionButton}><Text style={styles.secondaryActionText}>GIVE UP (Take 25%)</Text></TouchableOpacity>
          </View>
        )}

        {gameState === 'CASHED_OUT' && (
          <Animated.View style={[styles.gameOverContainer, successPulseStyle]}>
            <Text style={styles.successText}>HACK SUCCESSFUL</Text>
            {activeWorld.id === 'diamond_world' ? (
              <Text style={[styles.finalScoreText, { color: activeWorld.textPrimary }]} numberOfLines={1}>Secured 💎 {formatNumber(runDiamondsEarned)} to Vault</Text>
            ) : (
              <Text style={[styles.finalScoreText, { color: activeWorld.textPrimary }]} numberOfLines={1}>Transferred ${formatNumber(score)} to Bank</Text>
            )}
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
            {activeWorld.id === 'diamond_world' ? (
              <Text style={[styles.scrappedText, { color: '#00FFFF' }]} numberOfLines={1}>Kept 100% of mined gems: 💎 {formatNumber(runDiamondsEarned)}</Text>
            ) : (
              <Text style={styles.scrappedText} numberOfLines={1}>Scrapped 25% of earnings: +${formatNumber(consolationPrize)}</Text>
            )}
            {renderRunStats()}
            <TouchableOpacity onPress={startGame} style={styles.retryButton}><Text style={styles.retryButtonText}>RETRY</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/shop')} style={styles.secondaryActionButton}><Text style={styles.secondaryActionText}>GO TO SHOP</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setGameState('START')} style={[styles.menuButton, { borderColor: activeWorld.textSecondary, width: 180, marginTop: 12 }]}><Text style={styles.menuButtonText}>MAIN MENU</Text></TouchableOpacity>
          </View>
        )}
      </View>

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
            <Text style={styles.introText}>Day {dailyModal.streak} streak! Claim +${formatNumber(dailyModal.cash)}{dailyModal.diamonds > 0 ? ` and 💎 ${dailyModal.diamonds}` : ''}.</Text>
            <TouchableOpacity onPress={handleClaimDaily} style={[styles.introButton, { backgroundColor: '#FFCC00' }]}><Text style={[styles.introButtonText, { color: '#000' }]}>CLAIM</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setDailyModal((m: any) => ({ ...m, visible: false }))} style={styles.introSkip}><Text style={styles.introSkipText}>Later</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {showPrestigeConfirm && prestigeOffer && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#FF3B30', padding: 25 }]}>
            <Text style={styles.modalTitle}>CRITICAL WARNING</Text>
            <Text style={styles.modalText}>This will permanently BURN your entire bank balance (${formatNumber(bank)}).</Text>
            <Text style={styles.modalSubText}>Proceed to unlock x{prestigeOffer.mult} multiplier?</Text>
            <View style={{ width: '100%', gap: 15, marginTop: 20 }}>
              <TouchableOpacity onPress={() => { setShowPrestigeConfirm(false); handlePrestige(); }} style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>BURN IT ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPrestigeConfirm(false)} style={styles.safeButton}>
                <Text style={styles.safeButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {rankUpModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: '#00FF66', padding: 25 }]}>
            <Text style={[styles.modalTitle, { color: '#00FF66' }]}>RANK UP!</Text>
            <Text style={styles.modalText}>Your new hacker title is:</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#00FFFF', marginVertical: 10, textAlign: 'center' }}>{rankUpModal.rank}</Text>
            
            {(rankUpModal.cashReward > 0 || rankUpModal.diamondReward > 0) && (
              <View style={{ backgroundColor: 'rgba(0,255,102,0.1)', padding: 12, borderRadius: 10, marginBottom: 20, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#00FF66' }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>PROMOTION BONUS</Text>
                {rankUpModal.cashReward > 0 && (
                  <Text style={{ color: '#00FF66', fontSize: 20, fontWeight: '900' }}>
                    +${formatNumber(rankUpModal.cashReward)}
                  </Text>
                )}
                {rankUpModal.diamondReward > 0 && (
                  <Text style={{ color: '#00FFFF', fontSize: 20, fontWeight: '900' }}>
                    +💎 {formatNumber(rankUpModal.diamondReward)}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity onPress={() => setRankUpModal(null)} style={[styles.dangerButton, { backgroundColor: '#00FF66' }]}>
              <Text style={[styles.dangerButtonText, { color: '#000' }]}>CLAIM & CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  uiContainer: { position: 'absolute', bottom: 50, alignItems: 'center', width: '100%', zIndex: 20 },
  actionText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  
  rankText: { color: '#00FF66', fontSize: 13, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  prestigeButton: { backgroundColor: 'rgba(255,0,0,0.1)', borderWidth: 1, borderColor: '#FF3B30', padding: 12, borderRadius: 15, marginBottom: 15, alignItems: 'center', width: '85%' },
  prestigeTitle: { color: '#FF3B30', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  prestigeDesc: { color: '#FFF', fontSize: 11, textAlign: 'center', marginTop: 4 },
  firewallAlert: { backgroundColor: 'rgba(255,102,0,0.1)', borderWidth: 1, borderColor: '#FF6600', padding: 10, borderRadius: 12, marginBottom: 15, width: '85%', alignItems: 'center' },
  firewallAlertText: { color: '#FF6600', fontWeight: '900', fontSize: 14 },
  firewallAlertSub: { color: '#FFF', fontSize: 10, marginTop: 2 },
  
  mainNextUnlockText: { color: '#FFCC00', fontSize: 11, fontWeight: 'bold', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' },
  menuRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 },
  menuButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', position: 'relative' },
  menuButtonText: { color: '#FFCC00', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF3B30', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  riskContainer: { alignItems: 'center', backgroundColor: 'rgba(5, 5, 5, 0.95)', padding: 25, borderRadius: 20, width: '90%', borderWidth: 1, borderColor: '#333' },
  riskTitle: { fontSize: 30, color: '#FFCC00', fontWeight: '900', letterSpacing: 2 },
  riskSubtitle: { fontSize: 14, color: '#FFF', marginBottom: 16, letterSpacing: 1 },
  riskTutorialBox: { backgroundColor: 'rgba(255,204,0,0.1)', borderWidth: 1, borderColor: '#FFCC00', borderRadius: 12, padding: 14, marginBottom: 16, width: '100%' },
  riskTutorialText: { color: '#FFF', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  riskTutorialBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#FFCC00', borderRadius: 16 },
  riskTutorialBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  
  // פונטים מוקטנים קבועים - בלי קפיצות
  cashOutButton: { backgroundColor: '#00FF66', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center', marginBottom: 15 },
  cashOutText: { color: '#0A0A0A', fontSize: 14, fontWeight: '900' },
  riskItButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF3B30', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center' },
  riskItText: { color: '#FF3B30', fontSize: 14, fontWeight: '900' },
  
  gameOverContainer: { alignItems: 'center', width: '100%' },
  gameOverText: { fontSize: 26, color: '#FF3B30', fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  successText: { fontSize: 26, color: '#00FF66', fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  scrappedText: { fontSize: 13, color: '#FFCC00', marginTop: 5, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
  runStatsText: { color: '#AAA', fontSize: 11, marginBottom: 16, textAlign: 'center' },
  finalScoreText: { fontSize: 14, marginTop: 5, marginBottom: 8 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 30, width: 180, alignItems: 'center' },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  shareButton: { backgroundColor: '#FFCC00', paddingVertical: 12, borderRadius: 30, width: 180, alignItems: 'center', marginTop: 12 },
  shareButtonText: { color: '#0A0A0A', fontSize: 15, fontWeight: '900' },
  secondaryActionButton: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#444', paddingVertical: 12, borderRadius: 30, width: 180, alignItems: 'center', marginTop: 12 },
  secondaryActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  tutorialContainer: { alignItems: 'center', backgroundColor: 'rgba(0, 255, 255, 0.1)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#00FFFF', width: '85%' },
  tutorialTitle: { fontSize: 16, color: '#00FFFF', fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  tutorialText: { color: '#FFF', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  tutorialTap: { color: '#FFCC00', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  introOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: 24 },
  introCard: { width: '100%', maxWidth: 340, backgroundColor: '#111', borderWidth: 2, borderColor: '#00FF66', borderRadius: 20, padding: 24, alignItems: 'center' },
  introTitle: { fontSize: 18, color: '#00FF66', fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: 1 },
  introText: { color: '#FFF', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  introProgress: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 16 },
  introButton: { backgroundColor: '#00FF66', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, width: '100%', alignItems: 'center' },
  introButtonText: { color: '#0A0A0A', fontWeight: '900', fontSize: 15 },
  introSkip: { marginTop: 14 },
  introSkipText: { color: '#666', fontSize: 13, fontWeight: 'bold' },
  
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '80%', backgroundColor: '#111', borderWidth: 2, borderColor: '#FF3B30', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 22, color: '#FF3B30', fontWeight: '900', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  modalText: { color: '#FFF', fontSize: 14, textAlign: 'center', marginBottom: 5 },
  modalSubText: { color: '#666', fontSize: 13, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  dangerButton: { backgroundColor: '#FF3B30', paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  dangerButtonText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  safeButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666', paddingVertical: 15, width: '100%', borderRadius: 30, alignItems: 'center' },
  safeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});