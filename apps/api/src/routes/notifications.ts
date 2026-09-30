import { Router } from 'express';
import { NotificationChannel, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFound } from '../lib/errors.js';

const router = Router();

// Which broadcast channels each role receives.
function channelsFor(role: Role): NotificationChannel[] {
  switch (role) {
    case Role.HR_ADMINISTRATOR:
    case Role.HR_OFFICER:
      return [NotificationChannel.HR, NotificationChannel.OPERATIONS];
    case Role.MANAGER:
      return [NotificationChannel.OPERATIONS, NotificationChannel.MANAGER];
    case Role.SENIOR_MANAGEMENT:
      return [NotificationChannel.HR, NotificationChannel.OPERATIONS];
    default:
      return [NotificationChannel.EMPLOYEE];
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const channels = channelsFor(p.role);
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: p.userId }, { channel: { in: channels }, userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const unread = notifications.filter((n) => !n.isRead).length;
    res.json({ data: notifications, unread });
  }),
);

router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) throw NotFound('Notification not found');
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ ok: true });
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const channels = channelsFor(p.role);
    await prisma.notification.updateMany({ where: { OR: [{ userId: p.userId }, { channel: { in: channels }, userId: null }], isRead: false }, data: { isRead: true } });
    res.json({ ok: true });
  }),
);

export default router;
