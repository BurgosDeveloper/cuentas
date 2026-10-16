"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const prisma_1 = require("../../config/prisma");
const shared_1 = require("@cuentas/shared");
const socket_1 = require("../../realtime/socket");
class ProjectsService {
    static async getProjects(userId) {
        const projects = await prisma_1.prisma.project.findMany({
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
    static async createProject(userId, data) {
        const project = await prisma_1.prisma.project.create({
            data: {
                userId,
                name: data.name.trim(),
                description: data.description?.trim() || null,
                color: data.color || '#FFD700',
                icon: data.icon || 'briefcase-outline',
            },
        });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.PROJECT_UPDATED, { project, action: 'created' });
        return project;
    }
    static async createProjectItem(userId, data) {
        const project = await prisma_1.prisma.project.findFirst({
            where: { id: data.projectId, userId },
        });
        if (!project) {
            throw new Error('Proyecto no encontrado.');
        }
        const item = await prisma_1.prisma.projectItem.create({
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
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.PROJECT_ITEM_UPDATED, { item, action: 'created' });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });
        return item;
    }
    static async updateProjectItem(userId, itemId, data) {
        const item = await prisma_1.prisma.projectItem.findFirst({
            where: {
                id: itemId,
                project: { userId },
            },
        });
        if (!item) {
            throw new Error('Ítem de proyecto no encontrado.');
        }
        const updated = await prisma_1.prisma.projectItem.update({
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
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.PROJECT_ITEM_UPDATED, { item: updated, action: 'updated' });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.DASHBOARD_STATS_UPDATED, { timestamp: new Date() });
        return updated;
    }
}
exports.ProjectsService = ProjectsService;
