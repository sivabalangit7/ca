import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calorietracker.app',
  appName: 'Calorie Tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
