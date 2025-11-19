import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "../api/api";

// 🔔 CONFIG DO HANDLER (Android 13+ precisa disto)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


// ==========================================================
// 🔹 Função responsável por registrar e enviar token ao backend
// ==========================================================
async function registerForPushNotificationsAsync(id_loja: number) {
  let token: string | undefined;

  console.log("📌 (DEBUG) Registrando push do lojista:", id_loja);
  console.log("📌 Project ID:", Constants.expoConfig?.extra?.eas?.projectId);

  if (!Device.isDevice) {
    console.warn("⚠ Push notifications só funcionam em dispositivo físico!");
    return;
  }

  // Pedido de permissão
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

  // Envia token ao backend
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

// ==========================================================
// HOOK PRINCIPAL
// ==========================================================
export function usePushNotifications(id_loja: number | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] =
    useState<Notifications.Notification>();

const notificationListener = useRef<Notifications.EventSubscription | null>(null);
const responseListener = useRef<Notifications.EventSubscription | null>(null);


  const alreadyRegistered = useRef(false);

  useEffect(() => {
    if (!id_loja) return; // Evita undefined

    if (alreadyRegistered.current) return; // Evita duplicidade
    alreadyRegistered.current = true;

    // Registrar token
    registerForPushNotificationsAsync(id_loja).then((token) =>
      setExpoPushToken(token)
    );

    // Listener quando receber notificação
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 NOTIFICAÇÃO RECEBIDA:", notification);
        setNotification(notification);
      });

    // Listener quando o usuário toca na notificação
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
