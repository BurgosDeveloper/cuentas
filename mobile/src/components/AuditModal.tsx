import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useFinancial } from '../context/FinancialContext';
import { CreatorCodeModal } from './CreatorCodeModal';

interface AuditModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ visible, onClose }) => {
  const { auditData, refreshAudit, restoreTransaction } = useFinancial();
  const [tab, setTab] = useState<'logs' | 'deleted'>('logs');
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      refreshAudit();
    }
  }, [visible, refreshAudit]);

  const getActionMeta = (action: string) => {
    switch (action) {
      case 'DELETE':
        return { label: 'ELIMINACIÓN', color: Colors.danger, icon: 'trash-outline' };
      case 'UPDATE':
        return { label: 'EDICIÓN', color: '#38BDF8', icon: 'create-outline' };
      case 'BALANCE_ADJUST':
        return { label: 'AJUSTE SALDO', color: Colors.accentGold, icon: 'options-outline' };
      case 'TRANSFER':
        return { label: 'TRASPASO', color: '#A78BFA', icon: 'swap-horizontal-outline' };
      case 'RESTORE':
        return { label: 'RESTAURACIÓN', color: Colors.success, icon: 'refresh-circle-outline' };
      default:
        return { label: action, color: Colors.textSecondary, icon: 'shield-checkmark-outline' };
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.accentGold} />
              <View>
                <Text style={styles.title}>Bitácora de Auditoría BD</Text>
                <Text style={styles.subtitle}>
                  Registro inmutable de ediciones, saldos y eliminaciones
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'logs' && styles.tabBtnActive]}
              onPress={() => setTab('logs')}
            >
              <Ionicons
                name="list-outline"
                size={15}
                color={tab === 'logs' ? Colors.bgDark : Colors.textSecondary}
              />
              <Text style={[styles.tabText, tab === 'logs' && styles.tabTextActive]}>
                Historial ({auditData.logs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'deleted' && styles.tabBtnActive]}
              onPress={() => setTab('deleted')}
            >
              <Ionicons
                name="archive-outline"
                size={15}
                color={tab === 'deleted' ? Colors.bgDark : Colors.textSecondary}
              />
              <Text style={[styles.tabText, tab === 'deleted' && styles.tabTextActive]}>
                Papelera Segura ({auditData.deletedTransactions.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {tab === 'logs' ? (
              auditData.logs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="shield-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>Sin eventos de auditoría aún</Text>
                  <Text style={styles.emptyDesc}>
                    Cualquier modificación de saldo, edición o eliminación con el código de creador quedará fijada aquí con fecha y hora exacta.
                  </Text>
                </View>
              ) : (
                auditData.logs.map((log) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <View key={log.id} style={[styles.logCard, { borderLeftColor: meta.color }]}>
                      <View style={styles.logTopRow}>
                        <View style={[styles.badge, { backgroundColor: `${meta.color}20` }]}>
                          <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                          <Text style={[styles.badgeText, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(log.createdAt)}</Text>
                      </View>
                      <Text style={styles.logDesc}>{log.description}</Text>
                    </View>
                  );
                })
              )
            ) : auditData.deletedTransactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color={Colors.success} />
                <Text style={styles.emptyTitle}>Papelera vacía</Text>
                <Text style={styles.emptyDesc}>
                  Los movimientos eliminados se resguardan aquí en la base de datos para evitar pérdidas accidentales y pueden restaurarse en cualquier momento.
                </Text>
              </View>
            ) : (
              auditData.deletedTransactions.map((tx) => (
                <View key={tx.id} style={styles.deletedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deletedTitle}>{tx.title}</Text>
                    <Text style={styles.deletedMeta}>
                      {tx.type === 'INCOME' ? 'Ingreso' : 'Egreso'} • {tx.currency}{' '}
                      {tx.amountOriginal.toFixed(2)} (${tx.amountUSD.toFixed(2)} USD)
                    </Text>
                    <Text style={styles.deletedDate}>
                      Cuenta: {tx.account?.name || 'N/A'} • Eliminado:{' '}
                      {tx.deletedAt ? formatDate(tx.deletedAt) : 'N/A'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={() => setRestoreTargetId(tx.id)}
                  >
                    <Ionicons name="refresh" size={15} color={Colors.bgDark} />
                    <Text style={styles.restoreBtnText}>Restaurar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <CreatorCodeModal
        visible={!!restoreTargetId}
        title="Restaurar Movimiento"
        subtitle="Ingresa el código único de creador para restaurar este registro y re-aplicar su impacto en el saldo de la cuenta."
        actionLabel="Restaurar Registro"
        showReasonInput={false}
        onClose={() => setRestoreTargetId(null)}
        onConfirm={async (masterCode) => {
          if (restoreTargetId) {
            await restoreTransaction(restoreTargetId, masterCode);
            Alert.alert('Restaurado', 'El movimiento fue restaurado exitosamente.');
          }
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0D1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderColor: Colors.borderGold,
    maxHeight: '88%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(27, 61, 129, 0.18)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.accentGold,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.bgDark,
  },
  scrollArea: {
    marginBottom: 10,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  logCard: {
    backgroundColor: 'rgba(27, 61, 129, 0.14)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderLeftWidth: 4,
    padding: 12,
    marginVertical: 5,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  logDesc: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  deletedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    padding: 12,
    marginVertical: 5,
    gap: 10,
  },
  deletedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deletedMeta: {
    fontSize: 12,
    color: Colors.accentGold,
    fontWeight: '600',
    marginTop: 2,
  },
  deletedDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGold,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  restoreBtnText: {
    color: Colors.bgDark,
    fontSize: 11,
    fontWeight: '800',
  },
});
