import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { useAuthLoja } from './AuthLojaContext';

interface PedidosAtivosContextData {
  pedidosPendentesCount: number;
  fetchPedidosPendentesCount: () => Promise<void>;
  setPedidosPendentesCount: (count: number) => void;
}

const PedidosAtivosContext = createContext<PedidosAtivosContextData>({} as PedidosAtivosContextData);

export const PedidosAtivosProvider = ({ children }: { children: ReactNode }) => {
  const { loja, loading: authLoading } = useAuthLoja();
  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const isFetchingRef = useRef(false);

  const fetchPedidosPendentesCount = useCallback(async () => {
    if (!loja?.id || authLoading || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const response = await api.get(`/lojas/${loja.id}/pedidos-pendentes-count`);
      setPedidosPendentesCount(response.data.count);
    } catch (error) {
      console.error("Erro ao buscar contagem de pedidos pendentes:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [loja?.id, authLoading]);

  useEffect(() => {
    if (loja?.id && !authLoading) {
      fetchPedidosPendentesCount();
      const interval = setInterval(fetchPedidosPendentesCount, 30000);
      return () => clearInterval(interval);
    }
  }, [loja?.id, authLoading, fetchPedidosPendentesCount]);

  return (
    <PedidosAtivosContext.Provider value={{ pedidosPendentesCount, fetchPedidosPendentesCount, setPedidosPendentesCount }}>
      {children}
    </PedidosAtivosContext.Provider>
  );
};

export const usePedidosAtivos = () => useContext(PedidosAtivosContext);
