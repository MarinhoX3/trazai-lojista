import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const segments = useSegments(); // para identificar qual grupo estamos "(auth)" ou "(tabs)"
  const navigationState = useRootNavigationState(); // só navega quando o router estiver pronto

  // 🔥 1. Carregar login do AsyncStorage no início
 useEffect(() => {
  if (!navigationState?.key) return;

  const group = segments[0]; // "(auth)" ou "(app)"

  if (loading) return;

  // 👉 Não autenticado
  if (!loja) {
    if (group !== "(auth)") {
      router.replace("/(auth)");
    }
    return;
  }

  // 👉 Autenticado
  if (loja) {
    // Se está no grupo errado (ex: "(auth)") → envia para as tabs
    if (group !== "(app)") {
      router.replace("/(app)/(tabs)");
    }
    return;
  }
}, [loading, loja, segments, navigationState]);

  // 🔥 2. Route Guard — evita logout automático ao minimizar o app
  useEffect(() => {
    if (!navigationState || !navigationState.key) return; // só navega quando o router estiver pronto

    const inAuthGroup = segments[0] === "(auth)";

    if (loading) return; // ainda carregando AsyncStorage → NÃO navegar

    if (!loja && !inAuthGroup) {
      router.replace("(auth)"); // não autenticado → vai para login
    } else if (loja && inAuthGroup) {
      router.replace("(tabs)"); // autenticado → vai para home
    }
  }, [loading, loja, segments, navigationState]);


  // 🔥 3. Fazer login
  const login = async (lojaData: AuthLoja, authToken: string) => {
    setLoja(lojaData);
    setToken(authToken);

    api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    await AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(lojaData));
    await AsyncStorage.setItem("@AppLojista:token", authToken);
  };

  // 🔥 4. Logout
  const logout = async () => {
    setLoja(null);
    setToken(null);

    delete api.defaults.headers.common["Authorization"];

    await AsyncStorage.removeItem("@AppLojista:loja");
    await AsyncStorage.removeItem("@AppLojista:token");

    router.replace("(auth)");
  };

  // 🔥 5. Atualizar dados da loja e sincronizar com storage
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
