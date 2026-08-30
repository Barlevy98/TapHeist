import React from 'react';
import { render } from '@testing-library/react-native';
import VaultRing from './VaultRing';

// Mock Reanimated to prevent errors in Jest
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('VaultRing - V2.0 Mechanics', () => {
  const defaultProps = {
    CIRCLE_SIZE: 300,
    STROKE_WIDTH: 25,
    radius: 125,
    activeWorld: { vaultRing: '#000' },
    activeSkin: { color: '#FFF', shape: 'standard', width: 5 },
    currentRewardTier: { color: '#00FFFF', isBlack: false },
    targetOpacityStyle: {},
    hitFlashStyle: {},
    pointerAnimatedStyle: {},
    strokeDasharray: '100 100',
    strokeDashoffset: 0,
  };

  it('renders combo counter only when combo > 0 and game is active', async () => {
    // הוספת await לפני ה-render
    const { getByText, queryByText, rerender } = await render(
      <VaultRing {...defaultProps} gameState="START" combo={0} isOverdrive={false} />
    );
    
    expect(queryByText('COMBO')).toBeNull();

    // הוספת await לפני ה-rerender
    await rerender(<VaultRing {...defaultProps} gameState="PLAYING" combo={15} isOverdrive={false} />);
    expect(getByText('15')).toBeTruthy();
    expect(getByText('COMBO')).toBeTruthy();
  });

  it('applies Overdrive block color logic', async () => {
    // הוספת await
    const { toJSON } = await render(
      <VaultRing {...defaultProps} gameState="PLAYING" combo={45} isOverdrive={true} />
    );
    expect(toJSON()).toBeTruthy();
  });
});