import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface MessagesScreenProps {
  onChatClick: (user: User) => void;
  onNotificationsClick: () => void;
  unreadUsers: Set<string>;
}

const MOCK_CHATS = [
  {
    id: 'u1',
    name: 'lin_design',
    avatar: 'https://picsum.photos/seed/user1/100/100',
    lastMessage: '谢谢你的关注！我们可以多交流。',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  },
  {
    id: 'u2',
    name: '光影捕手',
    avatar: 'https://picsum.photos/seed/user2/100/100',
    lastMessage: '那张咖啡馆的照片构图太棒了！',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
  },
  {
    id: 'u3',
    name: '极简主义者',
    avatar: 'https://picsum.photos/seed/user3/100/100',
    lastMessage: '你是用什么相机拍摄的？',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  }
];

export default function MessagesScreen({ onChatClick, onNotificationsClick, unreadUsers }: MessagesScreenProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
          <Search size={20} />
        </button>
      </header>

      <main className="px-4 py-4 space-y-2">
        {MOCK_CHATS.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onChatClick({ id: chat.id, name: chat.name, avatar: chat.avatar, stats: { planted: 0, harvested: 0, following: 0 } })}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="relative">
              <div className="size-12 rounded-full overflow-hidden bg-primary/10 border-2 border-white shadow-sm">
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
              </div>
              {unreadUsers.has(chat.id) && (
                <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{chat.name}</span>
                <span className="text-[10px] text-slate-400">{formatTime(chat.time)}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{chat.lastMessage}</p>
            </div>

            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </main>
    </div>
  );
}
