# 🎮 Tap Heist

A fast-paced idle tapping game built with React Native and Expo. Master precision timing, build combo streaks, and infiltrate virtual vaults to become the ultimate digital heist master.

## 📱 Overview

Tap Heist is an addictive incremental tapping game where players must tap precisely within shrinking zones to earn cash, diamonds, and special rewards. Combine quick reflexes, strategic power-ups, and customization to maximize your heist profits and climb the global ranks.

### Core Gameplay
- **Precision Tapping**: Tap within the target zone as it rotates and shrinks around the vault
- **Combo System**: Build consecutive successful taps to increase your multiplier
- **Dual Currency**: Earn both cash (common) and diamonds (premium)
- **Risk & Reward**: Failed taps break combos but provide consolation prizes
- **Prestige System**: Reset your progress for exponential multiplier boosts

## 🎯 Features

### 🎨 Customization
- **25+ Unique Skins**: Customize your pointer with various styles
  - Free skins (Standard White, Neon Pink, Cyber Cyan)
  - Premium skins (Void Matter, Obsidian Black, Glitch Core)
  - Diamond-exclusive skins (Soul Reaper, Divine Entity, Dragon Tooth)
- **9 Themed Worlds**: Change the visual environment and UI colors
  - Default Darknet theme
  - Retro Arcade, Arctic Lab, Cyberpunk Neon
  - Blockchain-inspired worlds (Zero-Knowledge, Proof-of-History)

### 🎁 Progression System
- **Daily Rewards**: Claim cash and diamonds daily with streak bonuses
- **Missions**: Complete daily objectives for extra rewards
  - Combo challenges (reach X combo)
  - Multiplier targets
  - Bank milestones
- **Weekly Missions**: 3 rotating weekly challenges that reset every Sunday
- **Hacker Ranks**: Unlock achievements and cosmetics as you progress

### ⚡ Power-Ups
Three tactical power-ups to enhance gameplay:
- **Smart Shield**: Block one miss and keep your combo alive
- **Time Freeze**: Slow down the rotating pointer for 3 seconds
- **Precision Focus**: Double the target zone size for your next 5 taps

### 📊 Statistics
Track your performance with detailed stats:
- Maximum combo reached
- Highest multiplier achieved
- Best run earnings (cash & diamonds)
- Total heists completed
- Prestige multiplier level
- Daily streaks

### 🔧 Game Mechanics

**Rotating Vault System**
- The pointer rotates around a circular vault ring
- A target zone shrinks and moves as your combo increases
- Hit the zone = score + combo increase
- Miss = combo reset + consolation prize

**Multiplier Mechanics**
- Start at 1x multiplier
- Increase with consecutive hits (1x → 2x → 3x → 4x...)
- Multiplier boosts your earnings exponentially
- Prestige multiplier persists between resets

**Difficulty Scaling**
- Pointer speed increases with combo count
- Target zone shrinks as combo builds
- Firewall mode (advanced): Reduces zone size to 50%
- Diamond targets appear randomly (20% chance)

**Prestige System**
- Reset progress for a permanent multiplier boost
- Unlock new content and visual themes
- Sacrifice current progress for exponential growth potential

## 🛠️ Tech Stack

### Frontend
- **React Native 0.81.5** - Cross-platform mobile framework
- **Expo ~54.0.33** - React Native development platform
- **TypeScript ~5.9.2** - Type-safe JavaScript
- **React Native Reanimated ~4.1.1** - Smooth 60fps animations
- **Expo Router ~6.0.23** - File-based routing system

### Libraries & Features
- **Expo Haptics** - Tactile feedback for taps and achievements
- **Expo Secure Store** - Encrypted game data storage
- **Async Storage** - Persistent user preferences
- **React Native MMKV** - High-performance data persistence
- **Google Mobile Ads** - Rewarded video ads for revivals
- **Store Review** - In-app rating prompts

### Styling
- **React Native SVG** - Vector graphics for custom skins
- **React Native Safe Area Context** - Notch & safe area support

## 📲 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd tapheist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - iOS: `npm run ios` (requires Xcode)
   - Android: `npm run android` (requires Android Studio)
   - Web: `npm run web`

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build both
eas build --platform all
```

## 📂 Project Structure

```
tapheist/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with navigation
│   ├── index.tsx                # Main game screen
│   ├── missions.tsx             # Missions page
│   ├── shop.tsx                 # Shop for skins & worlds
│   ├── stats.tsx                # Statistics dashboard
│   └── settings.tsx             # Game settings
├── components/                   # Reusable UI components
│   ├── GameHeader.tsx           # Header with cash/diamond display
│   ├── GameUI.tsx               # Game interface elements
│   ├── VaultRing.tsx            # Animated vault ring
│   ├── TacticalArsenal.tsx      # Power-ups inventory
│   └── GradientPointer.tsx      # Custom pointer graphic
├── gamedata.ts                  # Game constants & data structures
├── gameHelpers.ts               # Game logic utilities
├── app.json                     # Expo configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## 🎮 How to Play

1. **Start a Run**: Tap the vault to begin
2. **Watch the Pointer**: The pointer rotates around the vault ring
3. **Hit the Zone**: Tap when the pointer is in the target zone
4. **Build Your Combo**: Each successful tap increases your combo and multiplier
5. **Earn Rewards**: Multiplier multiplies your base reward (4 cash per tap)
6. **Use Power-Ups**: Strategically use power-ups to extend runs
7. **Complete Missions**: Earn bonus rewards from daily and weekly objectives
8. **Customize**: Unlock and equip unique skins and worlds

## 💾 Data & Storage

All game data is securely stored locally:
- **Secure Store**: Bank balance, diamonds, skins, worlds
- **Async Storage**: User preferences, settings
- **Local Persistence**: Game state survives app restarts

## 🎵 Haptics & Audio

- Haptic feedback on successful taps
- Different haptic patterns for combo milestones
- Notification haptics for rewards
- Toggle haptics in settings

## 📈 Monetization

- **Free to Play**: No paywalls or energy systems
- **Ad-Supported**: Optional rewarded ads for revival tokens
- **Premium Cosmetics**: Diamonds unlock exclusive skins and worlds
- **Battle Pass**: Weekly seasonal content

## 🚀 Performance Features

- 60 FPS animations with React Native Reanimated
- Optimized rendering with memoization
- Efficient state management
- Minimal bundle size with tree-shaking

## 🔐 Privacy & Security

- No account creation required
- Game data stored locally (not on servers)
- Encrypted secure storage for sensitive data
- No personal data collection

## 📝 Version History

### v1.4 - Prestige & Firewall Update
- Prestige multiplier system
- Firewall challenge mode
- Enhanced statistics tracking

### v1.3 - Weekly Missions
- Weekly mission system
- 3 rotating objectives per week
- Weekly milestone tracking

### v1.0 - Launch
- Core tapping mechanics
- Skin & world customization
- Daily missions & rewards

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🎤 Credits

- **Game Design**: FIXRA Team
- **Development**: Built with Expo & React Native
- **Assets**: Custom SVG graphics & animations

## 📞 Support

For bug reports, feature requests, or support:
- Open an issue on the repository
- Contact: fixra.partners@gmail.com

---



*Version 1.3 - Currently available on iOS*
