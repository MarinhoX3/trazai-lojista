//AuthLojaContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import api from '../api'; // Importamos a instância do axios

// Define o formato do objeto da loja logada
interface AuthLoja {
  id: number;
  nome_loja: string;
  email_login: string;
  // Adicione outras propriedades da loja que você queira ter acesso fácil
  taxa_entrega?: number; // NOVO: Adicionamos a taxa_entrega à interface
}

// Define o que o contexto vai fornecer
interface AuthLojaContextData {
  loja: AuthLoja | null;
  token: string | null; // NOVO: Adicionamos o token aqui
  login: (lojaData: AuthLoja, token: string) => Promise<void>; // MUDANÇA: A função de login agora também recebe o token
  logout: () => Promise<void>;
  loading: boolean;
  updateAuthLoja: (updatedData: Partial<AuthLoja>) => Promise<void>; // CORREÇÃO: Renomeado para updateAuthLoja
}

const AuthLojaContext = createContext<AuthLojaContextData>({} as AuthLojaContextData);

export const AuthLojaProvider = ({ children }: { children: ReactNode }) => {
  const [loja, setLoja] = useState<AuthLoja | null>(null);
  const [token, setToken] = useState<string | null>(null); // NOVO: Criamos um estado para guardar o token
  const [loading, setLoading] = useState(true);

  usePushNotifications(loja?.id);

  // Carrega os dados da loja e o token do armazenamento local ao iniciar
  useEffect(() => {
    async function loadStorageData() {
      const storedLoja = await AsyncStorage.getItem('@AppLojista:loja');
      const storedToken = await AsyncStorage.getItem('@AppLojista:token'); // NOVO: Carregamos o token guardado

      if (storedLoja && storedToken) {
        setLoja(JSON.parse(storedLoja));
        setToken(storedToken);
        // NOVO: Configuramos o token no cabeçalho do axios
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      setLoading(false);
    }
    loadStorageData();
  }, []);

  const login = async (lojaData: AuthLoja, authToken: string) => {
    setLoja(lojaData);
    setToken(authToken); // NOVO: Guardamos o token no estado
    
    // NOVO: Configuramos o token no cabeçalho do axios para todas as futuras requisições
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Guardamos ambos no armazenamento local
    await AsyncStorage.setItem('@AppLojista:loja', JSON.stringify(lojaData));
    await AsyncStorage.setItem('@AppLojista:token', authToken);
  };

  const logout = async () => {
    setLoja(null);
    setToken(null); // NOVO: Limpamos o token do estado
    
    // NOVO: Removemos o token do cabeçalho do axios
    delete api.defaults.headers.common['Authorization'];
    
    // Removemos ambos do armazenamento local
    await AsyncStorage.removeItem('@AppLojista:loja');
    await AsyncStorage.removeItem('@AppLojista:token');
  };

  // CORREÇÃO: Renomeado de updateLojaContext para updateAuthLoja
  const updateAuthLoja = async (updatedData: Partial<AuthLoja>) => {
    setLoja(prevLoja => {
      if (!prevLoja) return null;
      const newLojaState = { ...prevLoja, ...updatedData };
      AsyncStorage.setItem('@AppLojista:loja', JSON.stringify(newLojaState));
      return newLojaState;
    });
  };

  return (
    // NOVO: Fornecemos o token para todo o aplicativo
    // CORREÇÃO: Fornecer updateAuthLoja no contexto
    <AuthLojaContext.Provider value={{ loja, token, login, logout, loading, updateAuthLoja }}>
      {children}
    </AuthLojaContext.Provider>
  );
};

export const useAuthLoja = () => {
  return useContext(AuthLojaContext);
};
