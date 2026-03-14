import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { User } from '../types';
import { getConversations } from '../lib/api';

interface MessagesScreenProps {
  onChatClick: (user: User) => void;
  onNotificationsClick: () => void;
  unreadUsers: Set<string>;
  currentUserId: string;
}

export default function MessagesScreen({ onChatClick, onNotificationsClick, unreadUsers, currentUserId }: MessagesScreenProps) {
  const [conversations, setConversations] = useState<{
    user: { id: string; name: string; avatar: string };
    lastMessage: string;
    lastTime: string;
    unread: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(() => {
    if (!currentUserId) return;
    setIsLoading(true);
    getConversations(currentUserId)
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(diff / 86400000);
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onNotificationsClick}
            className="text-sm text-slate-400 hover:text-primary transition-colors font-medium"
          >
            通知
          </button>
          <h1 className="text-lg font-bold">私信</h1>
        </div>
      </header>

      <main className="px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary/30" size={24} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <MessageSquare size={40} strokeWidth={1.5} />
            <p className="text-sm">还没有私信</p>
            <p className="text-xs text-slate-300">去关注一些用户，开始聊天吧</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const hasUnread = unreadUsers.has(conv.user.id) || conv.unread > 0;
            return (
              <button
                key={conv.user.id}
                onClick={() => onChatClick({
                  id: conv.user.id,
                  name: conv.user.name,
                  avatar: conv.user.avatar,
                  stats: { planted: 0, harvested: 0, following: 0 }
                })}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div className="relative">
                  <div className="size-12 rounded-full overflow-hidden bg-primary/10 border-2 border-white shadow-sm">
                    <img src={conv.user.avatar} alt={conv.user.name}
                      className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{conv.user.name}</span>
                    <span className="text-[10px] text-slate-400">{formatTime(conv.lastTime)}</span>
                  </div>
                  <p className={`text-xs line-clamp-1 ${hasUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            );
          })
        )}
      </main>
    </div>
  );
}
