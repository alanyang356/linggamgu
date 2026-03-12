import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Share2, Droplets, Sprout, Wheat, X, Send, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Inspiration, Screen, User } from '../types';
import { likeInspiration, collectInspiration, hasLiked, hasCollected, getComments, addComment, deleteComment, createNotification } from '../lib/api';

interface DetailScreenProps {
  inspiration: Inspiration;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onUserClick?: (user: any) => void;
  onEdit?: (inspiration: Inspiration) => void;
  currentUser?: User;
  currentUserId?: string;
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onSubmit: (text: string) => void;
}

const InputDialog = ({ isOpen, onClose, title, placeholder, onSubmit }: DialogProps) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  if (!isOpen) return null;
  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSubmit(text);
    setText('');
    setSending(false);
    onClose();
  };
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
            className="w-full h-32 p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none mb-6" />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            className="w-full h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} />发送</>}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default function DetailScreen({ inspiration, onBack, onNavigate, onUserClick, onEdit, currentUser, currentUserId }: DetailScreenProps) {
  const [isWatered, setIsWatered] = useState(false);
  const [likeCount, setLikeCount] = useState(inspiration.stats.likes);
  const [isHarvested, setIsHarvested] = useState(false);
  const [collectCount, setCollectCount] = useState(inspiration.stats.collections);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showHarvestToast, setShowHarvestToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean; title: string; placeholder: string; type: 'comment' | 'reply'; targetCommentId?: string;
  }>({ isOpen: false, title: '', placeholder: '', type: 'comment' });

  const isAuthorMe = currentUser && (inspiration.author.id === currentUser.id || inspiration.author.name === currentUser.name);
  const authorName = isAuthorMe ? currentUser.name : inspiration.author.name;
  const authorAvatar = isAuthorMe ? currentUser.avatar : inspiration.author.avatar;

  // 进入页面时：读取真实点赞/收藏状态 + 评论列表
  useEffect(() => {
    if (currentUserId) {
      hasLiked(inspiration.id, currentUserId).then(setIsWatered).catch(() => { });
      hasCollected(inspiration.id, currentUserId).then(setIsHarvested).catch(() => { });
    }
    getComments(inspiration.id)
      .then(setComments)
      .catch(() => setComments(inspiration.comments || []))
      .finally(() => setLoadingComments(false));
  }, [inspiration.id, currentUserId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setShowHarvestToast(true);
    setTimeout(() => setShowHarvestToast(false), 2000);
  };

  const handleAction = async (type: 'water' | 'fertilize' | 'harvest') => {
    if (!currentUserId) return;
    if (type === 'water') {
      // 乐观更新
      const newWatered = !isWatered;
      setIsWatered(newWatered);
      setLikeCount(prev => newWatered ? prev + 1 : Math.max(0, prev - 1));
      try {
        await likeInspiration(inspiration.id, currentUserId);
        if (newWatered && inspiration.author.id) {
          await createNotification({
            recipientId: inspiration.author.id, type: 'like',
            actorId: currentUserId, actorName: currentUser?.name || '用户',
            actorAvatar: currentUser?.avatar || '',
            targetId: inspiration.id, targetTitle: inspiration.title,
            content: `浇灌了你的灵感《${inspiration.title}》`,
          });
        }
        showToast(newWatered ? '💧 已浇水' : '取消浇水');
      } catch {
        // 失败回滚
        setIsWatered(!newWatered);
        setLikeCount(prev => newWatered ? Math.max(0, prev - 1) : prev + 1);
      }
    } else if (type === 'harvest') {
      const newHarvested = !isHarvested;
      setIsHarvested(newHarvested);
      setCollectCount(prev => newHarvested ? prev + 1 : Math.max(0, prev - 1));
      try {
        await collectInspiration(inspiration.id, currentUserId);
        if (newHarvested && inspiration.author.id) {
          await createNotification({
            recipientId: inspiration.author.id, type: 'collect',
            actorId: currentUserId, actorName: currentUser?.name || '用户',
            actorAvatar: currentUser?.avatar || '',
            targetId: inspiration.id, targetTitle: inspiration.title,
            content: `收藏了你的灵感《${inspiration.title}》`,
          });
        }
        showToast(newHarvested ? '🌾 已收获到收藏夹' : '取消收获');
      } catch {
        setIsHarvested(!newHarvested);
        setCollectCount(prev => newHarvested ? Math.max(0, prev - 1) : prev + 1);
      }
    } else if (type === 'fertilize') {
      setDialogConfig({ isOpen: true, title: '新增施肥记录', placeholder: '分享你的灵感见解...', type: 'comment' });
    }
  };

  const handleReply = (commentId: string, userName: string) => {
    setDialogConfig({ isOpen: true, title: `回复 ${userName}`, placeholder: `对 ${userName} 的施肥记录进行回复...`, type: 'reply', targetCommentId: commentId });
  };

  const handleSubmitInput = async (text: string) => {
    if (!currentUserId) return;
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      user: { name: currentUser?.name || '用户', avatar: currentUser?.avatar || '' },
      content: text, time: '刚刚',
    };
    await addComment({
      inspirationId: inspiration.id, authorId: currentUserId,
      authorName: currentUser?.name || '用户', authorAvatar: currentUser?.avatar || '', content: text,
    });
    if (inspiration.author.id) {
      await createNotification({
        recipientId: inspiration.author.id, type: 'comment',
        actorId: currentUserId, actorName: currentUser?.name || '用户',
        actorAvatar: currentUser?.avatar || '',
        targetId: inspiration.id, targetTitle: inspiration.title,
        content: `评论了你的灵感：${text}`,
      }).catch(() => { });
    }
    if (dialogConfig.type === 'comment') {
      setComments(prev => [newComment, ...prev]);
    } else if (dialogConfig.type === 'reply' && dialogConfig.targetCommentId) {
      setComments(prev => prev.map(c => c.id === dialogConfig.targetCommentId
        ? { ...c, replies: [...(c.replies || []), newComment] } : c));
    }
    showToast('💬 评论成功');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;
    if (!window.confirm('确定删除这条施肥记录吗？')) return;
    try {
      await deleteComment(commentId, currentUserId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast('已删除');
    } catch {
      showToast('删除失败，请重试');
    }
  };

  const userObj = (name: string, avatar: string, id?: string, stats?: any) => ({
    id: id || name, name, avatar, stats: stats || { planted: 0, harvested: 0, following: 0 }
  });

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2">
          {isAuthorMe && onEdit && (
            <button onClick={() => onEdit(inspiration)}
              className="size-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Edit2 size={18} />
            </button>
          )}
          <button onClick={() => { if (navigator.share) navigator.share({ title: inspiration.title, text: inspiration.description }); }}
            className="size-10 flex items-center justify-center bg-slate-100 rounded-full"><Share2 size={20} /></button>
        </div>
      </header>

      <div className="pt-20 px-4 space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl">
          <img src={inspiration.image} alt={inspiration.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight">{inspiration.title}</h1>
            <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
              <Droplets size={16} className="text-primary" fill="currentColor" />
              <span className="text-sm font-bold text-primary">{likeCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 cursor-pointer"
            onClick={() => onUserClick && onUserClick(userObj(authorName, authorAvatar, isAuthorMe ? currentUser?.id : inspiration.author.id, isAuthorMe ? currentUser?.stats : undefined))}>
            <img src={authorAvatar} className="size-10 rounded-full bg-slate-100" referrerPolicy="no-referrer" loading="lazy" />
            <div>
              <p className="font-bold hover:text-primary transition-colors">{authorName}</p>
              <p className="text-xs text-slate-400">灵感播种人</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {inspiration.tags.map((tag) => (
              <span key={tag} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">{tag}</span>
            ))}
          </div>

          {(inspiration.quote || inspiration.description) && (
            <div className="relative pl-6 py-2 border-l-4 border-primary/20">
              <p className="text-xl italic font-serif text-slate-700 leading-relaxed">"{inspiration.quote || inspiration.description}"</p>
            </div>
          )}

          {inspiration.content && inspiration.content !== inspiration.description && (
            <p className="text-slate-600 leading-relaxed text-lg">{inspiration.content}</p>
          )}
        </div>

        {/* 互动按钮 */}
        <div className="py-4 border-t border-slate-100">
          <div className="flex gap-4">
            <button onClick={() => handleAction('water')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isWatered ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}>
              <Droplets size={24} fill={isWatered ? 'currentColor' : 'none'} />
              <span className="text-xs font-bold">浇水 {likeCount > 0 ? likeCount : ''}</span>
            </button>
            <button onClick={() => handleAction('fertilize')}
              className="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Sprout size={24} />
              <span className="text-xs font-bold">施肥 {comments.length > 0 ? comments.length : ''}</span>
            </button>
            <button onClick={() => handleAction('harvest')}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isHarvested ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}>
              <Wheat size={24} fill={isHarvested ? 'currentColor' : 'none'} />
              <span className="text-xs font-bold">收获 {collectCount > 0 ? collectCount : ''}</span>
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <section className="space-y-6 pb-8">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Sprout className="text-primary" />
            <h2>施肥记录 ({comments.length})</h2>
          </div>
          {loadingComments ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary/30" size={24} /></div>
          ) : comments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">还没有施肥记录，来做第一个吧</p>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const isMe = currentUser && comment.user.name === currentUser.name;
                const uName = isMe ? currentUser.name : comment.user.name;
                const uAvatar = isMe ? currentUser.avatar : comment.user.avatar;
                return (
                  <div key={comment.id} className="space-y-4">
                    <div className="flex gap-3">
                      <img
                        src={uAvatar}
                        className="size-10 rounded-full bg-slate-100 cursor-pointer"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onClick={() => onUserClick && onUserClick(userObj(uName, uAvatar))}
                      />
                      <div className="flex-1 space-y-1">
                        <span className="font-bold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => onUserClick && onUserClick(userObj(uName, uAvatar))}>{uName}</span>
                        <p className="text-slate-600">{comment.content}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>{comment.time}</span>
                          <button onClick={() => handleReply(comment.id, uName)} className="text-primary font-bold hover:underline">回复</button>
                          {currentUser && comment.user.name === currentUser.name && (
                            <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {comment.replies?.map((reply: any) => {
                      const rMe = currentUser && reply.user.name === currentUser.name;
                      const rName = rMe ? currentUser.name : reply.user.name;
                      const rAvatar = rMe ? currentUser.avatar : reply.user.avatar;
                      return (
                        <div key={reply.id} className="pl-12 flex gap-3">
                          <img
                            src={rAvatar}
                            className="size-8 rounded-full bg-slate-100 cursor-pointer"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onClick={() => onUserClick && onUserClick(userObj(rName, rAvatar))}
                          />
                          <div className="flex-1 space-y-1">
                            <span className="font-bold text-sm cursor-pointer hover:text-primary transition-colors"
                              onClick={() => onUserClick && onUserClick(userObj(rName, rAvatar))}>{rName}</span>
                            <p className="text-sm text-slate-600">{reply.content}</p>
                            <div className="flex items-center gap-4 text-[10px] text-slate-400">
                              <span>{reply.time}</span>
                              <button onClick={() => handleReply(comment.id, rName)} className="text-primary font-bold hover:underline">回复</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Toast 提示 */}
      <AnimatePresence>
        {showHarvestToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold shadow-xl whitespace-nowrap">
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <InputDialog isOpen={dialogConfig.isOpen} onClose={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
        title={dialogConfig.title} placeholder={dialogConfig.placeholder} onSubmit={handleSubmitInput} />
    </div>
  );
}
