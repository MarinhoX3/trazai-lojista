// src/api/contexts/AuthLojaContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

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

const AuthLojaContext = createContext<AuthLojaContextData>(
  {} as AuthLojaContextData
);

export const AuthLojaProvider = ({ children }: { children: ReactNode }) => {
  const [loja, setLoja] = useState<AuthLoja | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // 🔹 Carrega login do AsyncStorage
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedLoja = await AsyncStorage.getItem("@AppLojista:loja");
        const storedToken = await AsyncStorage.getItem("@AppLojista:token");

        if (storedLoja && storedToken) {
          const lojaData: AuthLoja = JSON.parse(storedLoja);
          setLoja(lojaData);
          setToken(storedToken);

          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error("Erro ao carregar autenticação:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  // 🔹 Controle de rotas
  useEffect(() => {
    if (!navigationState?.key) return;

    const currentGroup = segments[0];

    if (loading) return;

    if (!loja) {
      if (currentGroup !== "(auth)") router.replace("/(auth)");
      return;
    }

    if (currentGroup !== "(app)") {
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [loading, loja, segments, navigationState]);

  // 🔹 Login
  const login = async (lojaData: AuthLoja, authToken: string) => {
    try {
      setLoja(lojaData);
      setToken(authToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      await AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(lojaData));
      await AsyncStorage.setItem("@AppLojista:token", authToken);

      router.replace("/(app)/(tabs)/dashboard");
    } catch (err) {
      console.error("Erro no login:", err);
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      setLoja(null);
      setToken(null);

      delete api.defaults.headers.common["Authorization"];

      await AsyncStorage.removeItem("@AppLojista:loja");
      await AsyncStorage.removeItem("@AppLojista:token");

      router.replace("/(auth)");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  // 🔹 Atualiza dados da loja
  const updateAuthLoja = async (updatedData: Partial<AuthLoja>) => {
    try {
      setLoja((prev) => {
        if (!prev) return null;

        const newData = { ...prev, ...updatedData };
        AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(newData));
        return newData;
      });

      const stored = await AsyncStorage.getItem("@AppLojista:loja");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error("Erro ao atualizar loja na Auth:", err);
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

export const useAuthLoja = () => useContext(AuthLojaContext);
