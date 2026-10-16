import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from './AuthContext';
import {
  RealtimeEvents,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransferFundsInput,
  CreateThirdPartyInput,
  UpdateThirdPartyWithCodeInput,
  CreateProjectInput,
  CreateProjectItemInput,
  UpdateProjectItemInput,
  CreateAccountInput,
} from '@cuentas/shared';

interface AuditData {
  logs: any[];
  deletedTransactions: any[];
}

interface FinancialContextType {
  accounts: any[];
  transactions: any[];
  thirds: any[];
  projects: any[];
  stats: any | null;
  auditData: AuditData;
  isOffline: boolean;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  refreshAudit: () => Promise<void>;
  toggleSettled: (id: string, isSettled: boolean) => Promise<void>;
  createTransaction: (data: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string, masterCode: string, reason?: string) => Promise<void>;
  restoreTransaction: (id: string, masterCode: string) => Promise<void>;
  transferFunds: (data: TransferFundsInput) => Promise<void>;
  createAccount: (data: CreateAccountInput) => Promise<void>;
  adjustAccountBalance: (accountId: string, balance: number, masterCode: string, reason?: string) => Promise<void>;
  deleteAccount: (accountId: string, masterCode: string, reason?: string) => Promise<void>;
  createThird: (data: CreateThirdPartyInput) => Promise<void>;
  updateThird: (id: string, data: UpdateThirdPartyWithCodeInput) => Promise<void>;
  deleteThird: (id: string, masterCode: string, reason?: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<void>;
  deleteProject: (id: string, masterCode: string, reason?: string) => Promise<void>;
  createProjectItem: (data: CreateProjectItemInput) => Promise<void>;
  updateProjectItem: (itemId: string, data: UpdateProjectItemInput) => Promise<void>;
  deleteProjectItem: (itemId: string, masterCode: string, reason?: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType>({} as FinancialContextType);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLocked } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [thirds, setThirds] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [auditData, setAuditData] = useState<AuditData>({ logs: [], deletedTransactions: [] });
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAudit = useCallback(async () => {
    if (!isAuthenticated || isLocked) return;
    try {
      const res = await apiRequest<AuditData>('/api/audit', { cacheKey: 'audit' });
      if (res.data) {
        setAuditData({
          logs: res.data.logs || [],
          deletedTransactions: res.data.deletedTransactions || [],
        });
      }
    } catch (e) {
      // Silencioso si está offline
    }
  }, [isAuthenticated, isLocked]);

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
      refreshAudit();
    } catch (e) {
      console.warn('Error refrescando datos financieros:', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isLocked, refreshAudit]);

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
      apiRequest<any>('/api/stats/dashboard', { cacheKey: 'stats' }).then((res) => {
        setStats(res.data);
      });
    };

    const handleTransactionCreated = (newTx: any) => {
      setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
      refreshAll();
    };

    const handleTransactionUpdated = (updatedTx: any) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? { ...t, ...updatedTx } : t))
      );
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

    const handleAuditLogCreated = () => {
      refreshAudit();
    };

    socket.on(RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, handleTransactionSettled);
    socket.on(RealtimeEvents.TRANSACTION_CREATED, handleTransactionCreated);
    socket.on(RealtimeEvents.TRANSACTION_UPDATED, handleTransactionUpdated);
    socket.on(RealtimeEvents.TRANSACTION_DELETED, handleTransactionDeleted);
    socket.on(RealtimeEvents.ACCOUNT_UPDATED, handleAccountUpdated);
    socket.on(RealtimeEvents.PROJECT_ITEM_UPDATED, handleProjectItemUpdated);
    socket.on(RealtimeEvents.AUDIT_LOG_CREATED, handleAuditLogCreated);
    socket.on(RealtimeEvents.DASHBOARD_STATS_UPDATED, () => refreshAll());

    return () => {
      socket.off(RealtimeEvents.TRANSACTION_SETTLED_TOGGLED, handleTransactionSettled);
      socket.off(RealtimeEvents.TRANSACTION_CREATED, handleTransactionCreated);
      socket.off(RealtimeEvents.TRANSACTION_UPDATED, handleTransactionUpdated);
      socket.off(RealtimeEvents.TRANSACTION_DELETED, handleTransactionDeleted);
      socket.off(RealtimeEvents.ACCOUNT_UPDATED, handleAccountUpdated);
      socket.off(RealtimeEvents.PROJECT_ITEM_UPDATED, handleProjectItemUpdated);
      socket.off(RealtimeEvents.AUDIT_LOG_CREATED, handleAuditLogCreated);
      socket.off(RealtimeEvents.DASHBOARD_STATS_UPDATED);
    };
  }, [refreshAll, refreshAudit]);

  const toggleSettled = async (id: string, isSettled: boolean) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isSettled } : t))
    );

    try {
      await apiRequest(`/api/transactions/${id}/settle`, {
        method: 'PATCH',
        body: { isSettled },
      });
    } catch (e) {
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

  const updateTransaction = async (id: string, data: UpdateTransactionInput) => {
    await apiRequest(`/api/transactions/${id}`, { method: 'PUT', body: data });
    await refreshAll();
  };

  const deleteTransaction = async (id: string, masterCode: string, reason?: string) => {
    await apiRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
      body: { masterCode, reason },
    });
    await refreshAll();
  };

  const restoreTransaction = async (id: string, masterCode: string) => {
    await apiRequest(`/api/audit/restore/${id}`, {
      method: 'POST',
      body: { masterCode },
    });
    await refreshAll();
  };

  const transferFunds = async (data: TransferFundsInput) => {
    await apiRequest('/api/accounts/transfer', { method: 'POST', body: data });
    await refreshAll();
  };

  const createAccount = async (data: CreateAccountInput) => {
    await apiRequest('/api/accounts', { method: 'POST', body: data });
    await refreshAll();
  };

  const adjustAccountBalance = async (
    accountId: string,
    balance: number,
    masterCode: string,
    reason?: string
  ) => {
    await apiRequest(`/api/accounts/${accountId}/balance`, {
      method: 'PATCH',
      body: { balance, masterCode, reason },
    });
    await refreshAll();
  };

  const deleteAccount = async (accountId: string, masterCode: string, reason?: string) => {
    await apiRequest(`/api/accounts/${accountId}`, {
      method: 'DELETE',
      body: { masterCode, reason },
    });
    await refreshAll();
  };

  const createThird = async (data: CreateThirdPartyInput) => {
    await apiRequest('/api/thirds', { method: 'POST', body: data });
    await refreshAll();
  };

  const updateThird = async (id: string, data: UpdateThirdPartyWithCodeInput) => {
    await apiRequest(`/api/thirds/${id}`, { method: 'PUT', body: data });
    await refreshAll();
  };

  const deleteThird = async (id: string, masterCode: string, reason?: string) => {
    await apiRequest(`/api/thirds/${id}`, {
      method: 'DELETE',
      body: { masterCode, reason },
    });
    await refreshAll();
  };

  const createProject = async (data: CreateProjectInput) => {
    await apiRequest('/api/projects', { method: 'POST', body: data });
    await refreshAll();
  };

  const deleteProject = async (id: string, masterCode: string, reason?: string) => {
    await apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
      body: { masterCode, reason },
    });
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

  const deleteProjectItem = async (itemId: string, masterCode: string, reason?: string) => {
    await apiRequest(`/api/projects/items/${itemId}`, {
      method: 'DELETE',
      body: { masterCode, reason },
    });
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
        auditData,
        isOffline,
        isLoading,
        refreshAll,
        refreshAudit,
        toggleSettled,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        restoreTransaction,
        transferFunds,
        createAccount,
        adjustAccountBalance,
        deleteAccount,
        createThird,
        updateThird,
        deleteThird,
        createProject,
        deleteProject,
        createProjectItem,
        updateProjectItem,
        deleteProjectItem,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => useContext(FinancialContext);
