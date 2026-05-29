export interface Skin {
  id: string;
  name: string;
  currency: 'cash' | 'diamond';
  price: number;
  color: string;
  glow: number;
  width: number;
  // הוספנו תמיכה בצורות המיוחדות של שלב 4
  shape: 'standard' | 'spiked' | 'lightning' | 'gradient' | 'binary' | 'chain';
  primaryColor?: string;
  secondaryColor?: string;
}

export interface World {
  id: string;
  name: string;
  currency: 'cash' | 'diamond';
  price: number;
  bg: string;
  vaultRing: string;
  textPrimary: string;
  textSecondary: string;
}

export interface Mission {
  id: string;
  title: string;
  desc: string;
  type: 'combo' | 'multiplier' | 'bank';
  target: number;
  rewardType: 'diamond' | 'cash' | 'skin';
  rewardValue: any;
}

export interface PowerUp {
  id: string;
  name: string;
  desc: string;
  price: number;
  currency: 'cash' | 'diamond';
  color: string;
}

export const SKINS: Skin[] = [
  { id: 'white', name: 'STANDARD WHITE', currency: 'cash', price: 0, color: '#FFFFFF', glow: 5, width: 4, shape: 'standard' },
  { id: 'pink', name: 'NEON PINK', currency: 'cash', price: 350, color: '#FF007F', glow: 8, width: 4, shape: 'standard' },
  { id: 'cyan', name: 'CYBER CYAN', currency: 'cash', price: 1000, color: '#00F0FF', glow: 8, width: 4, shape: 'standard' },
  { id: 'gold', name: 'SOLID GOLD', currency: 'cash', price: 1500, color: '#FFD700', glow: 12, width: 5, shape: 'spiked' },
  { id: 'phantom', name: 'PHANTOM GREY', currency: 'cash', price: 2000, color: '#2C2C2E', glow: 10, width: 5, shape: 'standard' }, 
  { id: 'plasma', name: 'PLASMA SHOCK', currency: 'cash', price: 2500, color: '#FF9900', glow: 18, width: 6, shape: 'lightning' },
  { id: 'emerald', name: 'EMERALD DAGGER', currency: 'cash', price: 5000, color: '#00FF88', glow: 15, width: 6, shape: 'spiked' },
  { id: 'void', name: 'VOID MATTER', currency: 'cash', price: 10000, color: '#8A2BE2', glow: 25, width: 8, shape: 'lightning' },
  { id: 'obsidian', name: 'OBSIDIAN BLACK', currency: 'cash', price: 15000, color: '#0A0A0A', glow: 15, width: 7, shape: 'standard' }, 
  { id: 'glitch', name: 'GLITCH CORE', currency: 'cash', price: 25000, color: '#FF0055', glow: 30, width: 7, shape: 'standard' },
  { id: 'hacker_king', name: 'HACKER KING', currency: 'cash', price: 50000, color: '#FF4500', glow: 40, width: 10, shape: 'lightning' },
  { id: 'cyber_demon', name: 'CYBER DEMON', currency: 'cash', price: 75000, color: '#FF0000', glow: 20, width: 8, shape: 'gradient', primaryColor: '#FF0000', secondaryColor: '#111111' },
  { id: 'neon_voltage', name: 'NEON VOLTAGE', currency: 'cash', price: 100000, color: '#FFFF00', glow: 25, width: 8, shape: 'gradient', primaryColor: '#FFFF00', secondaryColor: '#0000FF' },

  { id: 'ruby', name: 'BLOOD RUBY', currency: 'diamond', price: 100, color: '#E0115F', glow: 15, width: 6, shape: 'spiked' },
  { id: 'matrix', name: 'THE MATRIX', currency: 'diamond', price: 200, color: '#00FF41', glow: 20, width: 7, shape: 'standard' },
  { id: 'onyx', name: 'ONYX SPIKE', currency: 'diamond', price: 350, color: '#000000', glow: 25, width: 8, shape: 'spiked' }, 
  // עדכנו את צורות הסקינים לקריפטו לעיצובים החדשים שניצור
  { id: 'binary_code', name: 'BINARY CODE', currency: 'diamond', price: 400, color: '#00FF41', glow: 15, width: 5, shape: 'binary' },
  { id: 'hash_chain', name: 'HASH CHAIN', currency: 'diamond', price: 800, color: '#F7931A', glow: 20, width: 8, shape: 'chain' },
  { id: 'quantum', name: 'QUANTUM RIFT', currency: 'diamond', price: 500, color: '#007FFF', glow: 25, width: 7, shape: 'lightning' },
  { id: 'reaper', name: 'SOUL REAPER', currency: 'diamond', price: 1000, color: '#4B0082', glow: 35, width: 9, shape: 'spiked' },
  { id: 'dragon_spike', name: 'DRAGON TOOTH', currency: 'diamond', price: 2500, color: '#FF0000', glow: 35, width: 12, shape: 'spiked' },
  { id: 'divine', name: 'DIVINE ENTITY', currency: 'diamond', price: 6000, color: '#FFFFFF', glow: 60, width: 15, shape: 'lightning' },
];

export const WORLDS: World[] = [
  { id: 'darknet', name: 'DARKNET (DEFAULT)', currency: 'cash', price: 0, bg: '#050505', vaultRing: '#1A1A1A', textPrimary: '#FFFFFF', textSecondary: '#666666' },
  { id: 'retro', name: 'RETRO ARCADE', currency: 'cash', price: 3000, bg: '#120424', vaultRing: '#4B0082', textPrimary: '#FF007F', textSecondary: '#39FF14' },
  { id: 'arctic', name: 'ARCTIC LAB', currency: 'cash', price: 8000, bg: '#F2F2F7', vaultRing: '#D1D1D6', textPrimary: '#1C1C1E', textSecondary: '#8E8E93' },
  { id: 'diamond_world', name: 'DIAMOND MINE', currency: 'diamond', price: 250, bg: '#050011', vaultRing: '#110022', textPrimary: '#00FFFF', textSecondary: '#660088' },
  { id: 'zk_vault', name: 'ZERO-KNOWLEDGE', currency: 'diamond', price: 500, bg: '#09090B', vaultRing: '#27272A', textPrimary: '#A1A1AA', textSecondary: '#52525B' },
  { id: 'cyber', name: 'CYBERPUNK NEON', currency: 'diamond', price: 750, bg: '#0A001F', vaultRing: '#2A0080', textPrimary: '#00FFFF', textSecondary: '#FF00FF' },
  { id: 'poh_vault', name: 'PROOF-OF-HISTORY', currency: 'diamond', price: 1000, bg: '#140027', vaultRing: '#3B0066', textPrimary: '#14F195', textSecondary: '#9945FF' },
  { id: 'blood', name: 'BLOOD MOON', currency: 'diamond', price: 1500, bg: '#1A0000', vaultRing: '#330000', textPrimary: '#FF3B30', textSecondary: '#800000' },
  { id: 'nebula', name: 'DEEP NEBULA', currency: 'diamond', price: 4000, bg: '#020210', vaultRing: '#0D1B2A', textPrimary: '#E0AA3E', textSecondary: '#415A77' },
];

export const POWER_UPS: PowerUp[] = [
  // מסודר מהזול ליקר לפי מטבעות
  { id: 'time_freeze', name: 'TIME FREEZE', desc: 'Slows pointer for 3 seconds.', price: 2500, currency: 'cash', color: '#00FFFF' },
  { id: 'smart_shield', name: 'SMART SHIELD', desc: 'Blocks 1 miss. Keeps combo alive.', price: 5000, currency: 'cash', color: '#00FF66' },
  { id: 'precision_focus', name: 'PRECISION FOCUS', desc: 'Double hit-zone size for 5 taps.', price: 15, currency: 'diamond', color: '#FFCC00' },
];

export const MISSIONS: Mission[] = [
  // --- משימות מזומן (מסודר מהנמוך לגבוה) ---
  { id: 'm_intro_1', title: 'GETTING WARM', desc: 'Reach x2 Multiplier', type: 'multiplier', target: 2, rewardType: 'cash', rewardValue: 250 },
  { id: 'm_easy_1', title: 'FIRST STEPS', desc: 'Reach a Combo of 5', type: 'combo', target: 5, rewardType: 'cash', rewardValue: 500 },
  { id: 'm_intro_2', title: 'STEADY HANDS', desc: 'Reach a Combo of 10', type: 'combo', target: 10, rewardType: 'cash', rewardValue: 800 },
  { id: 'm_easy_2', title: 'TAKING RISKS', desc: 'Reach x4 Multiplier', type: 'multiplier', target: 4, rewardType: 'cash', rewardValue: 1000 }, 
  { id: 'm_med_0', title: 'GROWING STASH', desc: 'Accumulate $5,000 in Bank', type: 'bank', target: 5000, rewardType: 'cash', rewardValue: 1500 },
  { id: 'm_med_2', title: 'THE GAMBLER', desc: 'Reach x8 Multiplier', type: 'multiplier', target: 8, rewardType: 'cash', rewardValue: 2500 }, 
  { id: 'm_med_2b', title: 'SOLID RUN', desc: 'Reach a Combo of 20', type: 'combo', target: 20, rewardType: 'cash', rewardValue: 3500 },
  { id: 'm_hard_0', title: 'SAFE CRACKER', desc: 'Accumulate $25,000 in Bank', type: 'bank', target: 25000, rewardType: 'cash', rewardValue: 4000 },
  { id: 'm_hard_2', title: 'HIGH ROLLER', desc: 'Reach x16 Multiplier', type: 'multiplier', target: 16, rewardType: 'cash', rewardValue: 5000 }, 
  { id: 'm_epic_2', title: 'MILLIONAIRE CLUB', desc: 'Accumulate $100,000 in Bank', type: 'bank', target: 100000, rewardType: 'cash', rewardValue: 15000 }, 
  { id: 'm_new_2', title: 'DEEP POCKETS', desc: 'Accumulate $250,000 in Bank', type: 'bank', target: 250000, rewardType: 'cash', rewardValue: 25000 },
  { id: 'm_god_1', title: 'LEGENDARY', desc: 'Reach x64 Multiplier', type: 'multiplier', target: 64, rewardType: 'cash', rewardValue: 50000 },

  // --- משימות יהלומים (מסודר מהנמוך לגבוה) ---
  { id: 'm_easy_3', title: 'PIGGY BANK', desc: 'Accumulate $1,000 in Bank', type: 'bank', target: 1000, rewardType: 'diamond', rewardValue: 5 },
  { id: 'm_med_1', title: 'ROOKIE HACKER', desc: 'Reach a Combo of 15', type: 'combo', target: 15, rewardType: 'diamond', rewardValue: 15 },
  { id: 'm_med_3', title: 'SAVINGS ACCOUNT', desc: 'Accumulate $10,000 in Bank', type: 'bank', target: 10000, rewardType: 'diamond', rewardValue: 30 }, 
  { id: 'm_hard_1', title: 'PRO HACKER', desc: 'Reach a Combo of 30', type: 'combo', target: 30, rewardType: 'diamond', rewardValue: 100 }, 
  { id: 'm_hard_3', title: 'VAULT BREAKER', desc: 'Accumulate $50,000 in Bank', type: 'bank', target: 50000, rewardType: 'diamond', rewardValue: 150 }, 
  { id: 'm_new_1', title: 'DIAMOND RUSH', desc: 'Reach a Combo of 40', type: 'combo', target: 40, rewardType: 'diamond', rewardValue: 250 },
  { id: 'm_epic_1', title: 'GODLIKE FOCUS', desc: 'Reach a Combo of 50', type: 'combo', target: 50, rewardType: 'diamond', rewardValue: 500 }, 
  { id: 'm_epic_3', title: 'THE 1 PERCENT', desc: 'Accumulate $1,000,000 in Bank', type: 'bank', target: 1000000, rewardType: 'diamond', rewardValue: 1000 }, 
  { id: 'm_epic_4', title: 'UNTOUCHABLE', desc: 'Reach x32 Multiplier', type: 'multiplier', target: 32, rewardType: 'diamond', rewardValue: 1500 },
  { id: 'm_new_3', title: 'MASTER GAMBLER', desc: 'Reach x128 Multiplier', type: 'multiplier', target: 128, rewardType: 'diamond', rewardValue: 3000 },
];