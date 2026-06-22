# Tap Heist

Tap Heist is a fast-paced idle tapping game built with React Native and Expo. Tap precisely through rotating vault rings, build combos, earn cash and diamonds, and spend your winnings on skins, worlds, and tactical power-ups.

## Overview

The current build centers on a tighter heist loop than the original README described. The game now includes rotating reward tiers, firewall encounters, prestige offers, weekly challenge rotation, and a larger cosmetic catalog across both cash and diamond economies.

## Core Gameplay

- Tap when the pointer overlaps the target zone on the vault ring.
- Successful taps increase your combo and multiplier.
- Runs earn cash by default, while special diamond targets can pay out premium rewards.
- Missing the zone ends the run, with part of the run value converted into banked cash.
- Risk mode appears during play and lets you cash out or push for a bigger multiplier.

## Progression

- Daily rewards give cash every day, with a streak bonus and a diamond bonus every third streak claim.
- Core missions track combo, multiplier, and bank milestones.
- Weekly missions rotate three active objectives each week and reset on Sunday.
- Hacker ranks are based on total heists and best combo, with higher tiers unlocked as you progress.
- Prestige offers appear when your bank reaches a tier threshold and grant permanent multiplier growth.

## Customization

- The shop now includes 26 pointer skins.
- Skins are split across cash and diamond purchases, with multiple pointer shapes and gradient variants.
- Nine worlds are available, each with its own visual theme and gameplay trait.
- The current worlds include Darknet, Retro Arcade, Arctic Lab, Cyberpunk Neon, Proof-of-History, Diamond Mine, Zero-Knowledge, Blood Moon, and Deep Nebula.

## Power-Ups

Three consumables are available in the tactical arsenal:

- Smart Shield blocks one miss.
- Time Freeze slows the pointer for three seconds.
- Precision Focus doubles the hit zone for five taps.

Power-ups can be bought with cash or diamonds, and some can also be earned from rewarded ads.

## UI And Screens

- The main screen shows the bank, diamonds, current run score, combo, multiplier, and active boost icons.
- The vault ring uses SVG-based pointer skins and reward visuals.
- The missions screen separates core missions from weekly challenges.
- The shop screen separates pointers, worlds, and power-ups, and shows the next unlock target.
- The stats and settings screens remain part of the app navigation.

## Gameplay Notes

- The base tap reward is 4 cash per hit.
- Diamond targets appear during play and use a distinct reward tier color flow.
- Firewall mode shrinks the active zone and ramps difficulty.
- Reward tiers shift as combo grows, including special scaling for the Diamond Mine and Nebula worlds.
- Runs can be revived with rewarded ads.

## Tech Stack

- React Native 0.81.5
- Expo 54
- TypeScript 5.9
- Expo Router
- React Native Reanimated
- Expo Secure Store
- Expo Haptics
- React Native SVG
- Google Mobile Ads

## Data Storage

Game state is stored locally on the device. Secure Store is used for bank, diamonds, unlocks, missions, inventory, streaks, stats, and settings.

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo tooling

### Run Locally

1. Clone the repository.
2. Install dependencies with npm install.
3. Start the app with npm start.
4. Run on iOS, Android, or web from the Expo tooling.

### Production Builds

Use EAS to build for iOS or Android.

## Project Structure

```
tapheist/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── missions.tsx
│   ├── settings.tsx
│   ├── shop.tsx
│   └── stats.tsx
├── components/
│   ├── GameHeader.tsx
│   ├── GameUI.tsx
│   ├── GradientPointer.tsx
│   ├── TacticalArsenal.tsx
│   └── VaultRing.tsx
├── gamedata.ts
├── gameHelpers.ts
├── app.json
├── package.json
└── tsconfig.json
```

## License

This project is proprietary. All rights reserved.
