"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { safeFetch } from "@/lib/fetch-utils";
import type { User } from "@supabase/supabase-js";

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  notification_type: "follow" | "like" | "comment";
  post_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
}

interface Props {
  user: User;
}

export default function NotificationsComponent({ user }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription with error handling
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          try {
            console.log('New notification received:', payload);
            // Add new notification to the list
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          } catch (error) {
            console.error('Error processing real-time notification:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err);
        }
        console.log('Subscription status:', status);
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
    };
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await safeFetch('/api/notifications');

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Unexpected error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await safeFetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (!error) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await safeFetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });

      if (!error) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      } else {
        console.error('Failed to mark all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return '👤';
      case 'like': return '❤️';
      case 'comment': return '💬';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {notification.message}
                    </p>
                    {notification.post && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        "{notification.post.content}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
