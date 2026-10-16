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
import { GlassCard } from '../../components/GlassCard';
import { NewThirdModal } from './NewThirdModal';
import { CreatorCodeModal } from '../../components/CreatorCodeModal';
import { useFinancial } from '../../context/FinancialContext';

export const ThirdsScreen: React.FC = () => {
  const { thirds, isLoading, refreshAll, deleteThird } = useFinancial();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingThird, setEditingThird] = useState<any | null>(null);
  const [deletingThird, setDeletingThird] = useState<any | null>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAll}
            tintColor={Colors.accentGold}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TERCEROS & DEUDAS</Text>
          <Text style={styles.headerSubtitle}>Cuentas por Cobrar y por Pagar</Text>
        </View>

        {/* Botón Nuevo Tercero */}
        <TouchableOpacity
          style={styles.newThirdBtn}
          onPress={() => {
            setEditingThird(null);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color={Colors.bgDark} />
          <Text style={styles.newThirdBtnText}>+ Agregar Tercero / Contacto</Text>
        </TouchableOpacity>

        {/* Listado de Terceros */}
        {thirds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tienes terceros registrados</Text>
            <Text style={styles.emptyDesc}>
              Agrega a las personas a quienes les debes dinero o que te deben dinero para llevar su balance automático.
            </Text>
          </View>
        ) : (
          thirds.map((item) => {
            const hasReceivables = item.totalTheyOweUs > 0;
            const hasPayables = item.totalWeOweThem > 0;
            const isPositiveNet = item.netBalance > 0;

            return (
              <GlassCard
                key={item.id}
                isGoldHighlighted={isPositiveNet}
                style={styles.card}
              >
                <View style={styles.topRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.phone ? (
                      <Text style={styles.phoneText}>{item.phone}</Text>
                    ) : null}
                    {item.notes ? (
                      <Text style={styles.notes} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.netBox}>
                    <Text style={styles.netLabel}>Balance Neto</Text>
                    <Text
                      style={[
                        styles.netValue,
                        {
                          color:
                            item.netBalance > 0
                              ? Colors.success
                              : item.netBalance < 0
                              ? Colors.danger
                              : Colors.textSecondary,
                        },
                      ]}
                    >
                      {item.netBalance >= 0
                        ? `+$${item.netBalance.toFixed(2)}`
                        : `-$${Math.abs(item.netBalance).toFixed(2)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.bottomRow}>
                  <View style={styles.debtItem}>
                    <Text style={styles.debtLabel}>Me debe (Cobrar):</Text>
                    <Text
                      style={[
                        styles.debtValue,
                        { color: hasReceivables ? Colors.success : Colors.textMuted },
                      ]}
                    >
                      +${item.totalTheyOweUs.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.debtItem}>
                    <Text style={styles.debtLabel}>Le debo (Pagar):</Text>
                    <Text
                      style={[
                        styles.debtValue,
                        { color: hasPayables ? Colors.danger : Colors.textMuted },
                      ]}
                    >
                      -${item.totalWeOweThem.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => {
                        setEditingThird(item);
                        setModalVisible(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.accentGold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => setDeletingThird(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Modal Nuevo / Editar Tercero */}
      <NewThirdModal
        visible={modalVisible}
        editingThird={editingThird}
        onClose={() => {
          setModalVisible(false);
          setEditingThird(null);
        }}
      />

      {/* Modal Eliminar Tercero con Código Único */}
      <CreatorCodeModal
        visible={!!deletingThird}
        title="Eliminar Tercero"
        subtitle={
          deletingThird
            ? `¿Confirmas eliminar a "${deletingThird.name}"? Esta acción quedará registrada en la Bitácora de Auditoría BD.`
            : ''
        }
        actionLabel="Eliminar Tercero"
        isDestructive
        onClose={() => setDeletingThird(null)}
        onConfirm={async (masterCode, reason) => {
          if (deletingThird) {
            await deleteThird(deletingThird.id, masterCode, reason);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
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
  newThirdBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  newThirdBtnText: {
    color: Colors.bgDark,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    marginVertical: 6,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.2,
    borderColor: Colors.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentGold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.accentGold,
    marginTop: 1,
  },
  notes: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  netBox: {
    alignItems: 'flex-end',
  },
  netLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  netValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderGlass,
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtItem: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  debtLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  debtValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
});
