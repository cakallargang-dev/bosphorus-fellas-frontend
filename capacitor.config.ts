import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mancave.app',
  appName: 'ManCave',
  webDir: 'out',
  server: {
    url: 'https://bosphorus-fellas-frontend-production.up.railway.app',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
