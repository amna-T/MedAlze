import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { addNotification as addNotificationUtility } from '@/utils/notificationUtils'; // Import the utility

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  // Removed addNotification from context value as it's now a utility
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // This is now safe as AuthProvider will be the parent
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // The addNotification logic is now in a utility, so we don't expose it via context directly.
  // If NotificationsProvider itself needs to add a notification, it can call the utility.

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!db) return;
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [db]);

  const markAllAsRead = useCallback(async () => {
    if (!db || !user) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        const notificationRef = doc(db, 'notifications', n.id);
        batch.update(notificationRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [db, user, notifications]);

  useEffect(() => {
    if (!db || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications: Notification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt : Timestamp.now(),
      })) as Notification[];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Notification Error',
        description: 'Failed to load notifications.',
        variant: 'destructive',
      });
    });

    return () => unsubscribe();
  }, [db, user, toast]);

  const contextValue = React.useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    // addNotification is no longer part of the context value
  }), [notifications, unreadCount, markAsRead, markAllAsRead]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};