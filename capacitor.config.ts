import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cps.trackinglocation',
  appName: 'Tracking Location',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;