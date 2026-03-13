import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets } from 'lucide-react';
import { Inspiration, User } from '../types';
import { likeInspiration, hasLiked } from '../lib/api';

interface InspirationCardProps {
  inspiration: Inspiration;
  onClick: () => void;
  onUserClick?: (user: any) => void;
  currentUser?: User;
  onLikeChange?: (inspirationId: string, newLikeCount: number, isLiked: boolean) => void;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ inspiration, onClick, onUserClick, currentUser, onLikeChange }) => {
  const [isWatered, setIsWatered] = useState<boolean | null>(null); // null = 未加载
  const [localLikes, setLocalLikes] = useState(inspiration.stats.likes);
  const isProcessing = useRef(false);

  const isAuthorMe = currentUser && (inspiration.author.id === currentUser.id || inspiration.author.name === currentUser.name);
  const authorName = isAuthorMe ? currentUser.name : inspiration.author.name;
  const authorAvatar = isAuthorMe ? currentUser.avatar : inspiration.author.avatar;

  // 初始化：从数据库读取真实点赞状态
  useEffect(() => {
    if (currentUser?.id) {
      hasLiked(inspiration.id, currentUser.id)
        .then(liked => setIsWatered(liked))
        .catch(() => setIsWatered(false));
    } else {
      setIsWatered(false);
    }
  }, [inspiration.id, currentUser?.id]);

  // 父组件更新likes数时同步（比如详情页操作后回来）
  useEffect(() => {
    setLocalLikes(inspiration.stats.likes);
  }, [inspiration.stats.likes]);

  const handleWatering = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id || isProcessing.current || isWatered === null) return;
    isProcessing.current = true;

    try {
      // 调用API，API内部以数据库状态为准决定加/减
      const nowLiked = await likeInspiration(inspiration.id, currentUser.id);
      // 用函数式更新避免stale closure，基于最新localLikes计算
      setIsWatered(nowLiked);
      setLocalLikes(prev => nowLiked ? prev + 1 : Math.max(0, prev - 1));
      onLikeChange?.(inspiration.id, nowLiked ? localLikes + 1 : Math.max(0, localLikes - 1), nowLiked);
    } catch {
      // 失败不改变UI
    } finally {
      isProcessing.current = false;
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

  const watered = isWatered === true;

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
            disabled={isWatered === null}
            className={`size-10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              watered ? 'bg-primary text-white scale-110' : 'bg-white/80 text-primary'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={watered ? 'watered' : 'unwatered'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Droplets size={20} fill={watered ? 'currentColor' : 'none'} />
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
