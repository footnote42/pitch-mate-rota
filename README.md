# Pitch Mate Rota - Squad Rotation Manager

A rugby player rotation management tool designed for festival games, helping coaches ensure fair playing time and RFU compliance while managing squad rotations.

**Built for**: Trojans RFC Age-Grade Coaches
**Tech Stack**: React 18 + TypeScript + Vite + shadcn-ui + Tailwind CSS

## Features

### 🏉 Smart Squad Management
- **3-Level Experience System**: Classify players as New (⭐), Getting There (⭐⭐), or Match Ready (⭐⭐⭐)
- **Flexible Sorting**: Sort your squad by order added, alphabetically, or by experience level
- **Real-Time Fairness Tracking**: Visual indicators show playing time distribution and RFU compliance

### 📊 Intelligent Rotation Grid
- **Interactive Assignment**: Click cells to quickly assign players to game halves
- **Balance Indicators**: Weighted experience point system ensures balanced team selection
- **Hard Limits**: Automatic enforcement of 8 players per half (RFU standard)
- **Editable Game Labels**: Add opponent names and kick-off times for each game

### 📱 Mobile-First Design
- **Offline-First**: All data stored locally - works perfectly pitchside without internet
- **Touch-Optimized**: Large, easy-to-tap controls designed for outdoor use
- **Responsive Grid**: Horizontal scrolling for multi-game management on small screens
- **Trojans RFC Branding**: Custom colors and logo throughout

### 🎓 First-Time User Experience
- **4-Step Tutorial**: Clear walkthrough for new users
- **Helpful Empty States**: Encouraging messaging guides you through first use
- **Help Button**: Always accessible tutorial re-launch from header

### 📲 Quick Sharing
- **WhatsApp Integration**: Share rotation plans instantly with parents and coaches
- **Formatted Messages**: Clean, readable format includes all game assignments and stats
- **Copy-to-Clipboard**: Fallback option for desktop users

### ✨ Delightful Details
- **Completion Celebration**: Toast notification when your rotation is fully balanced
- **Hover Effects**: Subtle visual feedback on interactive elements
- **Subtle Watermark**: Trojans RFC logo faintly visible in grid background
- **Smooth Animations**: Professional transitions throughout

## Quick Start

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How It Works

1. **Add Your Squad**: Enter player names and select their experience level
2. **Build Rotations**: Click grid cells to assign players to game halves
3. **Check Balance**: Monitor experience mix and playing time distribution
4. **Share**: Send your rotation plan via WhatsApp or copy to clipboard

## RFU Compliance

- **Minimum Playing Time**: 50% rule automatically tracked (minimum halves calculated per squad size)
- **Fair Distribution**: Visual indicators show when players are below, at, or above fair share
- **8-Player Standard**: Hard limit enforced for U7-U18 age groups

## Configuration

- **Games**: 3-8 games per festival (default: 5)
- **Age Groups**: U7, U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18
- **Players on Field**: Auto-configured per age group (U7-U18 = 8 players)

## Data Storage

All data is stored in your browser's localStorage:
- **Squad rosters**: Persist between sessions
- **Game assignments**: Automatically saved
- **Tutorial status**: Remember if you've completed the walkthrough

**Note**: Clearing browser data will reset the app. Use the "New Festival" button to clear assignments while keeping your squad.

## Development

Built with:
- **Vite**: Lightning-fast HMR and build tool
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **shadcn-ui**: Beautiful, accessible components
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Consistent iconography

## Deployment

This project is deployed via [Lovable](https://lovable.dev/projects/85439aaf-2942-47b5-bb0e-f9d395f63df6).

Push to GitHub and Lovable auto-deploys to production.

## License

Built for Trojans RFC with ❤️ by Wayne
