import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from './AuthContext';
import {
  RealtimeEvents,
  CreateTransactionInput,
  TransferFundsInput,
  CreateThirdPartyInput,
  CreateProjectInput,
  CreateProjectItemInput,
  UpdateProjectItemInput,
} from '@cuentas/shared';

interface FinancialContextType {
  accounts: any[];
  transactions: any[];
  thirds: any[];
  projects: any[];
  stats: any | null;
  isOffline: boolean;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  toggleSettled: (id: string, isSettled: boolean) => Promise<void>;
  createTransaction: (data: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  transferFunds: (data: TransferFundsInput) => Promise<void>;
  createThird: (data: CreateThirdPartyInput) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<void>;
  createProjectItem: (data: CreateProjectItemInput) => Promise<void>;
  updateProjectItem: (itemId: string, data: UpdateProjectItemInput) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType>({} as FinancialContextType);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLocked } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [thirds, setThirds] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || isLocked) return;
    setIsLoading(true);

    try {
      const [accRes, txRes, thirdRes, projRes, statsRes] = await Promise.all([
        apiRequest<any[]>('/api/accounts', { cacheKey: 'accounts' }),
        apiRequest<any[]>('/api/transactions', { cacheKey: 'transactions' }),
        apiRequest<any[]>('/api/thirds', { cacheKey: 'thirds' }),
        apiRequest<any[]>('/api/projects', { cacheKey: 'projects' }),
        apiRequest<any>('/api/stats/dashboard', { cacheKey: 'stats' }),
      ]);

      setAccounts(accRes.data || []);
      setTransactions(txRes.data || []);
      setThirds(thirdRes.data || []);
      setProjects(projRes.data || []);
      setStats(statsRes.data || null);

      setIsOffline(accRes.isOffline || txRes.isOffline);
    } catch (e) {
      console.warn('Error refrescando datos financieros:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isLocked]);

  useEffect(() => {
    if (isAuthenticated && !isLocked) {
      refreshAll();
    }
  }, [isAuthenticated, isLocked, refreshAll]);

  // Suscripción a eventos en tiempo real vía Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTransactionSettled = (updatedTx: any) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? { ...t, ...updatedTx } : t))
      );
      // Refrescar estadísticas en tiempo real
      apiRequest<any>('/api/stats/dashboard', { cacheKey: 'stats' }).then((res) => {
        setStats(res.data);
      });
    };

    const handleTransactionCreated = (newTx: any) => {
      setTransactions((prev) => [newTx, ...prev]);
      refreshAll();
    };

    const handleTransactionDeleted = ({ id }: { id: string }) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      refreshAll();
    };

    const handleAccountUpdated = () => {
      apiRequest<any[]>('/api/accounts', { cacheKey: 'accounts' }).then((res) => {
        setAccounts(res.data);
      });
    };

    const handleProjectItemUpdated = () => {
      apiRequest<any[]>('/api/projects', { cacheKey: 'projects' }).then((res) => {
        setProjects(res.data);
      });
    };

    socket.on(RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, handleTransactionSettled);
    socket.on(RealtimeEvents.TRANSACTION_CREATED, handleTransactionCreated);
    socket.on(RealtimeEvents.TRANSACTION_DELETED, handleTransactionDeleted);
    socket.on(RealtimeEvents.ACCOUNT_UPDATED, handleAccountUpdated);
    socket.on(RealtimeEvents.PROJECT_ITEM_UPDATED, handleProjectItemUpdated);
    socket.on(RealtimeEvents.DASHBOARD_STATS_UPDATED, () => refreshAll());

    return () => {
      socket.off(RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, handleTransactionSettled);
      socket.off(RealtimeEvents.TRANSACTION_CREATED, handleTransactionCreated);
      socket.off(RealtimeEvents.TRANSACTION_DELETED, handleTransactionDeleted);
      socket.off(RealtimeEvents.ACCOUNT_UPDATED, handleAccountUpdated);
      socket.off(RealtimeEvents.PROJECT_ITEM_UPDATED, handleProjectItemUpdated);
      socket.off(RealtimeEvents.DASHBOARD_STATS_UPDATED);
    };
  }, [refreshAll]);

  const toggleSettled = async (id: string, isSettled: boolean) => {
    // 1. Optimistic Update inmediato
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isSettled } : t))
    );

    try {
      await apiRequest(`/api/transactions/${id}/settle`, {
        method: 'PATCH',
        body: { isSettled },
      });
    } catch (e) {
      // Revertir si falló
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isSettled: !isSettled } : t))
      );
      throw e;
    }
  };

  const createTransaction = async (data: CreateTransactionInput) => {
    await apiRequest('/api/transactions', { method: 'POST', body: data });
    await refreshAll();
  };

  const deleteTransaction = async (id: string) => {
    await apiRequest(`/api/transactions/${id}`, { method: 'DELETE' });
    await refreshAll();
  };

  const transferFunds = async (data: TransferFundsInput) => {
    await apiRequest('/api/accounts/transfer', { method: 'POST', body: data });
    await refreshAll();
  };

  const createThird = async (data: CreateThirdPartyInput) => {
    await apiRequest('/api/thirds', { method: 'POST', body: data });
    await refreshAll();
  };

  const createProject = async (data: CreateProjectInput) => {
    await apiRequest('/api/projects', { method: 'POST', body: data });
    await refreshAll();
  };

  const createProjectItem = async (data: CreateProjectItemInput) => {
    await apiRequest('/api/projects/items', { method: 'POST', body: data });
    await refreshAll();
  };

  const updateProjectItem = async (itemId: string, data: UpdateProjectItemInput) => {
    await apiRequest(`/api/projects/items/${itemId}`, { method: 'PATCH', body: data });
    await refreshAll();
  };

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        transactions,
        thirds,
        projects,
        stats,
        isOffline,
        isLoading,
        refreshAll,
        toggleSettled,
        createTransaction,
        deleteTransaction,
        transferFunds,
        createThird,
        createProject,
        createProjectItem,
        updateProjectItem,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => useContext(FinancialContext);
