import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Keep equal to PRODUCT_BUNDLE_IDENTIFIER in ios/App/App.xcodeproj/project.pbxproj.
  appId: 'io.github.fletcherwerner.trainmetosing',
  appName: 'Train Me To Sing',
  webDir: 'dist',
};

export default config;
