'use client';

import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
// import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useSocket();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed left-4 right-4 top-20 md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top md:origin-top-right">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 font-medium hover:text-blue-700"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {notifications.map((notification, index) => (
                                        <li
                                            key={index}
                                            className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => markAsRead(notification.id || notification.createdAt)} // Ephemeral might lack ID
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(notification.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
