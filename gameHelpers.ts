import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { MISSIONS, Mission, SKINS, WORLDS, Skin, World, WEEKLY_MISSIONS } from './gamedata';

export const STORAGE_KEYS = {
  bank: 'vault_bank',
  diamonds: 'vault_diamonds',
  unlockedSkins: 'vault_unlocked_skins',
  equippedSkin: 'vault_equipped_skin',
  unlockedWorlds: 'vault_unlocked_worlds',
  equippedWorld: 'vault_equipped_world',
  claimedMissions: 'vault_claimed_missions',
  maxCombo: 'stat_maxCombo',
  maxMultiplier: 'stat_maxMultiplier',
  maxBank: 'stat_maxBank', 
  bestRunCash: 'stat_best_run_cash', 
  bestRunDiamonds: 'stat_best_run_diamonds', 
  totalHeists: 'stat_total_heists',
  diamondTutorial: 'has_seen_tutorial',
  coreTutorial: 'has_seen_core_tutorial',
  riskTutorial: 'has_seen_risk_tutorial',
  firewallTutorial: 'has_seen_firewall_tutorial',
  lastDailyClaim: 'last_daily_claim_date',
  dailyStreak: 'daily_streak_count',
  hapticsEnabled: 'settings_haptics_enabled',
  inv_smart_shield: 'inv_smart_shield',
  inv_time_freeze: 'inv_time_freeze',
  inv_precision_focus: 'inv_precision_focus',
  
  weeklyExpiry: 'weekly_missions_expiry_time',
  weeklyActiveIds: 'weekly_active_missions_ids',
  weeklyClaimed: 'weekly_missions_claimed_ids',
  weeklyHeistsCount: 'weekly_stat_heists_count',
  weeklyMaxCombo: 'weekly_stat_max_combo',
  weeklyMaxMultiplier: 'weekly_stat_max_multiplier',

  prestigeMultiplier: 'stat_prestige_mult',
  gamesSinceFirewall: 'stat_games_firewall',
} as const;

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export async function getPowerUpInventory(): Promise<Record<string, number>> {
  const shield = await SecureStore.getItemAsync(STORAGE_KEYS.inv_smart_shield);
  const freeze = await SecureStore.getItemAsync(STORAGE_KEYS.inv_time_freeze);
  const focus = await SecureStore.getItemAsync(STORAGE_KEYS.inv_precision_focus);
  return {
    smart_shield: shield ? parseInt(shield, 10) : 0,
    time_freeze: freeze ? parseInt(freeze, 10) : 0,
    precision_focus: focus ? parseInt(focus, 10) : 0,
  };
}

export async function addPowerUp(id: string, amount: number = 1): Promise<number> {
  const key = `inv_${id}` as keyof typeof STORAGE_KEYS;
  const currentStr = await SecureStore.getItemAsync(STORAGE_KEYS[key]);
  const current = currentStr ? parseInt(currentStr, 10) : 0;
  const newVal = current + amount;
  await SecureStore.setItemAsync(STORAGE_KEYS[key], newVal.toString());
  return newVal;
}

export function getNextSundayMidnight(): number {
  const d = new Date();
  const day = d.getDay(); 
  const daysToSunday = day === 0 ? 7 : 7 - day;
  const nextSunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysToSunday, 23, 59, 59, 999);
  return nextSunday.getTime();
}

export async function loadWeeklyMissionsData() {
  const now = Date.now();
  const expiryStr = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyExpiry);
  let expiry = expiryStr ? parseInt(expiryStr, 10) : 0;

  if (now > expiry || !expiryStr) {
    expiry = getNextSundayMidnight();
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyExpiry, expiry.toString());
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyClaimed, JSON.stringify([]));
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyHeistsCount, '0');
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyMaxCombo, '0');
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyMaxMultiplier, '1');

    const shuffled = [...WEEKLY_MISSIONS].sort(() => 0.5 - Math.random());
    const pickedIds = shuffled.slice(0, 3).map(m => m.id);
    await SecureStore.setItemAsync(STORAGE_KEYS.weeklyActiveIds, JSON.stringify(pickedIds));
  }

  const activeIdsRaw = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyActiveIds);
  const activeIds: string[] = activeIdsRaw ? JSON.parse(activeIdsRaw) : [];
  const activeMissions = WEEKLY_MISSIONS.filter(m => activeIds.includes(m.id));

  const claimedRaw = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyClaimed);
  const claimed: string[] = claimedRaw ? JSON.parse(claimedRaw) : [];

  const weeklyHeists = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyHeistsCount);
  const wCombo = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyMaxCombo);
  const wMult = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyMaxMultiplier);

  const diff = expiry - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return {
    missions: activeMissions,
    claimed,
    weeklyHeists: weeklyHeists ? parseInt(weeklyHeists, 10) : 0,
    weeklyMaxCombo: wCombo ? parseInt(wCombo, 10) : 0,
    weeklyMaxMultiplier: wMult ? parseInt(wMult, 10) : 1,
    countdown: `${days}d ${hours}h left`,
  };
}

export async function incrementWeeklyHeists() {
  const current = await SecureStore.getItemAsync(STORAGE_KEYS.weeklyHeistsCount);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  await SecureStore.setItemAsync(STORAGE_KEYS.weeklyHeistsCount, next.toString());
}

let hapticsEnabledCache: boolean | null = null;

export async function loadHapticsEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(STORAGE_KEYS.hapticsEnabled);
  hapticsEnabledCache = value === null ? true : value === 'true';
  return hapticsEnabledCache;
}

export function setHapticsEnabledCache(enabled: boolean) {
  hapticsEnabledCache = enabled;
}

async function hapticsOn(): Promise<boolean> {
  if (hapticsEnabledCache === null) await loadHapticsEnabled();
  return hapticsEnabledCache ?? true;
}

export async function hapticImpact(style: Haptics.ImpactFeedbackStyle) {
  if (await hapticsOn()) await Haptics.impactAsync(style);
}

export async function hapticNotification(type: Haptics.NotificationFeedbackType) {
  if (await hapticsOn()) await Haptics.notificationAsync(type);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type DailyRewardInfo = {
  canClaim: boolean;
  streak: number;
  cashReward: number;
  diamondReward: number;
};

export async function getDailyRewardInfo(): Promise<DailyRewardInfo> {
  const last = await SecureStore.getItemAsync(STORAGE_KEYS.lastDailyClaim);
  const streakRaw = await SecureStore.getItemAsync(STORAGE_KEYS.dailyStreak);
  let streak = streakRaw ? parseInt(streakRaw, 10) : 0;
  const today = todayKey();

  if (last === today) {
    return { canClaim: false, streak, cashReward: 0, diamondReward: 0 };
  }

  if (last === yesterdayKey()) {
    streak += 1;
  } else {
    streak = 1;
  }

  const cashReward = 150 + streak * 75;
  const diamondReward = streak % 3 === 0 ? 2 : 0;
  return { canClaim: true, streak, cashReward, diamondReward };
}

export async function claimDailyReward(): Promise<DailyRewardInfo> {
  const info = await getDailyRewardInfo();
  if (!info.canClaim) return info;

  const bankRaw = await SecureStore.getItemAsync(STORAGE_KEYS.bank);
  const diamondsRaw = await SecureStore.getItemAsync(STORAGE_KEYS.diamonds);
  const bank = bankRaw ? parseInt(bankRaw, 10) : 0;
  const diamonds = diamondsRaw ? parseInt(diamondsRaw, 10) : 0;

  const newBank = bank + info.cashReward;
  const newDiamonds = diamonds + info.diamondReward;
  await SecureStore.setItemAsync(STORAGE_KEYS.bank, newBank.toString());
  await SecureStore.setItemAsync(STORAGE_KEYS.diamonds, newDiamonds.toString());
  await updateMaxBank(newBank);
  await SecureStore.setItemAsync(STORAGE_KEYS.lastDailyClaim, todayKey());
  await SecureStore.setItemAsync(STORAGE_KEYS.dailyStreak, info.streak.toString());

  return { ...info, canClaim: false };
}

export async function updateMaxBank(value: number) {
  const saved = await SecureStore.getItemAsync(STORAGE_KEYS.maxBank);
  if (!saved || value > parseInt(saved, 10)) {
    await SecureStore.setItemAsync(STORAGE_KEYS.maxBank, value.toString());
  }
}

export async function incrementTotalHeists() {
  const saved = await SecureStore.getItemAsync(STORAGE_KEYS.totalHeists);
  const next = (saved ? parseInt(saved, 10) : 0) + 1;
  await SecureStore.setItemAsync(STORAGE_KEYS.totalHeists, next.toString());
  return next;
}

export async function countClaimableMissions(): Promise<number> {
  const [maxCombo, maxMult, maxBank, claimedRaw, weeklyInfo] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.maxCombo),
    SecureStore.getItemAsync(STORAGE_KEYS.maxMultiplier),
    SecureStore.getItemAsync(STORAGE_KEYS.maxBank),
    SecureStore.getItemAsync(STORAGE_KEYS.claimedMissions),
    loadWeeklyMissionsData(),
  ]);

  const stats = {
    combo: maxCombo ? parseInt(maxCombo, 10) : 0,
    multiplier: maxMult ? parseInt(maxMult, 10) : 1,
    bank: maxBank ? parseInt(maxBank, 10) : 0,
  };
  const claimed: string[] = claimedRaw ? JSON.parse(claimedRaw) : [];

  let count = MISSIONS.filter((m) => {
    if (claimed.includes(m.id)) return false;
    if (m.type === 'combo') return stats.combo >= m.target;
    if (m.type === 'multiplier') return stats.multiplier >= m.target;
    return stats.bank >= m.target;
  }).length;

  weeklyInfo.missions.forEach((wm) => {
    if (weeklyInfo.claimed.includes(wm.id)) return;
    let completed = false;
    if (wm.type === 'combo' && weeklyInfo.weeklyMaxCombo >= wm.target) completed = true;
    if (wm.type === 'multiplier' && weeklyInfo.weeklyMaxMultiplier >= wm.target) completed = true;
    if (wm.type === 'weekly_heists' && weeklyInfo.weeklyHeists >= wm.target) completed = true;
    if (completed) count += 1;
  });

  return count;
}

export type NextUnlock = {
  name: string;
  currency: 'cash' | 'diamond';
  price: number;
  missing: number;
 };

export function getNextUnlock(
  bank: number,
  diamonds: number,
  unlockedSkins: string[],
  unlockedWorlds: string[]
): NextUnlock | null {
  const locked: { item: Skin | World; type: 'skin' | 'world' }[] = [];
  SKINS.forEach((s) => {
    if (!unlockedSkins.includes(s.id) && s.price > 0) locked.push({ item: s, type: 'skin' });
  });
  WORLDS.forEach((w) => {
    if (!unlockedWorlds.includes(w.id) && w.price > 0) locked.push({ item: w, type: 'world' });
  });

  locked.sort((a, b) => {
    const aCost = a.item.currency === 'cash' ? a.item.price : a.item.price * 1000;
    const bCost = b.item.currency === 'cash' ? b.item.price : b.item.price * 1000;
    return aCost - bCost;
  });

  const next = locked[0];
  if (!next) return null;

  const funds = next.item.currency === 'cash' ? bank : diamonds;
  return {
    name: next.item.name,
    currency: next.item.currency,
    price: next.item.price,
    missing: Math.max(0, next.item.price - funds),
  };
}

export const CORE_TUTORIAL_STEPS = [
  { title: 'STEP 1: THE HACK', text: 'Tap when your pointer hits the green zone on the vault ring.' },
  { title: 'STEP 2: RISK MODE', text: 'Every 10 hits, the system pauses. Cash out your run earnings or Risk It to double your multiplier.' },
  { title: 'STEP 3: FAILURE COST', text: 'Miss the zone and you lose 75% of this run\'s cash. Only 25% gets scrapped into your bank.' },
];

export const PRESTIGE_TIERS = [
  { cost: 1000000000, mult: 1024 },
  { cost: 500000000, mult: 512 },
  { cost: 100000000, mult: 256 },
  { cost: 50000000, mult: 128 },
  { cost: 25000000, mult: 64 },
  { cost: 10000000, mult: 32 },
  { cost: 6000000, mult: 16 },
  { cost: 4000000, mult: 8 },
  { cost: 2000000, mult: 4 },
  { cost: 1000000, mult: 2 },
];

export function getPrestigeOffer(bank: number, currentMult: number) {
  for (const tier of PRESTIGE_TIERS) {
    if (bank >= tier.cost && tier.mult > currentMult) {
      return tier;
    }
  }
  return null;
}

export function getHackerRank(heists: number, maxCombo: number): string {
  if (heists >= 2500 || maxCombo >= 150) return 'APEX SINGULARITY';
  if (heists >= 1000 || maxCombo >= 120) return 'CYBER GOD';
  if (heists >= 750 || maxCombo >= 100) return 'THE ARCHITECT';
  if (heists >= 500 || maxCombo >= 85) return 'GHOST IN THE MACHINE';
  if (heists >= 350 || maxCombo >= 70) return 'MASTER PHANTOM';
  if (heists >= 200 || maxCombo >= 55) return 'NETRUNNER';
  if (heists >= 120 || maxCombo >= 45) return 'CYBER DEMON';
  if (heists >= 80 || maxCombo >= 35) return 'BLACK HAT';
  if (heists >= 50 || maxCombo >= 25) return 'SYSTEM ADMIN';
  if (heists >= 25 || maxCombo >= 20) return 'WHITE HAT';
  if (heists >= 10 || maxCombo >= 12) return 'MALWARE DEV';
  if (heists >= 5 || maxCombo >= 8) return 'PACKET SNIFFER';
  return 'SCRIPT KIDDIE';
}

export function getRewardTier(nextCombo: number, worldId: string) {
  const SILVER = '#E6E8FA'; 
  const GOLD = '#FFD700';   
  const RED = '#FF2A2A';    
  const BLACK = '#0A0A0A'; // היהלום השחור הייחודי לעולם הסייברפאנק

  if (worldId === 'cyber') {
    // עולם סייברפאנק תמיד מביא יהלום שחור עם 5 יחידות (או צבעים מטורפים יותר בהמשך)
    return { gain: 5, color: BLACK, isBlack: true };
  } else if (worldId === 'diamond_world') {
    if (nextCombo >= 25) return { gain: 4, color: RED }; 
    if (nextCombo >= 15) return { gain: 3, color: GOLD }; 
    if (nextCombo >= 10) return { gain: 2, color: SILVER }; 
    return { gain: 1, color: '#00FFFF' }; 
  } else if (worldId === 'nebula') {
    if (nextCombo >= 125) return { gain: 4, color: RED };
    return { gain: 3, color: GOLD };
  } else {
    if (nextCombo >= 125) return { gain: 4, color: RED }; 
    if (nextCombo >= 100) return { gain: 3, color: GOLD }; 
    if (nextCombo >= 50)  return { gain: 2, color: SILVER }; 
    return { gain: 1, color: '#00FFFF' }; 
  }
}