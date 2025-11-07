import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "TrazAi Loja",
  slug: "traz-ai-lojista",

  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    assetBaseUrl: process.env.ASSET_BASE_URL,
    eas: {
      projectId: '09852f0c-9a00-455b-bbfc-c7de37bedf91'
    }
  },

  notification: {
    icon: "./assets/images/notification-icon.png", // 👈 força o uso do ícone branco
    color: "#0B7709",
    androidMode: "default",
    androidCollapsedTitle: "TrazAí Loja"
  },

  plugins: [
    ...(config.plugins || []),
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#0B7709",
        androidCollapsedTitle: "TrazAí Loja"
      }
    ]
  ],

  android: {
    ...config.android,
    package: "com.adriano_marinho.trazailojista",
    googleServicesFile: "./google-services.json",
    useNextNotificationsApi: true,
    permissions: [
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.POST_NOTIFICATIONS"
    ],
  },
});
