// src/api/contexts/PedidosAtivosContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import api from '../api'; // Certifique-se de que o caminho para o seu axios instance está correto
import { useAuthLoja } from './AuthLojaContext'; // Importe o contexto de autenticação da loja

interface PedidosAtivosContextData {
  pedidosPendentesCount: number;
  fetchPedidosPendentesCount: () => Promise<void>; // Função para recarregar a contagem
  setPedidosPendentesCount: (count: number) => void; // Função para atualizar a contagem manualmente
}

const PedidosAtivosContext = createContext<PedidosAtivosContextData>({} as PedidosAtivosContextData);

export const PedidosAtivosProvider = ({ children }: { children: ReactNode }) => {
  const { loja, loading: authLoading } = useAuthLoja(); // Obtém dados da loja e estado de carregamento do AuthLojaContext
  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // Função para buscar a contagem de pedidos pendentes do backend
  const fetchPedidosPendentesCount = useCallback(async () => {
    // Adicionado `isFetching` aqui para evitar chamadas múltiplas enquanto uma já está em andamento
    if (!loja?.id || authLoading || isFetching) { 
      return;
    }

    setIsFetching(true);
    try {
      const response = await api.get(`/lojas/${loja.id}/pedidos-pendentes-count`);
      setPedidosPendentesCount(response.data.count);
    } catch (error) {
      console.error("Erro ao buscar contagem de pedidos pendentes:", error);
      // Opcional: Alert.alert("Erro", "Não foi possível carregar a contagem de pedidos.");
    } finally {
      setIsFetching(false);
    }
  }, [loja?.id, authLoading]); // REMOVIDO isFetching das dependências

  // Efeito para buscar a contagem quando a loja estiver carregada ou quando o componente for montado
  useEffect(() => {
    if (loja?.id && !authLoading) {
      fetchPedidosPendentesCount();
      // Opcional: Atualizar a contagem a cada X segundos (polling)
      const interval = setInterval(fetchPedidosPendentesCount, 30000); // A cada 30 segundos
      return () => clearInterval(interval); // Limpa o intervalo ao desmontar
    }
  }, [loja?.id, authLoading, fetchPedidosPendentesCount]);

  return (
    <PedidosAtivosContext.Provider value={{ pedidosPendentesCount, fetchPedidosPendentesCount, setPedidosPendentesCount }}>
      {children}
    </PedidosAtivosContext.Provider>
  );
};

export const usePedidosAtivos = () => {
  return useContext(PedidosAtivosContext);
};
