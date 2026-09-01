import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BossesScreen from '../app/bosses'
import * as SecureStore from 'expo-secure-store';

// העדכון הקריטי: דימוי מחזור חיים תקין בעזרת React.useEffect
jest.mock('expo-router', () => {
  const actualReact = jest.requireActual('react');
  return {
    useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
    useFocusEffect: jest.fn((cb) => actualReact.useEffect(cb, [])),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

// Mock Boss Data
jest.mock('../gamedata', () => ({
  BOSSES: [
    { 
      id: 'boss_1', 
      name: 'FIRST BOSS', 
      unlockCost: 0, 
      unlockCurrency: 'cash',
      targetHits: 10, 
      speedModifier: 1,
      rewardCash: 10000,
      rewardDiamonds: 10,
      themeColor: '#F00' 
    },
    { 
      id: 'boss_2', 
      name: 'SECOND BOSS', 
      unlockCost: 0, 
      unlockCurrency: 'cash',
      targetHits: 20, 
      speedModifier: 1.2,
      rewardCash: 20000,
      rewardDiamonds: 20,
      themeColor: '#0F0' 
    },
  ],
}));

describe('BossesScreen - Linear Progression', () => {
  it('renders second boss as CLASSIFIED if first boss is not defeated', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('0'); // Bank
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('0'); // Diamonds
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('[]'); // Unlocked Bosses
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('[]'); // Defeated Bosses

    const { getByText, queryByText } = await render(<BossesScreen />);

    await waitFor(() => {
      expect(getByText('FIRST BOSS')).toBeTruthy();
      expect(queryByText('SECOND BOSS')).toBeNull();
      expect(getByText('CLASSIFIED THREAT')).toBeTruthy();
      expect(getByText('Requires elimination of previous target.')).toBeTruthy();
    });
  });

  it('reveals second boss once first boss is defeated', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('0'); 
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('0'); 
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('["boss_1"]'); 
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('["boss_1"]'); // boss_1 is defeated

    const { getByText, queryByText } = await render(<BossesScreen />);

    await waitFor(() => {
      expect(getByText('FIRST BOSS')).toBeTruthy();
      expect(getByText('ELIMINATED')).toBeTruthy();
      expect(getByText('SECOND BOSS')).toBeTruthy();
      expect(queryByText('CLASSIFIED THREAT')).toBeNull();
    });
  });
});