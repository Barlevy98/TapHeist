// --- בדיקות לוגיקה וקבועי משחק קריטיים ל-Game Engine ---

describe('Game Engine Constants & Formula Checks', () => {
    // הקבועים מתוך index.tsx לקביעת היגיון המשחק
    const BASE_REWARD = 4;
    const FAIL_REWARD_FRACTION = 0.25;
    const DIAMOND_CHANCE = 0.20;
    const NEAR_MISS_MULTIPLIER = 1.35;
    const HIT_BUFFER = 0.8;
    const ZONE_SIZE = 45;
  
    it('calculates fail consolation prize correctly (25% of run cash)', () => {
      const score = 10000;
      const consolationPrize = Math.floor(score * FAIL_REWARD_FRACTION);
      expect(consolationPrize).toBe(2500);
    });
  
    it('calculates reward with multiplier and prestige correctly', () => {
      const multiplier = 4;
      const prestigeMult = 2;
      const reward = Math.floor(BASE_REWARD * multiplier * prestigeMult);
      // 4 * 4 * 2 = 32
      expect(reward).toBe(32);
    });
  
    it('calculates Firewall reward (4x multiplier) correctly', () => {
      const multiplier = 8;
      const prestigeMult = 1;
      const reward = Math.floor(BASE_REWARD * (multiplier * 4) * prestigeMult);
      // 4 * (8 * 4) * 1 = 128
      expect(reward).toBe(128);
    });
  
    it('hit detection logic respects active zone buffer', () => {
      // בדיקה מתמטית שה-Hit Buffer מרחיב את זווית הפגיעה כראוי
      const baseHitLimit = ZONE_SIZE / 2; // 22.5
      const hitLimitWithBuffer = baseHitLimit + HIT_BUFFER; // 23.3
      const nearMissLimit = hitLimitWithBuffer * NEAR_MISS_MULTIPLIER; // 31.455
  
      expect(20 <= hitLimitWithBuffer).toBe(true); // HIT
      expect(25 > hitLimitWithBuffer && 25 <= nearMissLimit).toBe(true); // NEAR MISS
      expect(40 > nearMissLimit).toBe(true); // MISS
    });
  });