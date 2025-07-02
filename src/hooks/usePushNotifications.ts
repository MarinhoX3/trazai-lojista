import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../api/api';

// --- AQUI ESTÁ A CORREÇÃO ---
// A propriedade 'shouldShowAlert' foi substituída pelas novas propriedades
// para garantir compatibilidade com as versões mais recentes da biblioteca.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // Nova propriedade
    shouldShowList: true,   // Nova propriedade
  }),
});

async function registerForPushNotificationsAsync(id_loja: number) {
  let token;

  if (!Device.isDevice) {
    alert('As notificações push só funcionam em dispositivos físicos.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Falha ao obter o token para notificações push! A permissão não foi concedida.');
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        throw new Error('Project ID não encontrado na configuração do app.');
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    console.error("Erro ao obter o push token:", e);
    return;
  }
  
  if (token) {
    try {
        await api.post(`/lojas/${id_loja}/push-token`, { token });
        console.log("Token de notificação salvo com sucesso no backend.");
    } catch (error) {
        console.error("Erro ao enviar o token para o backend:", error);
    }
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export function usePushNotifications(id_loja: number | undefined) {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        if (id_loja) {
            registerForPushNotificationsAsync(id_loja).then(token => setExpoPushToken(token));
        }

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            if(notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if(responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [id_loja]);

    return {
        expoPushToken,
        notification,
    };
}
