// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "TrazAi Loja",
  slug: "trazai-loja",

  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    assetBaseUrl: process.env.ASSET_BASE_URL,
    eas: {
      projectId: '09852f0c-9a00-455b-bbfc-c7de37bedf91'
    }
  },

  plugins: [
    ...(config.plugins || []),
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#DC2626"
      }
    ]
  ],

  android: {
    ...config.android,
    package: "com.adriano_marinho.trazailojista",
    googleServicesFile: "./google-services.json", // ✅ Caminho correto
    useNextNotificationsApi: true,
    permissions: [
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.POST_NOTIFICATIONS"
    ],
  },
});
