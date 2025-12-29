'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
    id: string; // or uuid
    title: string;
    message: string;
    type: string;
    createdAt: string;
    isRead: boolean;
}

interface SocketContextType {
    socket: Socket | null;
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    notifications: [],
    unreadCount: 0,
    markAsRead: () => { },
    markAllAsRead: () => { },
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch existing notifications from backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        fetch(`${apiUrl}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(existingNotifications => {
                // Ensure all have IDs
                const notificationsWithIds = existingNotifications.map((n: any) => ({
                    ...n,
                    id: n.id || crypto.randomUUID()
                }));
                setNotifications(notificationsWithIds);
            })
            .catch(err => console.error('Failed to load notifications:', err));

        // "NEXT_PUBLIC_API_URL" or hardcoded for now?
        // Backend runs on port 3000? Backend port is usually 3000 (NestJS default).
        // Frontend is 3001?
        // I'll assume backend is at http://localhost:3000 based on standard setup.
        // Or I should check .env.local if it exists.
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('notification', (notification: Notification) => {
            console.log('Received notification:', notification);
            // Ensure ID exists
            const notificationWithId = {
                ...notification,
                id: notification.id || crypto.randomUUID()
            };
            // Add new notification to top of list
            setNotifications((prev) => [notificationWithId, ...prev]);

            // Show browser notification if requested? (Maybe later)
            // For now, we rely on UI state updates.
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id || n.createdAt === id /* fallback if id missing in ephemeral */ ? { ...n, isRead: true } : n));

        // Call API to mark as read in backend
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        if (token) {
            fetch(`${apiUrl}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(err => console.error('Failed to mark notification as read:', err));
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        // Call API
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        if (token) {
            fetch(`${apiUrl}/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(err => console.error('Failed to mark all notifications as read:', err));
        }
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllAsRead, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
