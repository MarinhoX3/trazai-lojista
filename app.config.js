import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  name: "TrazAi-Loja",
  slug: "traz-ai-lojista",
  scheme: "applojista",

  version: "1.0.3",

  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,

  icon: "./assets/images/icon.png",

  splash: {
    backgroundColor: "#ffffff",
    resizeMode: "contain",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.trazai.lojista",

    infoPlist: {
      NSCameraUsageDescription:
        "Usamos a câmera para tirar a foto do produto.",
      NSPhotoLibraryUsageDescription:
        "Usamos suas fotos para selecionar a imagem do produto.",
    },
  },

  android: {
  package: "com.adriano_marinho.trazailojista",
  versionCode: 31,

    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
    ],

    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },

    splash: {
      backgroundColor: "#ffffff",
      resizeMode: "contain",
    },

    edgeToEdgeEnabled: true,

    googleServicesFile: "./google-services.json",

    intentFilters: [
      {
        action: "VIEW",
        data: [
          { scheme: "whatsapp" },
          { scheme: "https", host: "wa.me" }
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: [
          { scheme: "applojista" }
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  notification: {
    icon: "./assets/images/notification-icon.png",
    color: "#3BDB50",
    androidMode: "default",
    androidCollapsedTitle: "TrazAí Loja",
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
        color: "#3EE386",
        androidCollapsedTitle: "TrazAí Loja",
      },
    ],

    [
      "expo-image-picker",
      {
        cameraPermission:
          "Precisamos da câmera para tirar a foto do produto.",
        photosPermission:
          "Precisamos acessar suas fotos para escolher a imagem do produto.",
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