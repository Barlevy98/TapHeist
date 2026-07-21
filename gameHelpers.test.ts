import {
  getHackerRank,
  getCumulativeRankRewards,
  getRewardTier,
  getPrestigeOffer,
  formatNumber
} from './gameHelpers';

// 1. Mocks
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

describe('GameHelpers - Logic & Economy Tests (Production Version)', () => {

  // --- בדיקות למנגנון הרמות (Ranks) ---
  describe('Hacker Ranks Logic', () => {
    it('should return the lowest rank for new players (0 heists, 0 combo)', () => {
      const rank = getHackerRank(0, 0);
      expect(rank).toBe('SCRIPT KIDDIE');
    });

    it('should upgrade rank based on heists alone', () => {
      const rank = getHackerRank(10, 0);
      expect(rank).toBe('MALWARE DEV'); 
    });

    it('should upgrade rank based on maxCombo alone', () => {
      const rank = getHackerRank(0, 20);
      expect(rank).toBe('WHITE HAT'); 
    });

    it('should return APEX SINGULARITY for highest stats', () => {
      const rank = getHackerRank(3000, 200);
      expect(rank).toBe('APEX SINGULARITY');
    });
  });

  // --- בדיקות לסכימת תגמולי רמות (Cumulative Rewards - Current Production Logic) ---
  describe('Cumulative Rank Rewards', () => {
    it('should calculate zero rewards if ranks are the same', () => {
      const rewards = getCumulativeRankRewards('SCRIPT KIDDIE', 'SCRIPT KIDDIE');
      expect(rewards.cash).toBe(0);
      expect(rewards.diamonds).toBe(0);
    });

    it('should sum rewards correctly when jumping from SCRIPT KIDDIE to WHITE HAT', () => {
      // דילוג על הרמות מהבסיס:
      // PACKET SNIFFER (5000 cash)
      // MALWARE DEV (15000 cash)
      // WHITE HAT (25 diamonds)
      // סך הכל: 20000 כסף, 25 יהלומים
      const rewards = getCumulativeRankRewards('SCRIPT KIDDIE', 'WHITE HAT');
      expect(rewards.cash).toBe(20000);
      expect(rewards.diamonds).toBe(25);
    });

    it('should calculate correctly for a single rank jump', () => {
      // קפיצה מ- MALWARE DEV ל- WHITE HAT
      // הבונוס של WHITE HAT הוא 25 יהלומים (ואפס כסף)
      const rewards = getCumulativeRankRewards('MALWARE DEV', 'WHITE HAT');
      expect(rewards.cash).toBe(0);
      expect(rewards.diamonds).toBe(25);
    });

    it('should sum multiple mixed rewards for large jumps', () => {
      // קפיצה מ- WHITE HAT ל- BLACK HAT
      // SYSTEM ADMIN (50000 cash)
      // BLACK HAT (75 diamonds)
      // סך הכל: 50000 כסף, 75 יהלומים
      const rewards = getCumulativeRankRewards('WHITE HAT', 'BLACK HAT');
      expect(rewards.cash).toBe(50000);
      expect(rewards.diamonds).toBe(75);
    });
  });

  // --- בדיקות ליוקרת שחקן (Prestige Offers) ---
  describe('Prestige System', () => {
    it('should return null if bank is too low for any prestige', () => {
      const offer = getPrestigeOffer(500000, 1);
      expect(offer).toBeNull();
    });

    it('should return the correct tier based on bank balance', () => {
      // 10,000,000 נדרש ל-x32
      const offer = getPrestigeOffer(15000000, 1);
      expect(offer).not.toBeNull();
      expect(offer?.mult).toBe(32);
    });

    it('should not offer a lower multiplier than the player already has', () => {
      // יש מספיק כסף ל-x2, אבל לשחקן כבר יש x4
      const offer = getPrestigeOffer(1500000, 4);
      expect(offer).toBeNull();
    });
  });

  // --- בדיקות ליהלומים השונים בעולמות (Reward Tiers) ---
  describe('Reward Tiers Logic', () => {
    it('should return the black diamond logic strictly for Cyberpunk world', () => {
      const tier = getRewardTier(50, 'cyber');
      expect(tier.isBlack).toBe(true);
      expect(tier.gain).toBe(5);
    });

    it('should scale colors and gains normally for Darknet', () => {
      const lowTier = getRewardTier(10, 'darknet');
      expect(lowTier.gain).toBe(1);

      const highTier = getRewardTier(130, 'darknet');
      expect(highTier.gain).toBe(4);
    });

    it('should scale faster for Diamond Mine world', () => {
      // ביהלומים נדרש רק קומבו 26 למקסימום
      const maxTier = getRewardTier(30, 'diamond_world');
      expect(maxTier.gain).toBe(4);
    });
  });

  // --- בדיקות לעיצוב מספרים ---
  describe('Formatting Logic', () => {
    it('should process formatNumber correctly using toLocaleString', () => {
      const result = formatNumber(1500000);
      expect(typeof result).toBe('string');
      // נוודא שהמחרוזת לא ריקה ושהיא אכן מייצגת מספר
      expect(result.length).toBeGreaterThan(0);
    });
  });

});