import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- IMPORTANTE
import api from '../api/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(id_loja: number) {
  let token;

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // pega o token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  return token;
}

export function usePushNotifications(id_loja: number | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!id_loja) return;

    async function setup() {
      // ✔️ Verifica se já salvou token antes
      const savedToken = await AsyncStorage.getItem('@push_token');

      // ✔️ Registra um novo token
      const token = await registerForPushNotificationsAsync(id_loja);
      if (!token) return;

      setExpoPushToken(token);

      // ✔️ Se já existia e é igual → NÃO SALVA NO BACKEND DE NOVO
      if (savedToken === token) return;

      // ✔️ SALVA APENAS UMA VEZ
      try {
        await api.post(`/lojas/${id_loja}/push-token`, { token });
        console.log('Token salvo 1x no backend');
        await AsyncStorage.setItem('@push_token', token);
      } catch (e) {
        console.log('Erro ao salvar token:', e);
      }
    }

    setup();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {}
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {}
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [id_loja]);

  return {
    expoPushToken,
  };
}
