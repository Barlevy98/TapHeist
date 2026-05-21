export interface Skin {
    id: string; name: string; currency: 'cash' | 'diamond'; price: number; color: string; glow: number; width: number;
    shape: 'standard' | 'spiked' | 'lightning'; // השדה החדש שמשנה את הצורה הגרפית!
  }
  
  export interface World {
    id: string; name: string; currency: 'cash' | 'diamond'; price: number; 
    bg: string; vaultRing: string; textPrimary: string; textSecondary: string;
  }
  
  export interface Mission {
    id: string; title: string; desc: string; type: 'combo' | 'multiplier' | 'bank'; target: number; rewardType: 'diamond' | 'cash' | 'skin'; rewardValue: any;
  }
  
  export const SKINS: Skin[] = [
    // --- TIER 1: Starter (Standard) ---
    { id: 'white', name: 'STANDARD WHITE', currency: 'cash', price: 0, color: '#FFFFFF', glow: 5, width: 4, shape: 'standard' },
    { id: 'pink', name: 'NEON PINK', currency: 'cash', price: 500, color: '#FF007F', glow: 8, width: 4, shape: 'standard' },
    { id: 'cyan', name: 'CYBER CYAN', currency: 'cash', price: 1000, color: '#00F0FF', glow: 8, width: 4, shape: 'standard' },
    
    // --- TIER 2: Dangerous (Spiked) ---
    { id: 'gold', name: 'SOLID GOLD', currency: 'cash', price: 2000, color: '#FFD700', glow: 12, width: 5, shape: 'spiked' },
    { id: 'ruby', name: 'BLOOD RUBY', currency: 'diamond', price: 100, color: '#E0115F', glow: 15, width: 6, shape: 'spiked' },
    
    // --- TIER 3: Premium (Lightning & Energy) ---
    { id: 'matrix', name: 'THE MATRIX', currency: 'diamond', price: 200, color: '#00FF41', glow: 20, width: 7, shape: 'standard' },
    { id: 'void', name: 'VOID MATTER', currency: 'cash', price: 5000, color: '#8A2BE2', glow: 30, width: 8, shape: 'lightning' },
  
    // --- TIER 4: GOD TIER (Grind for weeks!) ---
    { id: 'hacker_king', name: 'HACKER KING', currency: 'cash', price: 15000, color: '#FF4500', glow: 40, width: 10, shape: 'lightning' },
    { id: 'dragon_spike', name: 'DRAGON TOOTH', currency: 'diamond', price: 2500, color: '#FF0000', glow: 35, width: 12, shape: 'spiked' },
    { id: 'divine', name: 'DIVINE ENTITY', currency: 'diamond', price: 5000, color: '#FFFFFF', glow: 60, width: 15, shape: 'lightning' },
  ];
  
  export const WORLDS: World[] = [
    { id: 'darknet', name: 'DARKNET (DEFAULT)', currency: 'cash', price: 0, bg: '#050505', vaultRing: '#1A1A1A', textPrimary: '#FFFFFF', textSecondary: '#666666' },
    { id: 'arctic', name: 'ARCTIC LAB', currency: 'cash', price: 8000, bg: '#F2F2F7', vaultRing: '#D1D1D6', textPrimary: '#1C1C1E', textSecondary: '#8E8E93' },
    { id: 'cyber', name: 'CYBERPUNK NEON', currency: 'diamond', price: 500, bg: '#0A001F', vaultRing: '#2A0080', textPrimary: '#00FFFF', textSecondary: '#FF00FF' },
    { id: 'blood', name: 'BLOOD MOON', currency: 'diamond', price: 1000, bg: '#1A0000', vaultRing: '#330000', textPrimary: '#FF3B30', textSecondary: '#800000' },
  ];
  
  export const MISSIONS: Mission[] = [
    { id: 'm1', title: 'ROOKIE HACKER', desc: 'Reach a Combo of 15', type: 'combo', target: 15, rewardType: 'diamond', rewardValue: 20 },
    { id: 'm2', title: 'THE GAMBLER', desc: 'Reach x8 Multiplier in Risk Mode', type: 'multiplier', target: 8, rewardType: 'cash', rewardValue: 2500 },
    { id: 'm3', title: 'MASTER THIEF', desc: 'Accumulate $10,000 in the Bank', type: 'bank', target: 10000, rewardType: 'diamond', rewardValue: 50 },
  ];