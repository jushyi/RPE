# RPE -- Gym Workout Tracker

A React Native (Expo) workout tracking app for logging gym sessions, tracking personal records, and monitoring progress over time.

## Features

- Exercise library with built-in and custom exercises
- Workout plan creation with day-by-day scheduling
- Live workout logging with focus mode (one exercise at a time)
- Personal record (PR) tracking and celebration
- Body metrics tracking (weight, chest, waist, hips measurements)
- Progress dashboard with charts and trends
- Workout alarm and reminder notifications
- Offline-first with cloud sync

## Tech Stack

- React Native with Expo SDK 55
- TypeScript
- Supabase (PostgreSQL database, authentication, real-time sync)
- Zustand + MMKV for state management and local persistence
- Expo Router (file-based routing)

## Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/jushyi/RPE.git
   cd RPE
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:

   ```bash
   npx expo start
   ```
