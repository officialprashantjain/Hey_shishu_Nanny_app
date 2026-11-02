import api from './api';

// Call push registration is handled by FCM + PushKit in nativeCallService.
export { registerCallNotifications as registerForPushNotifications } from './nativeCallService';

/**
 * Fetch paginated in-app notifications
 */
export async function getNotifications(params = {}) {
  return await api.get('/notifications', { params });
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount() {
  return await api.get('/notifications/unread-count');
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId) {
  return await api.patch(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  return await api.patch('/notifications/mark-all-read');
}
