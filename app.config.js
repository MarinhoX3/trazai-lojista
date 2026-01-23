import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  name: "TrazAi-Loja",
  slug: "traz-ai-lojista",
  scheme: "applojista",

  version: "1.0.0",

  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,

  icon: "./assets/images/icon.png",

  // --- CONFIGURAÇÃO DA SPLASH NATIVA ---
  // Esta imagem deve ser estática (geralmente apenas o logo centralizado)
  splash: {
  backgroundColor: "#ffffff",
  resizeMode: "contain",
},

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.adriano_marinho.trazailojista",
  },

  android: {
    package: "com.adriano_marinho.trazailojista",
    versionCode: 28,

    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },

    // Garante que a splash cubra a tela toda em Androids novos
    splash: {
  backgroundColor: "#ffffff",
  resizeMode: "contain",
},

    edgeToEdgeEnabled: true,
    googleServicesFile: "./google-services.json",

    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "whatsapp" }, { scheme: "https", host: "wa.me" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: [{ scheme: "applojista" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          buildToolsVersion: "35.0.0",
          kotlinVersion: "2.0.21",
        },
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "rgb(53, 237, 133)",
        androidCollapsedTitle: "TrazAí Loja",
      },
    ],
  ],

 extra: {
  router: {
    origin: "applojista://",
  },
  apiBaseUrl: "https://trazai.shop/api",
  assetBaseUrl: "https://trazai.shop",
  eas: {
    projectId: "09852f0c-9a00-455b-bbfc-c7de37bedf91",
  },
},


  owner: "adriano_marinho",
});