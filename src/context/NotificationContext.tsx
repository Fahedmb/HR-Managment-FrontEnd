import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Notification, ChatMessage } from '../types';
import { notificationsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    notificationsApi
      .getByUser(user.id)
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  }, [user, isAuthenticated]);

  // WebSocket STOMP connection
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:9090/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${user.id}`, (msg) => {
          try {
            const notification: Notification = JSON.parse(msg.body);
            addNotification(notification);
          } catch {}
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [user, isAuthenticated, addNotification]);

  const markRead = useCallback(
    (id: number) => {
      notificationsApi.markRead(id).then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      });
    },
    []
  );

  const markAllRead = useCallback(() => {
    if (!user) return;
    notificationsApi.markAllRead(user.id).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

// WebSocket client ref for chat – exported for use in ChatPage
export const useChatSocket = () => {
  const { user } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(
    (
      onMessage: (msg: ChatMessage, channel: string) => void,
      teamIds: number[] = []
    ) => {
      if (!user) return;
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:9090/ws'),
        reconnectDelay: 5000,
        onConnect: () => {
          setConnected(true);
          // Subscribe to DMs
          client.subscribe(`/topic/chat/user/${user.id}`, (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              onMessage(msg, `user_${user.id}`);
            } catch {}
          });
          // Subscribe to team channels
          teamIds.forEach((tid) => {
            client.subscribe(`/topic/chat/team/${tid}`, (frame) => {
              try {
                const msg: ChatMessage = JSON.parse(frame.body);
                onMessage(msg, `team_${tid}`);
              } catch {}
            });
          });
        },
        onDisconnect: () => setConnected(false),
      });
      client.activate();
      clientRef.current = client;
    },
    [user]
  );

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    setConnected(false);
  }, []);

  const sendMessage = useCallback((destination: string, body: object) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  return { connect, disconnect, sendMessage, connected, clientRef };
};
