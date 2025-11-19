// File: src/hooks/usePushNotifications.ts
import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "../api/api";
 // ✅ CORRETO

// =============================================================
// 🔔 CONFIGURAÇÃO DO HANDLER — mostra alertas, banners e sons
// =============================================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// =============================================================
// 1️⃣ FUNÇÃO PARA GERAR E ENVIAR O TOKEN AO BACKEND
// =============================================================
export async function registerForPushNotificationsAsync(id_loja: number) {
  let token: string | undefined;

  console.log("📌 Registrando push do lojista:", id_loja);
  console.log("📌 Project ID:", Constants.expoConfig?.extra?.eas?.projectId);

  if (!Device.isDevice) {
    console.warn("⚠ Push notifications só funcionam em dispositivo físico!");
    return;
  }

  // Pedir permissão
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("⚠ Permissão para notificações negada!");
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error("❌ Project ID não encontrado no app.json!");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("🔔 TOKEN EXPO OBTIDO:", token);
  } catch (error) {
    console.error("❌ Erro ao gerar token Expo:", error);
    return;
  }

  if (token) {
    try {
      await api.post(`/lojas/${id_loja}/push-token`, { token });
      console.log("✅ Token salvo com sucesso no backend.");
    } catch (error) {
      console.error("❌ Erro ao enviar token ao backend:", error);
    }
  }

  // Criar canal Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

// =============================================================
// 2️⃣ HOOK PRINCIPAL — responsável por LISTENERS
// =============================================================
export function usePushNotifications(id_loja: number | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification>();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const registeredId = useRef<number | null>(null); // 🔒 PROTEÇÃO REAL

  useEffect(() => {
    if (!id_loja) return;

    // 👇 EVITA registrar mais de 1 vez por ID de loja
    if (registeredId.current === id_loja) return;
    registeredId.current = id_loja;

    registerForPushNotificationsAsync(id_loja).then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 NOTIFICAÇÃO RECEBIDA:", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📲 AÇÃO DO USUÁRIO:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [id_loja]);

  return {
    expoPushToken,
    notification,
  };
}
