import React, { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Bookmark, Loader2 } from 'lucide-react';
import { Notification } from '../types';
import { getNotifications, markNotificationsRead } from '../lib/api';

interface NotificationsScreenProps {
  onMessagesClick: () => void;
  currentUserId: string;
  onRead?: () => void;
  onInspirationClick?: (inspirationId: string) => void;
}

export default function NotificationsScreen({ onMessagesClick, currentUserId, onRead, onInspirationClick }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    getNotifications(currentUserId)
      .then(data => {
        setNotifications(data);
        return markNotificationsRead(currentUserId);
      })
      .then(() => onRead?.())
      .catch(console.error)
      .finally(() => setIsLoading(false));

    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="text-red-500" size={16} fill="currentColor" />;
      case 'comment': return <MessageCircle className="text-blue-500" size={16} fill="currentColor" />;
      case 'follow': return <UserPlus className="text-green-500" size={16} />;
      case 'collect': return <Bookmark className="text-amber-500" size={16} fill="currentColor" />;
      default: return <Bell className="text-slate-400" size={16} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center justify-center border-b border-primary/10 relative">
        <button
          onClick={onMessagesClick}
          className="absolute left-4 text-sm text-slate-400 hover:text-primary transition-colors font-medium"
        >
          私信
        </button>
        <h1 className="text-lg font-bold">通知</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary/30" size={32} />
            <p className="text-slate-400 text-sm">正在加载消息...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <Bell size={32} />
            </div>
            <p className="text-slate-400 text-sm">暂无消息通知</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => notification.target_id && onInspirationClick?.(notification.target_id)}
              className={`flex items-start gap-4 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm transition-all ${
                notification.is_read === 0 ? 'ring-1 ring-primary/20' : ''
              } ${notification.target_id && onInspirationClick ? 'cursor-pointer hover:bg-primary/5 active:scale-[0.98]' : ''}`}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {notification.user_avatar ? (
                  <img src={notification.user_avatar} alt={notification.user_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{notification.user_name}</span>
                  <span className="text-[10px] text-slate-400">{formatTime(notification.created_at)}</span>
                </div>
                <p className="text-sm text-slate-600">{notification.content}</p>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
