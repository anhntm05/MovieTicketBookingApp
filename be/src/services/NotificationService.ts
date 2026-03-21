import { Notification } from '../models/Notification';
import { INotification, INotificationRequest, NotificationType } from '../types';
import { PAGINATION } from '../utils/constants';
import { getIO } from '../socket';

export class NotificationService {
  static async getUserNotifications(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filter?: 'all' | 'bookings' | 'social'
  ): Promise<{ notifications: INotification[]; total: number; page: number; pages: number }> {
    const query: Record<string, unknown> = { user: userId };

    if (filter === 'bookings') {
      query.type = { $in: ['booking_confirm', 'booking_cancel'] };
    } else if (filter === 'social') {
      query.type = { $in: ['comment'] };
    }

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  static async createNotification(notificationData: INotificationRequest): Promise<INotification> {
    const notification = await Notification.create({
      ...notificationData,
      unread: notificationData.unread ?? true,
    });

    getIO()?.to(`user:${notificationData.user}`).emit('notifications:new', notification);

    return notification;
  }

  static async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { unread: false },
      { new: true }
    );

    if (notification) {
      getIO()?.to(`user:${userId}`).emit('notifications:read', notification);
    }

    return notification;
  }

  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany({ user: userId, unread: true }, { unread: false });
    getIO()?.to(`user:${userId}`).emit('notifications:read-all');
    return result.modifiedCount ?? 0;
  }

  static buildBookingNotification(
    userId: string,
    type: Extract<NotificationType, 'booking_confirm' | 'booking_cancel'>,
    movieTitle: string
  ): INotificationRequest {
    return {
      user: userId,
      type,
      title: type === 'booking_confirm' ? 'Booking Confirmed' : 'Booking Cancelled',
      message:
        type === 'booking_confirm'
          ? `Your booking for ${movieTitle} is confirmed!`
          : `Your booking for ${movieTitle} has been successfully cancelled.`,
      movieTitle,
    };
  }

  static buildCommentReplyNotification(
    userId: string,
    actorName: string,
    movieTitle: string,
    content: string
  ): INotificationRequest {
    return {
      user: userId,
      type: 'comment',
      title: `${actorName} replied to your comment on`,
      movieTitle,
      message: `"${content}"`,
      actorName,
    };
  }
}

export default NotificationService;
