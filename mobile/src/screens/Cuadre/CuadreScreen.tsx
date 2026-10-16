import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { CuadreSummaryCard } from '../../components/CuadreSummaryCard';
import { TransactionItem } from '../../components/TransactionItem';
import { NewTransactionModal } from './NewTransactionModal';
import { CreatorCodeModal } from '../../components/CreatorCodeModal';
import { AuditModal } from '../../components/AuditModal';
import { useFinancial } from '../../context/FinancialContext';

export const CuadreScreen: React.FC = () => {
  const { transactions, stats, isLoading, refreshAll, toggleSettled, deleteTransaction } =
    useFinancial();
  const [filter, setFilter] = useState<'pending' | 'settled' | 'all'>('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'pending') return !t.isSettled;
    if (filter === 'settled') return t.isSettled;
    return true;
  });

  const handleOpenNew = () => {
    setEditingTx(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            tintColor={Colors.accentGold}
          />
        }
      >
        {/* Cabecera del Cuadre */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>CUADRE DIARIO</Text>
            <Text style={styles.headerSubtitle}>Control de Flujo, Edición & Auditoría</Text>
          </View>
          <TouchableOpacity
            style={styles.auditBtn}
            onPress={() => setAuditModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={16} color={Colors.accentGold} />
            <Text style={styles.auditBtnText}>Bitácora</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen Superior */}
        <CuadreSummaryCard
          pendingIncomes={stats?.cuadre?.pendingIncomes || 0}
          pendingExpenses={stats?.cuadre?.pendingExpenses || 0}
          cuadreNet={stats?.cuadre?.cuadreNet || 0}
          pendingCount={stats?.cuadre?.pendingCount || 0}
        />

        {/* Filtros Segmentados */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'pending' && styles.segmentBtnActive]}
            onPress={() => setFilter('pending')}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={filter === 'pending' ? Colors.bgDark : Colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                filter === 'pending' && styles.segmentTextActive,
              ]}
            >
              Pendientes ({stats?.cuadre?.pendingCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'settled' && styles.segmentBtnActive]}
            onPress={() => setFilter('settled')}
          >
            <Ionicons
              name="checkmark-done"
              size={14}
              color={filter === 'settled' ? Colors.bgDark : Colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                filter === 'settled' && styles.segmentTextActive,
              ]}
            >
              Saldados ({stats?.settled?.settledCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, filter === 'all' && styles.segmentBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.segmentText,
                filter === 'all' && styles.segmentTextActive,
              ]}
            >
              Todos ({transactions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listado de Transacciones */}
        <View style={styles.listContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No hay movimientos en esta sección</Text>
              <Text style={styles.emptySubtitle}>
                Presiona el botón dorado (+) para agregar ingresos o egresos al cuadre.
              </Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onToggleSettled={toggleSettled}
                onEdit={handleOpenEdit}
                onDelete={(item) => setDeletingTx(item)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Botón Flotante Agregar Movimiento (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenNew}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.bgDark} />
      </TouchableOpacity>

      {/* Modal Nuevo / Editar Movimiento */}
      <NewTransactionModal
        visible={modalVisible}
        editingTransaction={editingTx}
        onClose={() => {
          setModalVisible(false);
          setEditingTx(null);
        }}
      />

      {/* Modal Eliminar con Código Único de Programador */}
      <CreatorCodeModal
        visible={!!deletingTx}
        title="Eliminar Movimiento"
        subtitle={
          deletingTx
            ? `Se eliminará "${deletingTx.title}" ($${deletingTx.amountOriginal.toFixed(
                2
              )} ${deletingTx.currency}), se revertirá el saldo en la cuenta y quedará guardado en la Papelera de Auditoría BD.`
            : ''
        }
        actionLabel="Confirmar Eliminación"
        isDestructive
        onClose={() => setDeletingTx(null)}
        onConfirm={async (masterCode, reason) => {
          if (deletingTx) {
            await deleteTransaction(deletingTx.id, masterCode, reason);
          }
        }}
      />

      {/* Modal Bitácora de Auditoría */}
      <AuditModal
        visible={auditModalVisible}
        onClose={() => setAuditModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.accentGold,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  auditBtnText: {
    color: Colors.accentGold,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 61, 129, 0.15)',
    borderRadius: 12,
    padding: 4,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: Colors.accentGold,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.bgDark,
  },
  listContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
