import { prisma } from '../../config/prisma';
import { RegisterFcmTokenInput, CreateReminderInput, RealtimeEvents } from '@cuentas/shared';
import { sendPushNotification } from '../../config/firebase';
import { emitToUser } from '../../realtime/socket';

export class NotificationsService {
  static async registerFcmToken(userId: string, data: RegisterFcmTokenInput) {
    const existing = await prisma.fcmToken.findUnique({
      where: { token: data.token },
    });

    if (existing) {
      return await prisma.fcmToken.update({
        where: { token: data.token },
        data: {
          userId,
          platform: data.platform,
        },
      });
    }

    return await prisma.fcmToken.create({
      data: {
        userId,
        token: data.token,
        platform: data.platform,
      },
    });
  }

  static async createReminder(userId: string, data: CreateReminderInput) {
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: data.title.trim(),
        message: data.message.trim(),
        scheduledDate: new Date(data.scheduledDate),
        relatedType: data.relatedType,
        relatedId: data.relatedId || null,
      },
    });

    emitToUser(userId, RealtimeEvents.REMINDER_TRIGGERED, reminder);
    return reminder;
  }

  static async getReminders(userId: string) {
    return await prisma.reminder.findMany({
      where: { userId },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  static async dispatchDueReminders() {
    const now = new Date();
    const dueReminders = await prisma.reminder.findMany({
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
        await sendPushNotification(
          tokenRecord.token,
          reminder.title,
          reminder.message,
          { reminderId: reminder.id, relatedType: reminder.relatedType }
        );
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { isSent: true },
      });

      emitToUser(reminder.userId, RealtimeEvents.REMINDER_TRIGGERED, reminder);
    }
  }
}
