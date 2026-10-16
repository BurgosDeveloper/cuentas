import { prisma } from '../../config/prisma';
import { CreateProjectInput, CreateProjectItemInput, UpdateProjectItemInput, RealtimeEvents } from '@cuentas/shared';
import { emitToUser } from '../../realtime/socket';

export class ProjectsService {
  static async getProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => {
      const activeTotal = project.items
        .filter((i) => i.isActive)
        .reduce((sum, i) => sum + i.amount, 0);

      const budgetPendingTotal = project.items
        .filter((i) => !i.isActive && !i.isCompleted)
        .reduce((sum, i) => sum + i.amount, 0);

      return {
        ...project,
        activeTotal: Number(activeTotal.toFixed(2)),
        budgetPendingTotal: Number(budgetPendingTotal.toFixed(2)),
        itemsCount: project.items.length,
      };
    });
  }

  static async createProject(userId: string, data: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || '#FFD700',
        icon: data.icon || 'briefcase-outline',
      },
    });

    emitToUser(userId, RealtimeEvents.PROJECT_UPDATED, { project, action: 'created' });
    return project;
  }

  static async createProjectItem(userId: string, data: CreateProjectItemInput) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId },
    });
    if (!project) {
      throw new Error('Proyecto no encontrado.');
    }

    const item = await prisma.projectItem.create({
      data: {
        projectId: data.projectId,
        title: data.title.trim(),
        amount: data.amount,
        currency: data.currency,
        isActive: data.isActive,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes?.trim() || null,
      },
    });

    emitToUser(userId, RealtimeEvents.PROJECT_ITEM_UPDATED, { item, action: 'created' });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return item;
  }

  static async updateProjectItem(userId: string, itemId: string, data: UpdateProjectItemInput) {
    const item = await prisma.projectItem.findFirst({
      where: {
        id: itemId,
        project: { userId },
      },
    });

    if (!item) {
      throw new Error('Ítem de proyecto no encontrado.');
    }

    const updated = await prisma.projectItem.update({
      where: { id: itemId },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        amount: data.amount,
        currency: data.currency,
        isActive: data.isActive,
        isCompleted: data.isCompleted,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    });

    emitToUser(userId, RealtimeEvents.PROJECT_ITEM_UPDATED, { item: updated, action: 'updated' });
    emitToUser(userId, RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });

    return updated;
  }
}
