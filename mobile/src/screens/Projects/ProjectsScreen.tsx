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
import { NewProjectModal } from './NewProjectModal';
import { NewProjectItemModal } from './NewProjectItemModal';
import { CreatorCodeModal } from '../../components/CreatorCodeModal';
import { useFinancial } from '../../context/FinancialContext';

export const ProjectsScreen: React.FC = () => {
  const {
    projects,
    isLoading,
    refreshAll,
    updateProjectItem,
    deleteProject,
    deleteProjectItem,
  } = useFinancial();
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'project' | 'item';
    id: string;
    title: string;
  } | null>(null);

  const handleOpenAddItem = (project: { id: string; name: string }) => {
    setSelectedProject(project);
    setItemModalVisible(true);
  };

  const handleToggleItemActive = async (itemId: string, currentActive: boolean) => {
    await updateProjectItem(itemId, { isActive: !currentActive });
  };

  const handleToggleItemCompleted = async (itemId: string, currentCompleted: boolean) => {
    await updateProjectItem(itemId, { isCompleted: !currentCompleted });
  };

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
          <Text style={styles.headerTitle}>PROYECTOS & BIENES</Text>
          <Text style={styles.headerSubtitle}>Gastos Específicos & Presupuestos</Text>
        </View>

        {/* Botón Nuevo Proyecto */}
        <TouchableOpacity
          style={styles.newProjectBtn}
          onPress={() => setProjectModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={18} color={Colors.bgDark} />
          <Text style={styles.newProjectBtnText}>+ Crear Nuevo Proyecto</Text>
        </TouchableOpacity>

        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tienes proyectos creados</Text>
            <Text style={styles.emptyDesc}>
              Crea proyectos para agrupar compras planificadas como 'Gastos de la moto' o proyectos con ingresos recurrentes.
            </Text>
          </View>
        ) : (
          projects.map((proj) => (
            <GlassCard key={proj.id} style={styles.card}>
              <View style={styles.projHeader}>
                <View style={styles.projTitleWrapper}>
                  <Ionicons name="cube-outline" size={20} color={Colors.accentGold} />
                  <Text style={styles.projName}>{proj.name}</Text>
                </View>
                <View style={styles.headerRightActions}>
                  <TouchableOpacity
                    style={styles.addItemBtn}
                    onPress={() => handleOpenAddItem({ id: proj.id, name: proj.name })}
                  >
                    <Ionicons name="add" size={16} color={Colors.accentGold} />
                    <Text style={styles.addItemBtnText}>Ítem</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteProjBtn}
                    onPress={() =>
                      setDeleteTarget({ type: 'project', id: proj.id, title: proj.name })
                    }
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {proj.description ? (
                <Text style={styles.projDesc}>{proj.description}</Text>
              ) : null}

              {/* Métricas del Proyecto */}
              <View style={styles.projMetricsRow}>
                <View style={styles.projMetricItem}>
                  <Text style={styles.projMetricLabel}>Gasto Activo:</Text>
                  <Text style={[styles.projMetricValue, { color: Colors.danger }]}>
                    ${(proj.activeTotal || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.projMetricDivider} />

                <View style={styles.projMetricItem}>
                  <Text style={styles.projMetricLabel}>Presupuesto / Recordatorio:</Text>
                  <Text style={[styles.projMetricValue, { color: Colors.accentGold }]}>
                    ${(proj.budgetPendingTotal || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Lista de Ítems del Proyecto */}
              <View style={styles.itemsList}>
                {proj.items && proj.items.length > 0 ? (
                  proj.items.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <TouchableOpacity
                        style={styles.itemActiveToggle}
                        onPress={() => handleToggleItemCompleted(item.id, !!item.isCompleted)}
                      >
                        <Ionicons
                          name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={item.isCompleted ? Colors.success : Colors.textSecondary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.itemActiveToggle}
                        onPress={() => handleToggleItemActive(item.id, item.isActive)}
                      >
                        <Ionicons
                          name={item.isActive ? 'flash' : 'bookmark-outline'}
                          size={16}
                          color={item.isActive ? Colors.danger : Colors.textMuted}
                        />
                      </TouchableOpacity>

                      <View style={styles.itemTextWrapper}>
                        <Text
                          style={[
                            styles.itemTitle,
                            item.isCompleted && {
                              textDecorationLine: 'line-through',
                              color: Colors.textSecondary,
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.itemBadge}>
                          {item.isCompleted
                            ? 'Completado / Comprado'
                            : item.isActive
                            ? 'Activo (En cuentas)'
                            : 'Recordatorio / Presupuesto'}
                        </Text>
                      </View>

                      <Text style={styles.itemAmount}>${item.amount.toFixed(2)}</Text>

                      <TouchableOpacity
                        style={styles.deleteItemBtn}
                        onPress={() =>
                          setDeleteTarget({ type: 'item', id: item.id, title: item.title })
                        }
                      >
                        <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noItemsText}>Sin ítems agregados aún.</Text>
                )}
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Modal Nuevo Proyecto */}
      <NewProjectModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
      />

      {/* Modal Nuevo Ítem */}
      {selectedProject && (
        <NewProjectItemModal
          visible={itemModalVisible}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          onClose={() => {
            setItemModalVisible(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Modal Eliminar Proyecto / Ítem con Código Único */}
      <CreatorCodeModal
        visible={!!deleteTarget}
        title={deleteTarget?.type === 'project' ? 'Eliminar Proyecto' : 'Eliminar Ítem'}
        subtitle={
          deleteTarget
            ? `¿Confirmas eliminar "${deleteTarget.title}"? Quedará registrado en la Bitácora de Auditoría BD.`
            : ''
        }
        actionLabel="Confirmar Eliminación"
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (masterCode, reason) => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'project') {
            await deleteProject(deleteTarget.id, masterCode, reason);
          } else {
            await deleteProjectItem(deleteTarget.id, masterCode, reason);
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
  newProjectBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accentGold,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  newProjectBtnText: {
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
    marginVertical: 8,
    padding: 16,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  projName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  addItemBtnText: {
    color: Colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteProjBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
  },
  projDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  projMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
    alignItems: 'center',
  },
  projMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  projMetricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  projMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  projMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderGlass,
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemActiveToggle: {
    padding: 6,
    marginRight: 6,
  },
  itemTextWrapper: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemBadge: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  deleteItemBtn: {
    padding: 5,
  },
  noItemsText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
