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

// 渐变色方案，按内容hash选择，保持同一条灵感颜色稳定
const TEXT_GRADIENTS = [
  { from: '#e8d5f5', to: '#c9b0e8', text: '#4a2d7a', tag: 'rgba(255,255,255,0.55)' },
  { from: '#d0e8f5', to: '#a8ccec', text: '#1a3d6a', tag: 'rgba(255,255,255,0.55)' },
  { from: '#fde8d0', to: '#f5c898', text: '#7a3d10', tag: 'rgba(255,255,255,0.55)' },
  { from: '#d5f0e0', to: '#a8dfc0', text: '#1a5a38', tag: 'rgba(255,255,255,0.55)' },
  { from: '#f5d5e8', to: '#eaabcc', text: '#6a1a48', tag: 'rgba(255,255,255,0.55)' },
  { from: '#e8e8d5', to: '#d0ceaa', text: '#4a4820', tag: 'rgba(255,255,255,0.55)' },
];

function getGradient(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TEXT_GRADIENTS[hash % TEXT_GRADIENTS.length];
}

// 提取文本的关键片段：取最长的一句或前30字
function extractKeyPhrase(text: string): { main: string; rest: string } {
  if (!text) return { main: '', rest: '' };

  // 按标点分句
  const sentences = text.split(/[。！？!?，,]/).map(s => s.trim()).filter(s => s.length > 1);

  if (sentences.length > 1) {
    // 优先取长度适中（8-18字）的句子，最有冲击力
    const ideal = sentences.find(s => s.length >= 8 && s.length <= 18);
    if (ideal) {
      const rest = sentences.filter(s => s !== ideal).join('，').slice(0, 20);
      return { main: ideal, rest };
    }
    // 没有理想句子则取最短的（更有力）
    const shortest = sentences.reduce((a, b) => a.length <= b.length ? a : b).trim();
    if (shortest.length <= 22) {
      return { main: shortest, rest: '' };
    }
    return { main: shortest.slice(0, 18) + '...', rest: '' };
  }

  // 单句：≤18字全显，否则取前16字
  if (text.length <= 18) return { main: text, rest: '' };
  return { main: text.slice(0, 16) + '...', rest: text.slice(16, 30) + (text.length > 30 ? '...' : '') };
}

const InspirationCard: React.FC<InspirationCardProps> = ({ inspiration, onClick, onUserClick, currentUser, onLikeChange }) => {
  const [isWatered, setIsWatered] = useState<boolean | null>(null);
  const [localLikes, setLocalLikes] = useState(inspiration.stats.likes);
  const isProcessing = useRef(false);

  const hasImage = !!inspiration.image;
  const gradient = getGradient(inspiration.id);
  const { main, rest } = extractKeyPhrase(inspiration.description || inspiration.title || '');

  const isAuthorMe = currentUser && (inspiration.author.id === currentUser.id || inspiration.author.name === currentUser.name);
  const authorName = isAuthorMe ? currentUser.name : inspiration.author.name;
  const authorAvatar = isAuthorMe ? currentUser.avatar : inspiration.author.avatar;

  useEffect(() => {
    if (currentUser?.id) {
      hasLiked(inspiration.id, currentUser.id)
        .then(liked => setIsWatered(liked))
        .catch(() => setIsWatered(false));
    } else {
      setIsWatered(false);
    }
  }, [inspiration.id, currentUser?.id]);

  useEffect(() => {
    setLocalLikes(inspiration.stats.likes);
  }, [inspiration.stats.likes]);

  const handleWatering = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id || isProcessing.current || isWatered === null) return;
    isProcessing.current = true;
    try {
      const nowLiked = await likeInspiration(inspiration.id, currentUser.id);
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
      {/* 封面区域 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {hasImage ? (
          <img
            src={inspiration.image}
            alt={inspiration.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          /* 纯文字卡片：渐变背景 + 关键词放大 */
          <div
            className="w-full h-full flex flex-col items-center justify-center px-4 py-5 transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ background: `linear-gradient(145deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
          >
            {/* 装饰引号 */}
            <span
              className="text-5xl font-serif leading-none mb-1 opacity-30 select-none"
              style={{ color: gradient.text }}
            >"</span>

            {/* 主要文字：大字号 */}
            <p
              className="text-center font-bold leading-snug"
              style={{ color: gradient.text, fontSize: main.length <= 8 ? '22px' : main.length <= 14 ? '19px' : main.length <= 18 ? '16px' : '14px', lineHeight: 1.5 }}
            >
              {main}
            </p>

            {/* 副文字：小字号，有内容才显示 */}
            {rest && (
              <p
                className="text-center mt-2 opacity-70 line-clamp-2"
                style={{ color: gradient.text, fontSize: '11px', lineHeight: 1.5 }}
              >
                {rest}
              </p>
            )}

            {/* 标签 */}
            {inspiration.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
                {inspiration.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: gradient.tag, color: gradient.text }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 浇水按钮 */}
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

      {/* 卡片底部 */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-900 text-base font-bold leading-tight line-clamp-1">{inspiration.title}</h3>
          <div className="flex items-center gap-1 text-primary flex-shrink-0">
            <Droplets size={14} fill="currentColor" />
            <span className="text-xs font-bold">{localLikes}</span>
          </div>
        </div>
        {hasImage && (
          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
            {inspiration.description}
          </p>
        )}
        {hasImage && (
          <div className="flex flex-wrap gap-2 mt-1">
            {inspiration.tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div
          onClick={handleUserClick}
          className="flex items-center gap-2 mt-1 pt-3 border-t border-primary/5 hover:opacity-70 transition-opacity"
        >
          <img src={authorAvatar} alt={authorName} className="size-6 rounded-full bg-primary/20" referrerPolicy="no-referrer" loading="lazy" />
          <p className="text-slate-400 text-xs font-medium">@{authorName}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InspirationCard;
