// src/api/contexts/AuthLojaContext.tsx

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import api, { ASSET_BASE_URL } from "../api";
import * as Linking from "expo-linking";

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

  loja_aberta_manual?: number | boolean;
  horarios_funcionamento?: {
    [dia: string]: {
      ativo: boolean;
      abre: string;
      fecha: string;
    };
  };
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

          const lojaNormalizada: AuthLoja = {
            ...lojaData,
            url_logo: lojaData.url_logo
              ? lojaData.url_logo.startsWith("http")
                ? lojaData.url_logo
                : `${ASSET_BASE_URL}/${lojaData.url_logo}`
              : null,
            raio_entrega_km:
              lojaData.raio_entrega_km != null
                ? Number(lojaData.raio_entrega_km)
                : undefined,
          };

          setLoja(lojaNormalizada);
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

  // Controle de rotas
  useEffect(() => {
    if (!navigationState?.key) return;
    if (loading) return;

    const currentRoute = segments.join("/");

    if (currentRoute.includes("+not-found")) return;
    if (currentRoute.includes("reset-password")) return;

    if (!loja) {
      if (!currentRoute.startsWith("(auth)")) {
        router.replace("/(auth)");
      }
      return;
    }

    if (!currentRoute.startsWith("(app)")) {
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [loading, loja, segments, navigationState]);

  // 🔹 Login
  const login = async (lojaData: AuthLoja, authToken: string) => {
    try {
      const lojaNormalizada: AuthLoja = {
        ...lojaData,
        url_logo: lojaData.url_logo
          ? lojaData.url_logo.startsWith("http")
            ? lojaData.url_logo
            : `${ASSET_BASE_URL}/${lojaData.url_logo}`
          : null,
        raio_entrega_km:
          lojaData.raio_entrega_km != null
            ? Number(lojaData.raio_entrega_km)
            : 0,
      };

      setLoja(lojaNormalizada);
      setToken(authToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      await AsyncStorage.setItem(
        "@AppLojista:loja",
        JSON.stringify(lojaNormalizada)
      );
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
      let updated: AuthLoja | null = null;

      setLoja((prev) => {
        if (!prev) return null;

        updated = {
          ...prev,
          ...updatedData,
          url_logo: updatedData.url_logo
            ? updatedData.url_logo.startsWith("http")
              ? updatedData.url_logo
              : `${ASSET_BASE_URL}/${updatedData.url_logo}`
            : prev.url_logo,
          loja_aberta_manual:
            updatedData.loja_aberta_manual !== undefined
              ? Boolean(updatedData.loja_aberta_manual)
              : prev.loja_aberta_manual,
          raio_entrega_km:
            updatedData.raio_entrega_km !== undefined
              ? Number(updatedData.raio_entrega_km)
              : prev.raio_entrega_km ?? 0,
        };

        AsyncStorage.setItem(
          "@AppLojista:loja",
          JSON.stringify(updated)
        );

        return updated;
      });

      return updated;
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
