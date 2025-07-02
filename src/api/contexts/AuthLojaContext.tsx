import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// --- PASSO 1: Importar o nosso novo hook de notificações ---
import { usePushNotifications } from '../../hooks/usePushNotifications';

// Define o formato do objeto da loja logada
interface AuthLoja {
  id: number;
  nome_loja: string;
  email_login: string;
}

// Define o que o contexto vai fornecer
interface AuthLojaContextData {
  loja: AuthLoja | null;
  login: (lojaData: AuthLoja) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateLojaContext: (updatedData: Partial<AuthLoja>) => Promise<void>;
}

const AuthLojaContext = createContext<AuthLojaContextData>({} as AuthLojaContextData);

export const AuthLojaProvider = ({ children }: { children: ReactNode }) => {
  const [loja, setLoja] = useState<AuthLoja | null>(null);
  const [loading, setLoading] = useState(true);

  // --- PASSO 2: Usar o nosso hook de notificações ---
  // O hook é ativado automaticamente sempre que o 'loja.id' estiver disponível,
  // ou seja, logo após o login.
  usePushNotifications(loja?.id);

  // Carrega os dados da loja do armazenamento local ao iniciar
  useEffect(() => {
    async function loadStorageData() {
      const storedLoja = await AsyncStorage.getItem('@AppLojista:loja');
      if (storedLoja) {
        setLoja(JSON.parse(storedLoja));
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  const login = async (lojaData: AuthLoja) => {
    setLoja(lojaData);
    await AsyncStorage.setItem('@AppLojista:loja', JSON.stringify(lojaData));
  };

  const logout = async () => {
    // Futuramente, aqui também podemos adicionar a lógica para remover o push token do backend
    setLoja(null);
    await AsyncStorage.removeItem('@AppLojista:loja');
  };

  const updateLojaContext = async (updatedData: Partial<AuthLoja>) => {
    setLoja(prevLoja => {
      if (!prevLoja) return null;
      const newLojaState = { ...prevLoja, ...updatedData };
      AsyncStorage.setItem('@AppLojista:loja', JSON.stringify(newLojaState));
      return newLojaState;
    });
  };

  return (
    <AuthLojaContext.Provider value={{ loja, login, logout, loading, updateLojaContext }}>
      {children}
    </AuthLojaContext.Provider>
  );
};

export const useAuthLoja = () => {
  return useContext(AuthLojaContext);
};
