import React from 'react';
import { render } from '@testing-library/react-native';
import GameUI from './GameUI';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('GameUI - V2.0 Screens', () => {
  const baseProps = {
    activeWorld: { id: 'darknet', textPrimary: '#FFF', textSecondary: '#666' },
    score: 50000,
    multiplier: 2,
    runMaxCombo: 40,
    runDiamondsEarned: 10,
    dailyModal: { visible: false },
    activeBoss: { name: 'THE MAINFRAME', themeColor: '#FF3B30' },
  };

  it('renders START screen correctly', async () => {
    const { getByText } = await render(<GameUI {...baseProps} gameState="START" hackerRank="WHITE HAT" />);
    expect(getByText('TAP TO HACK')).toBeTruthy();
    expect(getByText('RANK: WHITE HAT')).toBeTruthy();
    expect(getByText('MEGA VAULTS')).toBeTruthy();
  });

  it('renders BOSS_DEFEATED screen correctly', async () => {
    const { getByText } = await render(<GameUI {...baseProps} gameState="BOSS_DEFEATED" />);
    expect(getByText('SYSTEM COMPROMISED')).toBeTruthy();
    expect(getByText('THE MAINFRAME HAS FALLEN')).toBeTruthy();
    expect(getByText('RETURN TO MENU')).toBeTruthy();
  });

  it('renders SYSTEM OVERDRIVE scramble warning', async () => {
    const { getByText } = await render(
      <GameUI {...baseProps} gameState="PLAYING" firewallWarning="⚡ SYSTEM OVERDRIVE ⚡" />
    );
    expect(getByText('⚡ SYSTEM OVERDRIVE ⚡')).toBeTruthy();
  });
});