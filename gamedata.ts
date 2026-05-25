export interface Skin {
  id: string; name: string; currency: 'cash' | 'diamond'; price: number; color: string; glow: number; width: number;
  shape: 'standard' | 'spiked' | 'lightning'; 
}

export interface World {
  id: string; name: string; currency: 'cash' | 'diamond'; price: number; 
  bg: string; vaultRing: string; textPrimary: string; textSecondary: string;
}

export interface Mission {
  id: string; title: string; desc: string; type: 'combo' | 'multiplier' | 'bank'; target: number; rewardType: 'diamond' | 'cash' | 'skin'; rewardValue: any;
}

export const SKINS: Skin[] = [
  // --- CASH SKINS (מטבע רגיל) ---
  { id: 'white', name: 'STANDARD WHITE', currency: 'cash', price: 0, color: '#FFFFFF', glow: 5, width: 4, shape: 'standard' },
  { id: 'pink', name: 'NEON PINK', currency: 'cash', price: 350, color: '#FF007F', glow: 8, width: 4, shape: 'standard' },
  { id: 'cyan', name: 'CYBER CYAN', currency: 'cash', price: 1000, color: '#00F0FF', glow: 8, width: 4, shape: 'standard' },
  { id: 'gold', name: 'SOLID GOLD', currency: 'cash', price: 1500, color: '#FFD700', glow: 12, width: 5, shape: 'spiked' },
  { id: 'plasma', name: 'PLASMA SHOCK', currency: 'cash', price: 2500, color: '#FF9900', glow: 18, width: 6, shape: 'lightning' },
  { id: 'emerald', name: 'EMERALD DAGGER', currency: 'cash', price: 5000, color: '#00FF88', glow: 15, width: 6, shape: 'spiked' },
  { id: 'void', name: 'VOID MATTER', currency: 'cash', price: 10000, color: '#8A2BE2', glow: 25, width: 8, shape: 'lightning' },
  { id: 'glitch', name: 'GLITCH CORE', currency: 'cash', price: 25000, color: '#FF0055', glow: 30, width: 7, shape: 'standard' },
  { id: 'hacker_king', name: 'HACKER KING', currency: 'cash', price: 50000, color: '#FF4500', glow: 40, width: 10, shape: 'lightning' },

  // --- DIAMOND SKINS (מטבע פרימיום) ---
  { id: 'ruby', name: 'BLOOD RUBY', currency: 'diamond', price: 100, color: '#E0115F', glow: 15, width: 6, shape: 'spiked' },
  { id: 'matrix', name: 'THE MATRIX', currency: 'diamond', price: 200, color: '#00FF41', glow: 20, width: 7, shape: 'standard' },
  { id: 'quantum', name: 'QUANTUM RIFT', currency: 'diamond', price: 500, color: '#007FFF', glow: 25, width: 7, shape: 'lightning' },
  { id: 'reaper', name: 'SOUL REAPER', currency: 'diamond', price: 1000, color: '#4B0082', glow: 35, width: 9, shape: 'spiked' },
  { id: 'dragon_spike', name: 'DRAGON TOOTH', currency: 'diamond', price: 2500, color: '#FF0000', glow: 35, width: 12, shape: 'spiked' },
  { id: 'divine', name: 'DIVINE ENTITY', currency: 'diamond', price: 6000, color: '#FFFFFF', glow: 60, width: 15, shape: 'lightning' },
];

export const WORLDS: World[] = [
  { id: 'darknet', name: 'DARKNET (DEFAULT)', currency: 'cash', price: 0, bg: '#050505', vaultRing: '#1A1A1A', textPrimary: '#FFFFFF', textSecondary: '#666666' },
  { id: 'retro', name: 'RETRO ARCADE', currency: 'cash', price: 3000, bg: '#120424', vaultRing: '#4B0082', textPrimary: '#FF007F', textSecondary: '#39FF14' },
  { id: 'arctic', name: 'ARCTIC LAB', currency: 'cash', price: 8000, bg: '#F2F2F7', vaultRing: '#D1D1D6', textPrimary: '#1C1C1E', textSecondary: '#8E8E93' },
  { id: 'cyber', name: 'CYBERPUNK NEON', currency: 'diamond', price: 750, bg: '#0A001F', vaultRing: '#2A0080', textPrimary: '#00FFFF', textSecondary: '#FF00FF' },
  { id: 'blood', name: 'BLOOD MOON', currency: 'diamond', price: 1500, bg: '#1A0000', vaultRing: '#330000', textPrimary: '#FF3B30', textSecondary: '#800000' },
  { id: 'nebula', name: 'DEEP NEBULA', currency: 'diamond', price: 4000, bg: '#020210', vaultRing: '#0D1B2A', textPrimary: '#E0AA3E', textSecondary: '#415A77' },
];

export const MISSIONS: Mission[] = [
  { id: 'm_easy_1', title: 'FIRST STEPS', desc: 'Reach a Combo of 5', type: 'combo', target: 5, rewardType: 'cash', rewardValue: 500 },
  { id: 'm_easy_2', title: 'TAKING RISKS', desc: 'Reach x4 Multiplier', type: 'multiplier', target: 4, rewardType: 'cash', rewardValue: 1200 },
  { id: 'm_easy_3', title: 'PIGGY BANK', desc: 'Accumulate $1,000 in Bank', type: 'bank', target: 1000, rewardType: 'diamond', rewardValue: 5 },
  { id: 'm_med_1', title: 'ROOKIE HACKER', desc: 'Reach a Combo of 15', type: 'combo', target: 15, rewardType: 'diamond', rewardValue: 20 },
  { id: 'm_med_2', title: 'THE GAMBLER', desc: 'Reach x8 Multiplier', type: 'multiplier', target: 8, rewardType: 'cash', rewardValue: 5000 },
  { id: 'm_med_3', title: 'SAVINGS ACCOUNT', desc: 'Accumulate $10,000 in Bank', type: 'bank', target: 10000, rewardType: 'diamond', rewardValue: 50 },
  { id: 'm_hard_1', title: 'PRO HACKER', desc: 'Reach a Combo of 30', type: 'combo', target: 30, rewardType: 'diamond', rewardValue: 150 },
  { id: 'm_hard_2', title: 'HIGH ROLLER', desc: 'Reach x16 Multiplier', type: 'multiplier', target: 16, rewardType: 'cash', rewardValue: 25000 },
  { id: 'm_hard_3', title: 'VAULT BREAKER', desc: 'Accumulate $50,000 in Bank', type: 'bank', target: 50000, rewardType: 'diamond', rewardValue: 300 },
  { id: 'm_epic_1', title: 'GODLIKE FOCUS', desc: 'Reach a Combo of 50', type: 'combo', target: 50, rewardType: 'diamond', rewardValue: 1000 },
  { id: 'm_epic_2', title: 'MILLIONAIRE CLUB', desc: 'Accumulate $100,000 in Bank', type: 'bank', target: 100000, rewardType: 'cash', rewardValue: 500000 },
  { id: 'm_epic_3', title: 'THE 1 PERCENT', desc: 'Accumulate $1,000,000 in Bank', type: 'bank', target: 1000000, rewardType: 'diamond', rewardValue: 5000 },
  { id: 'm_epic_4', title: 'UNTOUCHABLE', desc: 'Reach x32 Multiplier', type: 'multiplier', target: 32, rewardType: 'diamond', rewardValue: 2500 },
];