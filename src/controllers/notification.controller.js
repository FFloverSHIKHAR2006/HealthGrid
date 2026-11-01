import Notification from '../models/Notification.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

// Get current user's notifications and unread count
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate('reminder', 'title type medication time appointmentDate')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  res.json({
    notifications,
    unreadCount,
  });
});

// Mark single notification as read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  res.json(notification);
});

// Mark all notifications as read for current user
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.json({
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount,
  });
});

// Delete / dismiss a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  res.json({ message: 'Notification dismissed' });
});
