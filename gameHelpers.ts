import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { MISSIONS, Mission, SKINS, WORLDS, Skin, World } from './gamedata';

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
  totalHeists: 'stat_total_heists',
  diamondTutorial: 'has_seen_tutorial',
  coreTutorial: 'has_seen_core_tutorial',
  riskTutorial: 'has_seen_risk_tutorial',
  lastDailyClaim: 'last_daily_claim_date',
  dailyStreak: 'daily_streak_count',
  hapticsEnabled: 'settings_haptics_enabled',
} as const;

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
  const [maxCombo, maxMult, maxBank, claimedRaw] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.maxCombo),
    SecureStore.getItemAsync(STORAGE_KEYS.maxMultiplier),
    SecureStore.getItemAsync(STORAGE_KEYS.maxBank),
    SecureStore.getItemAsync(STORAGE_KEYS.claimedMissions),
  ]);

  const stats = {
    combo: maxCombo ? parseInt(maxCombo, 10) : 0,
    multiplier: maxMult ? parseInt(maxMult, 10) : 1,
    bank: maxBank ? parseInt(maxBank, 10) : 0,
  };
  const claimed: string[] = claimedRaw ? JSON.parse(claimedRaw) : [];

  return MISSIONS.filter((m) => {
    if (claimed.includes(m.id)) return false;
    if (m.type === 'combo') return stats.combo >= m.target;
    if (m.type === 'multiplier') return stats.multiplier >= m.target;
    return stats.bank >= m.target;
  }).length;
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
  {
    title: 'STEP 1: THE HACK',
    text: 'Tap when your pointer hits the green zone on the vault ring.',
  },
  {
    title: 'STEP 2: RISK MODE',
    text: 'Every 10 hits, the system pauses. Cash out your run earnings or Risk It to double your multiplier.',
  },
  {
    title: 'STEP 3: FAILURE COST',
    text: 'Miss the zone and you lose 75% of this run\'s cash. Only 25% gets scrapped into your bank.',
  },
];
