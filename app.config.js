const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? 'FlowDay (Dev)' : 'FlowDay',
    slug: 'flowday',
    version: '1.6.0',
    orientation: 'portrait',
    icon: './assets/flowday-icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'flowday',
    splash: {
      image: './assets/flowday-onboard.png',
      resizeMode: 'contain',
      backgroundColor: '#4f46e5',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.yourcompany.flowday.dev' : 'com.yourcompany.flowday',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/flowday-icon.png',
        backgroundColor: '#4f46e5',
      },
      package: IS_DEV ? 'com.yourcompany.flowday.dev' : 'com.yourcompany.flowday',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/flowday-icon.png',
          color: '#4f46e5',
          androidMode: 'default',
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: '7269b3a1-ce37-48d5-b7e8-ca9371a2620c',
      },
    },
  },
};
