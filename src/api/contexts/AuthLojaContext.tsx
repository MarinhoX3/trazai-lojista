import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import api from "../api";

// 🏪 Tipo principal da loja logada
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
  raio_entrega_km?: number; // ✅ campo novo
}

// 🧭 O que o contexto fornece
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

  // 🔔 Inicializa push notifications se a loja estiver logada
  usePushNotifications(loja?.id);

  // 🔹 Carrega dados do AsyncStorage quando o app inicia
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

  // 🔑 Login e persistência
  const login = async (lojaData: AuthLoja, authToken: string) => {
    setLoja(lojaData);
    setToken(authToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    await AsyncStorage.setItem("@AppLojista:loja", JSON.stringify(lojaData));
    await AsyncStorage.setItem("@AppLojista:token", authToken);
  };

  // 🚪 Logout total
  const logout = async () => {
    setLoja(null);
    setToken(null);
    delete api.defaults.headers.common["Authorization"];

    await AsyncStorage.removeItem("@AppLojista:loja");
    await AsyncStorage.removeItem("@AppLojista:token");
  };

  // 🔄 Atualiza parcialmente os dados da loja
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

// 🔗 Hook para consumir o contexto
export const useAuthLoja = (): AuthLojaContextData => {
  const context = useContext(AuthLojaContext);
  if (!context)
    throw new Error("useAuthLoja deve ser usado dentro de AuthLojaProvider");
  return context;
};
