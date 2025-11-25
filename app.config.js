import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  name: "TrazAi Loja",
  slug: "traz-ai-lojista",

  extra: {
    ...config.extra, // 👈 mantém tudo que está no app.json
  },

  notification: {
    icon: "./assets/images/notification-icon.png",
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
    googleServicesFile: "./google-services.json",
    useNextNotificationsApi: true,
    permissions: [
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.VIBRATE",
      "android.permission.POST_NOTIFICATIONS"
    ]
  }
});
