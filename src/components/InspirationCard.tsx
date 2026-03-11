import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets } from 'lucide-react';
import { Inspiration, User } from '../types';

interface InspirationCardProps {
  inspiration: Inspiration;
  onClick: () => void;
  onUserClick?: (user: any) => void;
  currentUser?: User;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ inspiration, onClick, onUserClick, currentUser }) => {
  const [isWatered, setIsWatered] = useState(false);
  const [localLikes, setLocalLikes] = useState(inspiration.stats.likes);

  const isAuthorMe = currentUser && (inspiration.author.id === currentUser.id || inspiration.author.name === currentUser.name);
  const authorName = isAuthorMe ? currentUser.name : inspiration.author.name;
  const authorAvatar = isAuthorMe ? currentUser.avatar : inspiration.author.avatar;

  const handleWatering = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isWatered) {
      setIsWatered(true);
      setLocalLikes(prev => prev + 1);
      try {
        await fetch(`/api/inspirations/${inspiration.id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: currentUser?.name || '匿名用户',
            userAvatar: currentUser?.avatar || '',
            title: inspiration.title
          })
        });
      } catch (error) {
        console.error('Failed to water:', error);
      }
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick) {
      onUserClick({
        id: isAuthorMe ? currentUser.id : inspiration.author.name,
        name: authorName,
        avatar: authorAvatar,
        stats: isAuthorMe ? currentUser.stats : { planted: 0, harvested: 0, following: 0 }
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 cursor-pointer group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={inspiration.image}
          alt={inspiration.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer" loading="lazy" />
        <div className="absolute top-3 right-3">
          <button 
            onClick={handleWatering}
            className={`size-10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              isWatered ? 'bg-primary text-white scale-110' : 'bg-white/80 text-primary'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isWatered ? 'watered' : 'unwatered'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Droplets size={20} fill={isWatered ? 'currentColor' : 'none'} />
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-900 text-lg font-bold leading-tight">{inspiration.title}</h3>
          <div className="flex items-center gap-1 text-primary">
            <Droplets size={14} fill="currentColor" />
            <span className="text-xs font-bold">{localLikes}</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
          {inspiration.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {inspiration.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <div 
          onClick={handleUserClick}
          className="flex items-center gap-2 mt-2 pt-3 border-t border-primary/5 hover:opacity-70 transition-opacity"
        >
          <img
            src={authorAvatar}
            alt={authorName}
            className="size-6 rounded-full bg-primary/20"
            referrerPolicy="no-referrer" loading="lazy" />
          <p className="text-slate-400 text-xs font-medium">@{authorName}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InspirationCard;
