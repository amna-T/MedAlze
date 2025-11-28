import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Notification } from '@/types/database';

/**
 * Adds a new notification to the Firestore 'notifications' collection.
 * This is a standalone utility to break circular dependencies between AuthContext and NotificationsProvider.
 * @param userId The Firebase UID of the recipient user.
 * @param title The title of the notification.
 * @param message The message content of the notification.
 * @param type The type of notification ('info' | 'success' | 'warning' | 'error').
 * @param action Optional action details for the notification.
 * @param senderId Optional Firebase UID of the sender.
 * @param senderName Optional name of the sender.
 */
export const addNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  action?: Notification['action'],
  senderId?: string,
  senderName?: string,
) => {
  if (!db) {
    console.warn("Firestore not available. Cannot add notification.");
    // In a real app, you might want to log this or use a fallback mechanism.
    return;
  }
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      senderId,
      senderName,
      title,
      message,
      type,
      createdAt: serverTimestamp(),
      read: false,
      action,
    });
  } catch (error) {
    console.error('Error adding notification via utility:', error);
    // Note: We are not using useToast here to avoid another dependency.
    // The calling component (e.g., AuthContext) can handle its own toast if needed.
  }
};