import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  unreadMessagesCount?: number;
  unreadNotifCount?: number;
}

export default function Navigation({ currentScreen, onNavigate, unreadMessagesCount = 0, unreadNotifCount = 0 }: NavigationProps) {
  const hasUnread = unreadNotifCount > 0 || unreadMessagesCount > 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-primary/10 px-4 pb-6 pt-2 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentScreen === 'home' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Home size={24} fill={currentScreen === 'home' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">首页</span>
        </button>

        <button
          onClick={() => onNavigate('square')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentScreen === 'square' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Compass size={24} fill={currentScreen === 'square' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">广场</span>
        </button>

        <div className="-mt-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('create')}
            className="size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background-light"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>

        <button
          onClick={() => onNavigate('notifications')}
          className={`flex flex-col items-center gap-1 transition-colors relative ${
            currentScreen === 'messages' || currentScreen === 'notifications' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Bell size={24} fill={currentScreen === 'messages' || currentScreen === 'notifications' ? 'currentColor' : 'none'} />
          {hasUnread && currentScreen !== 'messages' && currentScreen !== 'notifications' && (
            <span className="absolute top-0 right-1 size-2 bg-red-500 rounded-full border border-white" />
          )}
          <span className="text-[10px] font-medium">消息</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentScreen === 'profile' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <User size={24} fill={currentScreen === 'profile' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </nav>
  );
}
