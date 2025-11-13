import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import api from "../api";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";

export interface AuthLoja {
  id: number;
  nome_loja: string;
  email_login: string;
  endereco_loja?: string;
  telefone_contato?: string;
  categoria?: string;
  taxa_entrega?: number;
  url_logo?: string | null;
  push_token?: string | null;
  raio_entrega_km?: number;
}

interface AuthLojaContextData {
  loja: AuthLoja | null;
  token: string | null;
  loading: boolean;
  login: (lojaData: AuthLoja, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAuthLoja: (updatedData: Partial<AuthLoja>) => Promise<AuthLoja | null>;
}

const AuthLojaContext = createContext<AuthLojaContextData>({} as AuthLojaContextData);

export const AuthLojaProvider = ({ children }: { children: ReactNode }) => {
  const [loja, setLoja] = useState<AuthLoja | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  usePushNotifications(loja?.id);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedLoja = await AsyncStorage.getItem("@AppLojista:loja");
        const storedToken = await AsyncStorage.getItem("@AppLojista:token");

        if (storedLoja && storedToken) {
          const parsedLoja: AuthLoja = JSON.parse(storedLoja);
          setLoja(parsedLoja);
          setToken(storedToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados do AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // 🔹 Redirecionamento automático
 useEffect(() => {
  if (!navigationState?.key || loading) return;

  const inAuthGroup = segments[0] === "(auth)";
  const inTabsGroup = segments[0] === "(tabs)";

  // Usuário deslogado → força ir para login
  if (!loja && !inAuthGroup) {
    router.replace("/login");
    return;
  }

  // Usuário logado tentando acessar telas de login → manda pro app
  if (loja && inAuthGroup) {
    router.replace("/(tabs)");
    return;
  }
}, [loja, segments, navigationState?.key, loading]);


  const login = async (lojaData: AuthLoja, authToken: string) => {
    setLoja(lojaData);
    setToken(authToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    await AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(lojaData));
    await AsyncStorage.setItem("@AppLojista:token", authToken);
  };

  const logout = async () => {
    setLoja(null);
    setToken(null);
    delete api.defaults.headers.common["Authorization"];
    await AsyncStorage.removeItem("@AppLojista:loja");
    await AsyncStorage.removeItem("@AppLojista:token");
    router.replace("/login");
  };

  const updateAuthLoja = async (
    updatedData: Partial<AuthLoja>
  ): Promise<AuthLoja | null> => {
    try {
      setLoja((prev) => {
        if (!prev) return null;
        const newLojaState = { ...prev, ...updatedData };
        AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(newLojaState));
        return newLojaState;
      });

      const storedLoja = await AsyncStorage.getItem("@AppLojista:loja");
      return storedLoja ? JSON.parse(storedLoja) : null;
    } catch (error) {
      console.error("❌ Erro ao atualizar dados da loja:", error);
      return loja;
    }
  };

  return (
    <AuthLojaContext.Provider
      value={{ loja, token, loading, login, logout, updateAuthLoja }}
    >
      {children}
    </AuthLojaContext.Provider>
  );
};

export const useAuthLoja = (): AuthLojaContextData => {
  const context = useContext(AuthLojaContext);
  if (!context)
    throw new Error("useAuthLoja deve ser usado dentro de AuthLojaProvider");
  return context;
};
