"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const prisma_1 = require("../../config/prisma");
const shared_1 = require("@cuentas/shared");
const firebase_1 = require("../../config/firebase");
const socket_1 = require("../../realtime/socket");
class NotificationsService {
    static async registerFcmToken(userId, data) {
        const existing = await prisma_1.prisma.fcmToken.findUnique({
            where: { token: data.token },
        });
        if (existing) {
            return await prisma_1.prisma.fcmToken.update({
                where: { token: data.token },
                data: {
                    userId,
                    platform: data.platform,
                },
            });
        }
        return await prisma_1.prisma.fcmToken.create({
            data: {
                userId,
                token: data.token,
                platform: data.platform,
            },
        });
    }
    static async createReminder(userId, data) {
        const reminder = await prisma_1.prisma.reminder.create({
            data: {
                userId,
                title: data.title.trim(),
                message: data.message.trim(),
                scheduledDate: new Date(data.scheduledDate),
                relatedType: data.relatedType,
                relatedId: data.relatedId || null,
            },
        });
        (0, socket_1.emitToUser)(userId, shared_1.RealtimeEvents.REMINDER_TRIGGERED, reminder);
        return reminder;
    }
    static async getReminders(userId) {
        return await prisma_1.prisma.reminder.findMany({
            where: { userId },
            orderBy: { scheduledDate: 'asc' },
        });
    }
    static async dispatchDueReminders() {
        const now = new Date();
        const dueReminders = await prisma_1.prisma.reminder.findMany({
            where: {
                isSent: false,
                scheduledDate: { lte: now },
            },
            include: {
                user: {
                    include: { fcmTokens: true },
                },
            },
        });
        for (const reminder of dueReminders) {
            for (const tokenRecord of reminder.user.fcmTokens) {
                await (0, firebase_1.sendPushNotification)(tokenRecord.token, reminder.title, reminder.message, { reminderId: reminder.id, relatedType: reminder.relatedType });
            }
            await prisma_1.prisma.reminder.update({
                where: { id: reminder.id },
                data: { isSent: true },
            });
            (0, socket_1.emitToUser)(reminder.userId, shared_1.RealtimeEvents.REMINDER_TRIGGERED, reminder);
        }
    }
}
exports.NotificationsService = NotificationsService;
