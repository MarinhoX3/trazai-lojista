import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define o formato do objeto da loja logada
interface AuthLoja {
  id: number;
  nome_loja: string;
  email_login: string;
  // Adicione outras propriedades que você queira ter acesso global
}

// ATUALIZAÇÃO 1: Adicionamos a nova função à interface do contexto
interface AuthLojaContextData {
  loja: AuthLoja | null;
  login: (lojaData: AuthLoja) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateLojaContext: (updatedData: Partial<AuthLoja>) => Promise<void>; // Função adicionada
}

const AuthLojaContext = createContext<AuthLojaContextData>({} as AuthLojaContextData);

export const AuthLojaProvider = ({ children }: { children: ReactNode }) => {
  const [loja, setLoja] = useState<AuthLoja | null>(null);
  const [loading, setLoading] = useState(true);

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
    setLoja(null);
    await AsyncStorage.removeItem('@AppLojista:loja');
  };

  // ATUALIZAÇÃO 2: Implementamos a função que atualiza os dados da loja
  const updateLojaContext = async (updatedData: Partial<AuthLoja>) => {
    setLoja(prevLoja => {
      if (!prevLoja) return null;
      const newLojaState = { ...prevLoja, ...updatedData };
      // Atualizamos também o armazenamento local para manter a consistência
      AsyncStorage.setItem('@AppLojista:loja', JSON.stringify(newLojaState));
      return newLojaState;
    });
  };

  // ATUALIZAÇÃO 3: Disponibilizamos a nova função para o resto da aplicação
  return (
    <AuthLojaContext.Provider value={{ loja, login, logout, loading, updateLojaContext }}>
      {children}
    </AuthLojaContext.Provider>
  );
};

export const useAuthLoja = () => {
  return useContext(AuthLojaContext);
};
